// Apple Push Notification Service for Wallet Pass Updates
// Uses HTTP/2 to communicate with APNs
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const PASS_TYPE_ID = 'pass.com.creamcoffee.loyalty';
const TEAM_ID = '98824WN2H8';

// APNs endpoints
const APNS_HOST = 'api.push.apple.com'; // Production
// const APNS_HOST = 'api.sandbox.push.apple.com'; // Sandbox/Development

const certsPath = path.join(__dirname, 'certs');

// Read certificates
let signerCert, signerKey;
try {
    signerCert = fs.readFileSync(path.join(certsPath, 'signerCert.pem'));
    signerKey = fs.readFileSync(path.join(certsPath, 'signerKey.pem'));
    console.log('✅ APNs certificates loaded');
} catch (error) {
    console.error('❌ Failed to load APNs certificates:', error.message);
}

/**
 * Send a push notification to Apple Wallet to trigger a pass update
 * @param {string} pushToken - The device push token
 * @returns {Promise<boolean>} - Success status
 */
async function sendPassUpdate(pushToken) {
    return new Promise((resolve, reject) => {
        if (!signerCert || !signerKey) {
            console.error('APNs certificates not loaded');
            return reject(new Error('APNs certificates not available'));
        }

        console.log(`📤 Sending APNs push to token: ${pushToken.substring(0, 20)}...`);

        const client = http2.connect(`https://${APNS_HOST}:443`, {
            cert: signerCert,
            key: signerKey,
            passphrase: 'creamcoff3669'
        });

        client.on('error', (err) => {
            console.error('APNs connection error:', err);
            reject(err);
        });

        const headers = {
            ':method': 'POST',
            ':path': `/3/device/${pushToken}`,
            'apns-topic': PASS_TYPE_ID,
            'apns-push-type': 'background',
            'apns-priority': '5'
        };

        const request = client.request(headers);

        let responseData = '';

        request.on('response', (headers) => {
            const status = headers[':status'];
            if (status === 200) {
                console.log(`✅ APNs push successful`);
                resolve(true);
            } else {
                console.log(`⚠️ APNs push returned status: ${status}`);
            }
        });

        request.on('data', (chunk) => {
            responseData += chunk;
        });

        request.on('end', () => {
            if (responseData) {
                console.log('APNs response:', responseData);
            }
            client.close();
        });

        request.on('error', (err) => {
            console.error('APNs request error:', err);
            client.close();
            reject(err);
        });

        // Empty payload for pass updates
        request.write(JSON.stringify({}));
        request.end();
    });
}

/**
 * Send push notifications to multiple devices
 * @param {string[]} pushTokens - Array of push tokens
 * @returns {Promise<{sent: number, failed: number}>}
 */
async function sendPassUpdateToMany(pushTokens) {
    let sent = 0;
    let failed = 0;

    for (const token of pushTokens) {
        try {
            await sendPassUpdate(token);
            sent++;
        } catch (error) {
            console.error(`Push failed for token ${token.substring(0, 20)}...`);
            failed++;
        }
    }

    return { sent, failed };
}

module.exports = { sendPassUpdate, sendPassUpdateToMany };

console.log('✅ APNs push module loaded');
