// Apple Wallet Pass Generator for C.R.E.A.M. Coffee
const { PKPass } = require("passkit-generator");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const certsPath = path.join(__dirname, "certs");

function generateAuthToken(memberId) {
    return crypto.createHash('sha256').update(memberId + 'cream-secret-2024').digest('hex').substring(0, 32);
}

async function generatePass(member) {
    try {
        const memberName = member.name || "Member";
        const stamps = member.stamps || 0;
        const rewards = member.available_rewards || member.availableRewards || 0;
        const memberId = member.member_id || member.memberId || "CREAM-000000";
        
        console.log("Generating pass for:", memberName, memberId, "Stamps:", stamps);
        
        const authToken = generateAuthToken(memberId);
        
        // DYNAMIC STRIP
        const safeStamps = Math.min(Math.max(stamps, 0), 6);
        const stripPath = path.join(__dirname, "punch-cards", "strip_" + safeStamps + ".png");
        let stripBuffer;
        if (fs.existsSync(stripPath)) {
            stripBuffer = fs.readFileSync(stripPath);
        } else {
            const defaultStrip = path.join(__dirname, "punch-cards", "strip_0.png");
            if (fs.existsSync(defaultStrip)) stripBuffer = fs.readFileSync(defaultStrip);
        }

        const pass = await PKPass.from({
            model: path.join(__dirname, "pass-template.pass"),
            certificates: {
                wwdr: fs.readFileSync(path.join(certsPath, "wwdr.pem")),
                signerCert: fs.readFileSync(path.join(certsPath, "signerCert.pem")),
                signerKey: fs.readFileSync(path.join(certsPath, "signerKey.pem")),
                signerKeyPassphrase: "creamcoff3669"
            }
        }, {
            serialNumber: memberId,
            authenticationToken: authToken
        });

        if (stripBuffer) {
            pass.addBuffer("strip.png", stripBuffer);
            pass.addBuffer("strip@2x.png", stripBuffer);
        }

        // --- LAYOUT CONFIGURATION ---

        // 1. Header: Stamps (Top Right)
        pass.headerFields.push({
            key: "stamps",
            label: "STAMPS",
            value: stamps + "/6",
            textAlignment: "PKTextAlignmentRight"
        });

        // 2. Primary: EMPTY (User wanted Name moved down)
        // pass.primaryFields.push(...) 

        // 3. Secondary: THE BOTTOM ROW (Left, Center, Right)
        // Item 1: Member Name (Left)
        pass.secondaryFields.push({
            key: "member",
            label: "MEMBER",
            value: memberName,
            textAlignment: "PKTextAlignmentLeft"
        });

        // Item 2: Free Drinks (Center)
        pass.secondaryFields.push({
            key: "rewards",
            label: "FREE DRINKS",
            value: String(rewards),
            textAlignment: "PKTextAlignmentCenter"
        });

        // Item 3: Member ID (Right)
        pass.secondaryFields.push({
            key: "memberId",
            label: "MEMBER ID",
            value: memberId,
            textAlignment: "PKTextAlignmentRight"
        });
        
        // 4. Auxiliary: Empty (Using Secondary for the main bottom row)
        // If we put them in Auxiliary, they are smaller. Secondary is better for "Name".

        // Back Fields
        if (member.latest_message_title && member.latest_message_body) {
            pass.backFields.push({
                key: "message",
                label: member.latest_message_title,
                value: member.latest_message_body,
                changeMessage: "📬 New message: %@"
            });
        }

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

        pass.setBarcodes({
            format: "PKBarcodeFormatQR",
            message: memberId,
            messageEncoding: "iso-8859-1"
        });

        const buffer = pass.getAsBuffer();
        return buffer;
    } catch (error) {
        console.error("Pass generation error:", error);
        throw error;
    }
}

module.exports = { generatePass, generateAuthToken };
console.log("✅ Wallet: Layout updated (Name Left, Rewards Center, ID Right)");
