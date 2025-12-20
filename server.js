const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// PostgreSQL connection to Hetzner
const pool = new Pool({
    host: '46.224.113.138',
    port: 5432,
    database: 'cream_crm',
    user: 'cream_admin',
    password: 'CreamCoffee2024!'
});

// Import wallet modules
const { generatePass } = require('./wallet-pass');
const { sendPassUpdate } = require('./apns-push');
const { router: walletRouter, initWalletService, triggerPassUpdate } = require('./wallet-service');

// Initialize wallet service with dependencies
initWalletService(pool, generatePass, sendPassUpdate);

// Mount wallet routes at /wallet
app.use('/wallet', walletRouter);
console.log('🍎 Apple Wallet web service mounted at /wallet');

// Generate unique member ID
function generateMemberId() {
    return 'CREAM-' + Math.floor(100000 + Math.random() * 900000);
}

// Register new member
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, birthday, gender } = req.body;
        const memberId = generateMemberId();
        
        const result = await pool.query(
            `INSERT INTO members (member_id, name, email, phone, birthday, gender, stamps, total_rewards, available_rewards)
             VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0)
             RETURNING *`,
            [memberId, name, email, phone || null, birthday || null, gender || null]
        );
        
        console.log('New member registered:', result.rows[0]);
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, error: 'Email already registered' });
        } else {
            res.status(500).json({ success: false, error: 'Registration failed' });
        }
    }
});

// Get all members
app.get('/api/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Get member by ID
app.get('/api/members/:memberId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members WHERE member_id = $1', [req.params.memberId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Member not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch member' });
    }
});

// Add stamp to member - NOW WITH AUTOMATIC PASS UPDATE
app.post('/api/members/:memberId/stamp', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        // Get current stamps
        const member = await pool.query('SELECT * FROM members WHERE member_id = $1', [memberId]);
        if (member.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        let stamps = member.rows[0].stamps + 1;
        let availableRewards = member.rows[0].available_rewards;
        let totalRewards = member.rows[0].total_rewards;
        
        // Check if earned a reward
        if (stamps >= 6) {
            stamps = 0;
            availableRewards++;
            totalRewards++;
            
            // Add to reward history
            await pool.query(
                `INSERT INTO reward_history (member_id, type, description) VALUES ($1, 'earned', 'Free drink earned')`,
                [member.rows[0].id]
            );
        }
        
        const result = await pool.query(
            `UPDATE members SET stamps = $1, available_rewards = $2, total_rewards = $3, updated_at = NOW()
             WHERE member_id = $4 RETURNING *`,
            [stamps, availableRewards, totalRewards, memberId]
        );
        
        // Trigger Apple Wallet pass update
        try {
            await triggerPassUpdate(memberId);
            console.log(`📱 Pass update triggered for: ${memberId}`);
        } catch (pushError) {
            console.error('Pass update push failed:', pushError.message);
            // Don't fail the stamp operation if push fails
        }
        
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        console.error('Error adding stamp:', error);
        res.status(500).json({ error: 'Failed to add stamp' });
    }
});

// Redeem reward - ALSO WITH PASS UPDATE
app.post('/api/members/:memberId/redeem', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const member = await pool.query('SELECT * FROM members WHERE member_id = $1', [memberId]);
        if (member.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        if (member.rows[0].available_rewards < 1) {
            return res.status(400).json({ error: 'No rewards available' });
        }
        
        // Add to reward history
        await pool.query(
            `INSERT INTO reward_history (member_id, type, description) VALUES ($1, 'redeemed', 'Free drink redeemed')`,
            [member.rows[0].id]
        );
        
        const result = await pool.query(
            `UPDATE members SET available_rewards = available_rewards - 1, updated_at = NOW()
             WHERE member_id = $1 RETURNING *`,
            [memberId]
        );
        
        // Trigger Apple Wallet pass update
        try {
            await triggerPassUpdate(memberId);
            console.log(`📱 Pass update triggered for: ${memberId}`);
        } catch (pushError) {
            console.error('Pass update push failed:', pushError.message);
        }
        
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        console.error('Error redeeming:', error);
        res.status(500).json({ error: 'Failed to redeem reward' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 C.R.E.A.M. CRM Server running on http://localhost:${PORT}`);
    console.log(`📱 QR Code page: http://localhost:${PORT}/qrcode.html`);
    console.log(`📝 Registration: http://localhost:${PORT}/register.html`);
});

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
    try {
        const totalMembers = await pool.query('SELECT COUNT(*) as count FROM members');
        const totalStamps = await pool.query('SELECT SUM(stamps) as total FROM members');
        const totalRewards = await pool.query('SELECT SUM(total_rewards) as total FROM members');
        const todayMembers = await pool.query("SELECT COUNT(*) as count FROM members WHERE DATE(created_at) = CURRENT_DATE");
        
        res.json({
            totalMembers: parseInt(totalMembers.rows[0].count),
            totalStamps: parseInt(totalStamps.rows[0].total) || 0,
            totalRewards: parseInt(totalRewards.rows[0].total) || 0,
            todayMembers: parseInt(todayMembers.rows[0].count)
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get reward history for a member
app.get('/api/members/:memberId/history', async (req, res) => {
    try {
        const member = await pool.query('SELECT id FROM members WHERE member_id = $1', [req.params.memberId]);
        if (member.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        const history = await pool.query(
            'SELECT * FROM reward_history WHERE member_id = $1 ORDER BY created_at DESC',
            [member.rows[0].id]
        );
        res.json(history.rows);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Search members
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        const result = await pool.query(
            `SELECT * FROM members WHERE 
             name ILIKE $1 OR 
             email ILIKE $1 OR 
             member_id ILIKE $1 
             ORDER BY created_at DESC LIMIT 20`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

console.log('✅ Additional API endpoints loaded');

// Apple Wallet Pass Generation
app.get('/api/pass/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        // Get member from database
        const result = await pool.query('SELECT * FROM members WHERE member_id = $1', [memberId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        const member = result.rows[0];
        
        // Generate the pass
        const passBuffer = await generatePass(member);
        
        // Send the pass file
        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="${memberId}.pkpass"`
        });
        res.send(passBuffer);
        
        console.log('Generated pass for:', memberId);
    } catch (error) {
        console.error('Pass generation error:', error);
        res.status(500).json({ error: 'Failed to generate pass', details: error.message });
    }
});

console.log('🍎 Apple Wallet pass endpoint: /api/pass/:memberId');
console.log('📲 Automatic pass updates enabled!');
