// Apple Wallet Pass Generator for C.R.E.A.M. Coffee
const { PKPass } = require("passkit-generator");
const path = require("path");
const fs = require("fs");

const certsPath = path.join(__dirname, "certs");

async function generatePass(member) {
    try {
        // Get member data with defaults
        const memberName = member.name || "Member";
        const stamps = member.stamps || 0;
        const rewards = member.available_rewards || member.availableRewards || 0;
        const memberId = member.member_id || member.memberId || "CREAM-000000";
        
        console.log("Generating pass for:", memberName, memberId, "Stamps:", stamps);
        
        // Create pass with base configuration
        const pass = await PKPass.from({
            model: path.join(__dirname, "pass-template.pass"),
            certificates: {
                wwdr: fs.readFileSync(path.join(certsPath, "wwdr.pem")),
                signerCert: fs.readFileSync(path.join(certsPath, "signerCert.pem")),
                signerKey: fs.readFileSync(path.join(certsPath, "signerKey.pem")),
                signerKeyPassphrase: "creamcoff3669"
            }
        }, {
            serialNumber: memberId
        });

        // Use the library's push methods to add fields
        pass.headerFields.push({
            key: "stamps",
            label: "STAMPS",
            value: `${stamps}/6`
        });

        pass.primaryFields.push({
            key: "member",
            label: "MEMBER",
            value: memberName
        });

        pass.secondaryFields.push({
            key: "rewards",
            label: "FREE DRINKS",
            value: String(rewards)
        });

        pass.auxiliaryFields.push({
            key: "memberId",
            label: "MEMBER ID",
            value: memberId
        });

        pass.backFields.push({
            key: "terms",
            label: "How It Works",
            value: "☕ Collect 6 stamps to earn a FREE drink!\n\n🎁 Present this pass when making a purchase.\n\n🎉 When you reach 6 stamps, you get a free drink!"
        });

        pass.backFields.push({
            key: "contact",
            label: "Contact Us",
            value: "📍 C.R.E.A.M. Paspatur\n📱 05336892009"
        });

        // Set barcode with member ID
        pass.setBarcodes({
            format: "PKBarcodeFormatQR",
            message: memberId,
            messageEncoding: "iso-8859-1"
        });

        console.log("Pass created for:", memberName, "ID:", memberId);

        // Generate the pass buffer
        const buffer = pass.getAsBuffer();
        return buffer;
    } catch (error) {
        console.error("Pass generation error:", error);
        throw error;
    }
}

module.exports = { generatePass };
console.log("✅ Apple Wallet pass generator loaded");
