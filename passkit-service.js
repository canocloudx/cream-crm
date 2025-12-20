// Apple PassKit Web Service for C.R.E.A.M. Coffee
// Handles device registration and pass updates

const AUTH_TOKEN = 'creamcoffee2024secrettoken';
const PASS_TYPE_ID = 'pass.com.creamcoffee.loyalty';

function validateAuth(req) {
    const auth = req.headers.authorization;
    if (!auth) return false;
    const token = auth.replace('ApplePass ', '');
    return token === AUTH_TOKEN;
}

function setupPasskitRoutes(app, pool, generatePass) {
    
    // Device Registration - called when pass is added to Wallet
    app.post('/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber', async (req, res) => {
        try {
            if (!validateAuth(req)) {
                return res.status(401).send('Unauthorized');
            }
            
            const { deviceId, passTypeId, serialNumber } = req.params;
            const { pushToken } = req.body;
            
            console.log('📱 Device registration:', { deviceId, passTypeId, serialNumber, pushToken });
            
            // Store registration
            await pool.query(
                `INSERT INTO pass_registrations (device_id, push_token, pass_type_id, serial_number)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (device_id, pass_type_id, serial_number) 
                 DO UPDATE SET push_token = $2`,
                [deviceId, pushToken, passTypeId, serialNumber]
            );
            
            res.status(201).send();
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).send();
        }
    });
    
    // Device Unregistration - called when pass is removed from Wallet
    app.delete('/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber', async (req, res) => {
        try {
            if (!validateAuth(req)) {
                return res.status(401).send('Unauthorized');
            }
            
            const { deviceId, passTypeId, serialNumber } = req.params;
            
            console.log('📱 Device unregistration:', { deviceId, passTypeId, serialNumber });
            
            await pool.query(
                `DELETE FROM pass_registrations 
                 WHERE device_id = $1 AND pass_type_id = $2 AND serial_number = $3`,
                [deviceId, passTypeId, serialNumber]
            );
            
            res.status(200).send();
        } catch (error) {
            console.error('Unregistration error:', error);
            res.status(500).send();
        }
    });
    
    // Get list of passes that need updating
    app.get('/v1/devices/:deviceId/registrations/:passTypeId', async (req, res) => {
        try {
            if (!validateAuth(req)) {
                return res.status(401).send('Unauthorized');
            }
            
            const { deviceId, passTypeId } = req.params;
            const passesUpdatedSince = req.query.passesUpdatedSince;
            
            console.log('📱 Checking for updates:', { deviceId, passTypeId, passesUpdatedSince });
            
            // Get all passes registered to this device
            const registrations = await pool.query(
                `SELECT serial_number FROM pass_registrations 
                 WHERE device_id = $1 AND pass_type_id = $2`,
                [deviceId, passTypeId]
            );
            
            if (registrations.rows.length === 0) {
                return res.status(204).send();
            }
            
            // Get members that have been updated
            const serialNumbers = registrations.rows.map(r => r.serial_number);
            let query = `SELECT member_id FROM members WHERE member_id = ANY($1)`;
            let params = [serialNumbers];
            
            if (passesUpdatedSince) {
                query += ` AND pass_updated_at > $2`;
                params.push(new Date(passesUpdatedSince));
            }
            
            const members = await pool.query(query, params);
            
            if (members.rows.length === 0) {
                return res.status(204).send();
            }
            
            res.json({
                serialNumbers: members.rows.map(m => m.member_id),
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get updates error:', error);
            res.status(500).send();
        }
    });
    
    // Get updated pass
    app.get('/v1/passes/:passTypeId/:serialNumber', async (req, res) => {
        try {
            if (!validateAuth(req)) {
                return res.status(401).send('Unauthorized');
            }
            
            const { serialNumber } = req.params;
            
            console.log('📱 Serving updated pass:', serialNumber);
            
            // Get member data
            const result = await pool.query(
                'SELECT * FROM members WHERE member_id = $1',
                [serialNumber]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).send('Pass not found');
            }
            
            const member = result.rows[0];
            
            // Generate updated pass
            const passBuffer = await generatePass(member);
            
            res.set({
                'Content-Type': 'application/vnd.apple.pkpass',
                'Last-Modified': new Date().toUTCString()
            });
            res.send(passBuffer);
        } catch (error) {
            console.error('Serve pass error:', error);
            res.status(500).send();
        }
    });
    
    // Log endpoint - for debugging
    app.post('/v1/log', (req, res) => {
        console.log('📱 PassKit Log:', req.body);
        res.status(200).send();
    });
    
    console.log('✅ PassKit Web Service endpoints loaded');
}

// Function to notify devices of pass update
async function notifyPassUpdate(pool, memberId) {
    try {
        // Update the pass_updated_at timestamp
        await pool.query(
            `UPDATE members SET pass_updated_at = NOW() WHERE member_id = $1`,
            [memberId]
        );
        
        // Get all registered devices for this pass
        const registrations = await pool.query(
            `SELECT push_token FROM pass_registrations WHERE serial_number = $1`,
            [memberId]
        );
        
        if (registrations.rows.length === 0) {
            console.log('No devices registered for pass:', memberId);
            return;
        }
        
        console.log(`Found ${registrations.rows.length} registered devices for pass:`, memberId);
        
        // Note: For actual APNs push, you need to install and configure @parse/node-apn
        // For now, we just update the timestamp and devices will check on next open
        
    } catch (error) {
        console.error('Notify pass update error:', error);
    }
}

module.exports = { setupPasskitRoutes, notifyPassUpdate, PASS_TYPE_ID };
