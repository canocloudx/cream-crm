const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// ============================================
// Import monitoring and documentation modules
// ============================================
let logger, metricsMiddleware, register, updateMemberStats, metrics;
let swaggerUi, specs, uiOptions;

// Try to load optional modules (graceful fallback)
try {
    const loggerModule = require('./logger');
    logger = loggerModule;
} catch (err) {
    // Fallback to console logging
    logger = {
        info: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.log,
        requestLogger: (req, res, next) => next()
    };
}

try {
    const metricsModule = require('./metrics');
    metricsMiddleware = metricsModule.metricsMiddleware;
    register = metricsModule.register;
    updateMemberStats = metricsModule.updateMemberStats;
    metrics = metricsModule.metrics;
} catch (err) {
    console.warn('Metrics module not available:', err.message);
}

try {
    const swaggerModule = require('./swagger');
    swaggerUi = swaggerModule.swaggerUi;
    specs = swaggerModule.specs;
    uiOptions = swaggerModule.uiOptions;
} catch (err) {
    console.warn('Swagger module not available:', err.message);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Apply metrics middleware if available
if (metricsMiddleware) {
    app.use(metricsMiddleware);
}

// Apply request logging middleware if available
if (logger.requestLogger) {
    app.use(logger.requestLogger);
}

// PostgreSQL connection - uses environment variables or defaults to localhost
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cream_crm',
    user: process.env.DB_USER || 'cream_admin',
    password: process.env.DB_PASSWORD || 'CreamCoffee2024!'
});

// Import wallet modules
const { generatePass } = require('./wallet-pass');
const { sendPassUpdate } = require('./apns-push');
const { router: walletRouter, initWalletService, triggerPassUpdate } = require('./wallet-service');

// Initialize wallet service with dependencies
initWalletService(pool, generatePass, sendPassUpdate);

// Mount wallet routes at /wallet
app.use('/wallet', walletRouter);
logger.info('🍎 Apple Wallet web service mounted at /wallet');

// ============================================
// SWAGGER API DOCUMENTATION
// ============================================
if (swaggerUi && specs) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));
    logger.info('�� API Documentation available at /api-docs');
}

