const http2 = require("http2");
const fs = require("fs");
const path = require("path");

const PASS_TYPE_ID = "pass.com.creamcoffee.loyalty";
const APNS_HOST = "api.push.apple.com"; // Production

const certsPath = path.join(__dirname, "certs");

let signerCert, signerKey;
try {
    signerCert = fs.readFileSync(path.join(certsPath, "signerCert.pem"));
    signerKey = fs.readFileSync(path.join(certsPath, "signerKey.pem"));
    console.log("APNs certificates loaded");
} catch (error) {
    console.error("Failed to load APNs certificates:", error.message);
}

async function sendPassUpdate(pushToken) {
    return new Promise((resolve, reject) => {
        if (!signerCert || !signerKey) {
            return reject(new Error("APNs certificates not available"));
        }

        console.log("Sending APNs push to token:", pushToken.substring(0, 10) + "...");

        const client = http2.connect("https://" + APNS_HOST + ":443", {
            cert: signerCert,
            key: signerKey,
            passphrase: "creamcoff3669"
        });

        client.on("error", (err) => {
            console.error("APNs connection error:", err);
            reject(err);
        });

        const headers = {
            ":method": "POST",
            ":path": "/3/device/" + pushToken,
            "apns-topic": PASS_TYPE_ID,
            "apns-push-type": "background",
            "apns-priority": "5" 
        };
        // Removed apns-expiration to ensure stability as requested

        const request = client.request(headers);

        request.on("response", (headers) => {
            const status = headers[":status"];
            console.log("APNs push status:", status);
            resolve(true); // Always resolve if we get a response
        });

        request.on("data", (chunk) => {
            // Ignore response body for now
        });

        request.on("end", () => {
            client.close();
        });

        request.on("error", (err) => {
            console.error("APNs request error:", err);
            client.close();
            reject(err);
        });

        request.write("{}");
        request.end();
    });
}

module.exports = { sendPassUpdate };
