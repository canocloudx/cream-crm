// Apple Wallet Web Service for C.R.E.A.M. Coffee
// Implements Apple's PassKit Web Service API for pass updates
const express = require('express');
const router = express.Router();

// Database pool will be passed in
let pool;
let generatePass;
let sendPassUpdate;

function initWalletService(dbPool, passGenerator, pushFunction) {
    pool = dbPool;
    generatePass = passGenerator;
    sendPassUpdate = pushFunction;
}

const PASS_TYPE_ID = 'pass.com.creamcoffee.loyalty';

// Middleware to verify authorization token
function verifyAuthToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        console.log('Missing or invalid authorization header');
        return res.status(401).send('Unauthorized');
    }
    req.authToken = authHeader.replace('ApplePass ', '');
    next();
}

// POST /wallet/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
// Register a device to receive push notifications for a pass
router.post('/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber', verifyAuthToken, async (req, res) => {
    try {
        const { deviceId, passTypeId, serialNumber } = req.params;
        const { pushToken } = req.body;
        
        console.log(`📱 Device registration: ${deviceId} for pass ${serialNumber}`);
        console.log(`   Push token: ${pushToken}`);
        
        // Store the registration
        await pool.query(
            `INSERT INTO pass_registrations (device_library_id, push_token, pass_type_id, serial_number)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (device_library_id, pass_type_id, serial_number) 
             DO UPDATE SET push_token = $2`,
            [deviceId, pushToken, passTypeId, serialNumber]
        );
        
        console.log(`✅ Pass registered for device: ${deviceId}`);
        res.status(201).send('Created');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// DELETE /wallet/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
// Unregister a device from a pass
router.delete('/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber', verifyAuthToken, async (req, res) => {
    try {
        const { deviceId, passTypeId, serialNumber } = req.params;
        
        console.log(`📱 Device unregistration: ${deviceId} for pass ${serialNumber}`);
        
        await pool.query(
            `DELETE FROM pass_registrations 
             WHERE device_library_id = $1 AND pass_type_id = $2 AND serial_number = $3`,
            [deviceId, passTypeId, serialNumber]
        );
        
        console.log(`✅ Pass unregistered for device: ${deviceId}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Unregistration error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /wallet/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
// Get serial numbers for passes registered to a device that have been updated
router.get('/v1/devices/:deviceId/registrations/:passTypeId', async (req, res) => {
    try {
        const { deviceId, passTypeId } = req.params;
        const passesUpdatedSince = req.query.passesUpdatedSince;
        
        console.log(`📱 Checking updates for device: ${deviceId}`);
        
        // Get all serial numbers registered to this device
        let query = `
            SELECT pr.serial_number, m.updated_at 
            FROM pass_registrations pr
            JOIN members m ON pr.serial_number = m.member_id
            WHERE pr.device_library_id = $1 AND pr.pass_type_id = $2
        `;
        const params = [deviceId, passTypeId];
        
        if (passesUpdatedSince) {
            const updateDate = new Date(parseInt(passesUpdatedSince) * 1000);
            query += ` AND m.updated_at > $3`;
            params.push(updateDate);
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(204).send('No Content');
        }
        
        const serialNumbers = result.rows.map(r => r.serial_number);
        const lastUpdated = Math.max(...result.rows.map(r => new Date(r.updated_at).getTime() / 1000));
        
        console.log(`✅ Returning ${serialNumbers.length} updated passes`);
        res.json({
            serialNumbers: serialNumbers,
            lastUpdated: String(Math.floor(lastUpdated))
        });
    } catch (error) {
        console.error('Get updates error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// GET /wallet/v1/passes/{passTypeIdentifier}/{serialNumber}
// Get the latest version of a pass
router.get('/v1/passes/:passTypeId/:serialNumber', verifyAuthToken, async (req, res) => {
    try {
        const { serialNumber } = req.params;
        
        console.log(`📱 Serving updated pass for: ${serialNumber}`);
        
        // Get member from database
        const result = await pool.query('SELECT * FROM members WHERE member_id = $1', [serialNumber]);
        
        if (result.rows.length === 0) {
            console.log(`❌ Member not found: ${serialNumber}`);
            return res.status(404).send('Pass not found');
        }
        
        const member = result.rows[0];
        
        // Generate updated pass
        const passBuffer = await generatePass(member);
        
        // Get last modified time
        const lastModified = new Date(member.updated_at).toUTCString();
        
        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Last-Modified': lastModified
        });
        res.send(passBuffer);
        
        console.log(`✅ Updated pass served for: ${serialNumber}`);
    } catch (error) {
        console.error('Get pass error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// POST /wallet/v1/log
// Log messages from Apple Wallet (for debugging)
router.post('/v1/log', (req, res) => {
    const { logs } = req.body;
    if (logs && logs.length) {
        console.log('📋 Apple Wallet logs:');
        logs.forEach(log => console.log(`   ${log}`));
    }
    res.status(200).send('OK');
});

// Helper function to trigger push updates for a member
async function triggerPassUpdate(memberId) {
    try {
        // Get all device registrations for this pass
        const result = await pool.query(
            `SELECT push_token FROM pass_registrations WHERE serial_number = $1`,
            [memberId]
        );
        
        if (result.rows.length === 0) {
            console.log(`ℹ️ No devices registered for pass: ${memberId}`);
            return { sent: 0 };
        }
        
        // Send push to each device
        let sent = 0;
        for (const row of result.rows) {
            try {
                await sendPassUpdate(row.push_token);
                sent++;
            } catch (err) {
                console.error(`Push failed for token: ${row.push_token}`, err);
            }
        }
        
        console.log(`✅ APNs push sent for: ${memberId} (${sent} devices)`);
        return { sent };
    } catch (error) {
        console.error('Trigger update error:', error);
        throw error;
    }
}

module.exports = { 
    router, 
    initWalletService, 
    triggerPassUpdate,
    PASS_TYPE_ID 
};

console.log('✅ Apple Wallet web service loaded');