// ============================================
// PROMETHEUS METRICS ENDPOINT
// ============================================
if (register) {
    /**
     * @swagger
     * /metrics:
     *   get:
     *     summary: Prometheus metrics endpoint
     *     description: Returns application metrics in Prometheus format
     *     tags: [Monitoring]
     *     responses:
     *       200:
     *         description: Prometheus metrics
     *         content:
     *           text/plain:
     *             schema:
     *               type: string
     */
    app.get('/metrics', async (req, res) => {
        try {
            // Update member stats before returning metrics
            if (updateMemberStats) {
                await updateMemberStats(pool);
            }
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (err) {
            logger.error('Metrics error:', err);
            res.status(500).end(err.message);
        }
    });
    logger.info('📊 Prometheus metrics available at /metrics');
}

// Generate unique member ID
function generateMemberId() {
    return 'CREAM-' + Math.floor(100000 + Math.random() * 900000);
}

// Log transaction helper
async function logTransaction(memberId, type, data = {}, options = {}) {
    try {
        const { campaign_id, shop, user_name, panel } = options;
        await pool.query(
            `INSERT INTO transactions (member_id, transaction_type, transaction_data, campaign_id, shop, user_name, panel)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [memberId, type, JSON.stringify(data), campaign_id || null, shop || 'C.R.E.A.M. Paspatur', user_name || 'Admin', panel || 'crm']
        );
    } catch (err) {
        logger.error('Transaction log failed:', err.message);
    }
}

// ============================================
// API ENDPOINTS WITH SWAGGER DOCUMENTATION
// ============================================

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new member
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MemberCreate'
 *     responses:
 *       200:
 *         description: Member registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Email already registered
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
        
        logger.info('New member registered:', { memberId, name, email });
        
        // Track registration metric
        if (metrics && metrics.newRegistrations) {
            metrics.newRegistrations.inc({ source: 'api' });
        }
        
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        logger.error('Registration error:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, error: 'Email already registered' });
        } else {
            res.status(500).json({ success: false, error: 'Registration failed' });
        }
    }
});

/**
 * @swagger
 * /members:
 *   get:
 *     summary: Get all members
 *     tags: [Members]
 *     responses:
 *       200:
 *         description: List of all members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 */
app.get('/api/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

/**
 * @swagger
 * /members/{memberId}:
 *   get:
 *     summary: Get a member by ID
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID (e.g., CREAM-123456)
 *     responses:
 *       200:
 *         description: Member details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.get('/api/members/:memberId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM members WHERE member_id = $1', [req.params.memberId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Member not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        logger.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch member' });
    }
});

/**
 * @swagger
 * /members/{memberId}/stamp:
 *   post:
 *     summary: Add a stamp to member's card
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stamp added successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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
            logger.info(`📱 Pass update triggered for: ${memberId}`);
        } catch (pushError) {
            logger.error('Pass update push failed:', pushError.message);
            // Don't fail the stamp operation if push fails
        }
        
        // Track stamp metric
        if (metrics && metrics.stampsAdded) {
            metrics.stampsAdded.inc({ source: 'crm' });
        }
        
        // Log transaction
        await logTransaction(member.rows[0].id, 'stamp', { stamps_added: 1, new_total: stamps }, { panel: 'crm' });
        
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        logger.error('Error adding stamp:', error);
        res.status(500).json({ error: 'Failed to add stamp' });
    }
});

/**
 * @swagger
 * /members/{memberId}/redeem:
 *   post:
 *     summary: Redeem a reward
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
 *       400:
 *         description: No rewards available
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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
            logger.info(`📱 Pass update triggered for: ${memberId}`);
        } catch (pushError) {
            logger.error('Pass update push failed:', pushError.message);
        }
        
        // Track redemption metric
        if (metrics && metrics.rewardsRedeemed) {
            metrics.rewardsRedeemed.inc();
        }
        
        // Log transaction
        await logTransaction(member.rows[0].id, 'redeem', { reward_type: 'free_drink' }, { panel: 'crm' });
        
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        logger.error('Error redeeming:', error);
        res.status(500).json({ error: 'Failed to redeem reward' });
    }
});



// ============================================
// MEMBER AUTHENTICATION API
// ============================================

/**
 * @swagger
 * /member/login:
 *   post:
 *     summary: Member login
 *     tags: [Member Auth]
 */
app.post('/api/member/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const result = await pool.query(
            'SELECT id, member_id, name, email, phone, birthday, gender, stamps, available_rewards, password_hash FROM members WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const member = result.rows[0];
        
        if (!member.password_hash) {
            return res.status(401).json({ error: 'Password not set. Please use set password option.' });
        }
        
        const isValid = await bcrypt.compare(password, member.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        await pool.query('UPDATE members SET last_login = NOW() WHERE id = $1', [member.id]);
        delete member.password_hash;
        
        logger.info('Member logged in:', { memberId: member.member_id, email: member.email });
        res.json({ success: true, member });
    } catch (error) {
        logger.error('Member login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * @swagger
 * /member/profile/{memberId}:
 *   get:
 *     summary: Get member profile
 *     tags: [Member Auth]
 */
app.get('/api/member/profile/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const result = await pool.query(
            'SELECT id, member_id, name, email, phone, birthday, gender, stamps, available_rewards, total_rewards, created_at FROM members WHERE member_id = $1',
            [memberId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * @swagger
 * /member/profile/{memberId}:
 *   put:
 *     summary: Update member profile
 *     tags: [Member Auth]
 */
app.put('/api/member/profile/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        const { name, phone, birthday, gender } = req.body;
        
        const result = await pool.query(
            `UPDATE members SET 
                name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                birthday = COALESCE($3, birthday),
                gender = COALESCE($4, gender),
                updated_at = NOW()
             WHERE member_id = $5
             RETURNING id, member_id, name, email, phone, birthday, gender, stamps, available_rewards`,
            [name, phone, birthday, gender, memberId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        logger.info('Member profile updated:', memberId);
        res.json({ success: true, member: result.rows[0] });
    } catch (error) {
        logger.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @swagger
 * /member/set-password:
 *   post:
 *     summary: Set or update member password
 *     tags: [Member Auth]
 */
app.post('/api/member/set-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const member = await pool.query('SELECT id FROM members WHERE email = $1', [email.toLowerCase()]);
        if (member.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query('UPDATE members SET password_hash = $1, updated_at = NOW() WHERE email = $2', [passwordHash, email.toLowerCase()]);
        
        logger.info('Member password set:', email);
        res.json({ success: true, message: 'Password set successfully' });
    } catch (error) {
        logger.error('Set password error:', error);
        res.status(500).json({ error: 'Failed to set password' });
    }
});

logger.info('🔐 Member authentication API loaded');

// ============================================
// STAFF LOGIN API
// ============================================

/**
 * @swagger
 * /staff/login:
 *   post:
 *     summary: Staff/Admin login
 *     tags: [Staff Auth]
 */
app.post('/api/staff/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const result = await pool.query(
            'SELECT * FROM staff_users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        
        // Check if password_hash exists
        if (!user.password_hash) {
            return res.status(401).json({ error: 'Password not set. Please set your password first.' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        await pool.query('UPDATE staff_users SET updated_at = NOW() WHERE id = $1', [user.id]);
        delete user.password_hash;
        
        logger.info('Staff logged in:', { userId: user.id, email: user.email, role: user.role });
        res.json({ success: true, user });
    } catch (error) {
        logger.error('Staff login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * @swagger
 * /staff/set-password:
 *   post:
 *     summary: Set or update staff password
 *     tags: [Staff Auth]
 */
app.post('/api/staff/set-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const user = await pool.query('SELECT id FROM staff_users WHERE email = $1', [email.toLowerCase()]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found. Please add yourself in Settings > Users first.' });
        }
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query('UPDATE staff_users SET password_hash = $1, updated_at = NOW() WHERE email = $2', [passwordHash, email.toLowerCase()]);
        
        logger.info('Staff password set:', email);
        res.json({ success: true, message: 'Password set successfully' });
    } catch (error) {
        logger.error('Set password error:', error);
        res.status(500).json({ error: 'Failed to set password' });
    }
});

logger.info('🔐 Staff authentication API loaded');



// ============================================
// TRANSACTIONS API
// ============================================

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions (live feed)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of transactions to return
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
app.get('/api/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
            `SELECT t.*, m.member_id as member_code, m.name as member_name
             FROM transactions t
             LEFT JOIN members m ON t.member_id = m.id
             ORDER BY t.created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

logger.info('✅ Transactions API loaded');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`🚀 C.R.E.A.M. CRM Server running on http://localhost:${PORT}`);
    logger.info(`📱 QR Code page: http://localhost:${PORT}/qrcode.html`);
    logger.info(`📝 Registration: http://localhost:${PORT}/register.html`);
    if (swaggerUi) {
        logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    }
    if (register) {
        logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
    }
});

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 */
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
        logger.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * @swagger
 * /members/{memberId}/history:
 *   get:
 *     summary: Get reward history for a member
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member's reward history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RewardHistory'
 */
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
        logger.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search members
 *     tags: [Members]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name, email, or member ID)
 *     responses:
 *       200:
 *         description: Matching members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 */
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
        logger.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

logger.info('✅ Additional API endpoints loaded');

/**
 * @swagger
 * /members/{memberId}:
 *   delete:
 *     summary: Delete a member
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.delete('/api/members/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        
        // First get the member's internal ID for cleanup
        const member = await pool.query('SELECT id FROM members WHERE member_id = $1', [memberId]);
        if (member.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        const internalId = member.rows[0].id;
        
        // Delete related records first (reward history)
        await pool.query('DELETE FROM reward_history WHERE member_id = $1', [internalId]);
        
        // Delete the member
        await pool.query('DELETE FROM members WHERE member_id = $1', [memberId]);
        
        logger.info('Member deleted:', memberId);
        res.json({ success: true, message: 'Member deleted successfully' });
    } catch (error) {
        logger.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete member' });
    }
});


/**
 * @swagger
 * /pass/{memberId}:
 *   get:
 *     summary: Generate Apple Wallet pass for a member
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Apple Wallet pass (.pkpass file)
 *         content:
 *           application/vnd.apple.pkpass:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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
        
        // Track wallet pass metric
        if (metrics && metrics.walletPassesGenerated) {
            metrics.walletPassesGenerated.inc();
        }
        
        logger.info('Generated pass for:', memberId);
    } catch (error) {
        logger.error('Pass generation error:', error);
        res.status(500).json({ error: 'Failed to generate pass', details: error.message });
    }
});

logger.info('🍎 Apple Wallet pass endpoint: /api/pass/:memberId');
logger.info('📲 Automatic pass updates enabled!');

// ============================================
// CAMPAIGNS API
// ============================================

app.get('/api/campaigns', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

app.post('/api/campaigns', async (req, res) => {
    try {
        const { name, description, campaign_type, start_date, end_date, is_active } = req.body;
        const result = await pool.query(
            `INSERT INTO campaigns (name, description, campaign_type, start_date, end_date, is_active)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, description, campaign_type || 'general', start_date || null, end_date || null, is_active !== false]
        );
        logger.info('Campaign created:', result.rows[0]);
        res.json({ success: true, campaign: result.rows[0] });
    } catch (error) {
        logger.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

app.put('/api/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, campaign_type, start_date, end_date, is_active } = req.body;
        const result = await pool.query(
            `UPDATE campaigns SET name = $1, description = $2, campaign_type = $3, 
             start_date = $4, end_date = $5, is_active = $6 WHERE id = $7 RETURNING *`,
            [name, description, campaign_type, start_date, end_date, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({ success: true, campaign: result.rows[0] });
    } catch (error) {
        logger.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        logger.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

logger.info('✅ Campaigns API loaded');

// ============================================
// MESSAGES API
// ============================================

app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.*, mb.name as member_name, mb.member_id as member_code
             FROM messages m
             LEFT JOIN members mb ON m.member_id = mb.id
             ORDER BY m.sent_at DESC LIMIT 50`
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { member_id, title, body } = req.body;
        
        // Store the message
        const result = await pool.query(
            `INSERT INTO messages (member_id, title, body) VALUES ($1, $2, $3) RETURNING *`,
            [member_id || null, title, body]
        );
        logger.info('Message sent:', result.rows[0]);
        
        // If sending to a specific member, update their pass and trigger notification
        if (member_id) {
            // Update member's latest message and trigger pass update
            const memberResult = await pool.query(
                `UPDATE members SET 
                    latest_message_title = $1, 
                    latest_message_body = $2,
                    updated_at = NOW()
                 WHERE id = $3 
                 RETURNING member_id`,
                [title, body, member_id]
            );
            
            if (memberResult.rows.length > 0) {
                const memberId = memberResult.rows[0].member_id;
                try {
                    await triggerPassUpdate(memberId);
                    logger.info(`📱 Wallet notification triggered for: ${memberId}`);
                } catch (pushError) {
                    logger.error('Wallet push failed:', pushError.message);
                    // Don't fail the message operation if push fails
                }
            }
        }
        
        res.json({ success: true, message: result.rows[0] });
    } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

logger.info('✅ Messages API loaded');

// ============================================
// GLOBAL REWARD HISTORY API
// ============================================

app.get('/api/rewards/history', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT rh.*, m.name as member_name, m.member_id as member_code
             FROM reward_history rh
             JOIN members m ON rh.member_id = m.id
             ORDER BY rh.created_at DESC LIMIT 50`
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching reward history:', error);
        res.status(500).json({ error: 'Failed to fetch reward history' });
    }
});

logger.info('✅ Reward History API loaded');

// ============================================
// STORES API
// ============================================

app.get('/api/stores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stores ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

app.post('/api/stores', async (req, res) => {
    try {
        const { name, address, manager, phone } = req.body;
        const result = await pool.query(
            'INSERT INTO stores (name, address, manager, phone) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, address, manager, phone]
        );
        res.json({ success: true, store: result.rows[0] });
    } catch (error) {
        logger.error('Error creating store:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
});

app.put('/api/stores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, manager, phone } = req.body;
        const result = await pool.query(
            'UPDATE stores SET name=$1, address=$2, manager=$3, phone=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
            [name, address, manager, phone, id]
        );
        res.json({ success: true, store: result.rows[0] });
    } catch (error) {
        logger.error('Error updating store:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
});

app.delete('/api/stores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM stores WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting store:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
});

logger.info('✅ Stores API loaded');

// ============================================
// STAFF USERS API
// ============================================

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, surname, email, phone, role, store_id, password_plain FROM staff_users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, surname, email, phone, role, store_id, password } = req.body;
        
        // Hash the password if provided
        let passwordHash = null;
        if (password && password.length >= 6) {
            passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }
        
        const result = await pool.query(
            'INSERT INTO staff_users (name, surname, email, phone, role, store_id, password_hash, password_plain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, surname, email, phone, role, password_plain',
            [name, surname, email.toLowerCase(), phone, role || 'barista', store_id || null, passwordHash, password || null]
        );
        logger.info('User created:', { email, role });
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, email, phone, role, store_id } = req.body;
        const result = await pool.query(
            'UPDATE staff_users SET name=$1, surname=$2, email=$3, phone=$4, role=$5, store_id=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
            [name, surname, email, phone, role, store_id || null, id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM staff_users WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

logger.info('✅ Staff Users API loaded');

// ============================================
// SEND REWARD API
// ============================================

app.post('/api/rewards/send', async (req, res) => {
    try {
        const { member_id, reward_type, send_to_all } = req.body;
        let count = 0;
        
        if (send_to_all) {
            const members = await pool.query('SELECT id, member_id FROM members');
            for (const member of members.rows) {
                await pool.query('INSERT INTO reward_history (member_id, reward_type, status) VALUES ($1, $2, $3)', 
                    [member.id, reward_type, 'sent']);
                try { await triggerPassUpdate(member.member_id); } catch(e) { logger.error('Pass update failed:', e.message); }
                count++;
            }
        } else if (member_id) {
            await pool.query('INSERT INTO reward_history (member_id, reward_type, status) VALUES ($1, $2, $3)', 
                [member_id, reward_type, 'sent']);
            const m = await pool.query('SELECT member_id FROM members WHERE id=$1', [member_id]);
            if (m.rows.length) try { await triggerPassUpdate(m.rows[0].member_id); } catch(e) { logger.error('Pass update failed:', e.message); }
            count = 1;
        }
        
        res.json({ success: true, count });
    } catch (error) {
        logger.error('Error sending reward:', error);
        res.status(500).json({ error: 'Failed to send reward' });
    }
});

logger.info('✅ Rewards Send API loaded');

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', async (req, res) => {
    try {
        // Check database connectivity
        await pool.query('SELECT 1');
        
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

logger.info('✅ Health check endpoint loaded');

// ============================================
// SYSTEM MONITORING API (for dashboard)
// ============================================

/**
 * @swagger
 * /monitoring:
 *   get:
 *     summary: Get comprehensive system monitoring data
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System monitoring data
 */
app.get('/api/monitoring', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Database health check with timing
        const dbStart = Date.now();
        const dbResult = await pool.query('SELECT 1');
        const dbLatency = Date.now() - dbStart;
        
        // Get pool stats
        const poolStats = {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
        };
        
        // Get business metrics
        const [membersResult, stampsResult, rewardsResult, todayResult, transactionsResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM members'),
            pool.query('SELECT COALESCE(SUM(stamps), 0) as total FROM members'),
            pool.query('SELECT COALESCE(SUM(total_rewards), 0) as total FROM members'),
            pool.query("SELECT COUNT(*) as count FROM members WHERE DATE(created_at) = CURRENT_DATE"),
            pool.query(`SELECT COUNT(*) as count FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours'`)
        ]);
        
        // Get recent activity
        const recentActivity = await pool.query(`
            SELECT t.*, m.member_id as member_code, m.name as member_name
            FROM transactions t
            LEFT JOIN members m ON t.member_id = m.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);
        
        // Memory usage
        const memUsage = process.memoryUsage();
        
        // Format uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            
            // System info
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: uptime,
                uptimeFormatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
                pid: process.pid
            },
            
            // Memory
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
            },
            
            // Database
            database: {
                status: 'connected',
                latency: dbLatency,
                pool: poolStats
            },
            
            // Business metrics
            metrics: {
                totalMembers: parseInt(membersResult.rows[0].count),
                totalStamps: parseInt(stampsResult.rows[0].total) || 0,
                totalRewards: parseInt(rewardsResult.rows[0].total) || 0,
                todayMembers: parseInt(todayResult.rows[0].count),
                last24hTransactions: parseInt(transactionsResult.rows[0].count)
            },
            
            // Recent activity
            recentActivity: recentActivity.rows.map(t => ({
                id: t.id,
                type: t.transaction_type,
                memberCode: t.member_code,
                memberName: t.member_name,
                data: t.transaction_data,
                timestamp: t.created_at,
                panel: t.panel
            })),
            
            // Response time
            responseTime: Date.now() - startTime
        };
        
        res.json(response);
        
    } catch (error) {
        logger.error('Monitoring error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                status: 'disconnected'
            },
            responseTime: Date.now() - startTime
        });
    }
});

logger.info('✅ System Monitoring API loaded');
