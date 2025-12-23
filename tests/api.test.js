const request = require('supertest');

// We'll need to refactor server.js to export the app
// For now, this assumes we create an app.js that exports the Express app
let app;
let server;

beforeAll(async () => {
    // Import the app (requires refactoring server.js)
    const { createApp } = require('../app');
    app = await createApp();
});

afterAll(async () => {
    // Cleanup
    if (server) {
        await server.close();
    }
});

describe('API Health Check', () => {
    test('GET /api/stats should return stats object', async () => {
        const response = await request(app)
            .get('/api/stats')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('totalMembers');
        expect(response.body).toHaveProperty('totalStamps');
        expect(response.body).toHaveProperty('totalRewards');
        expect(typeof response.body.totalMembers).toBe('number');
    });
});

describe('Member Registration', () => {
    const testMember = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        phone: '+1234567890',
        birthday: '1990-01-15',
        gender: 'prefer-not-to-say'
    };

    test('POST /api/register should create a new member', async () => {
        const response = await request(app)
            .post('/api/register')
            .send(testMember)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.member).toHaveProperty('member_id');
        expect(response.body.member.name).toBe(testMember.name);
        expect(response.body.member.email).toBe(testMember.email);
        expect(response.body.member.stamps).toBe(0);

        // Store for later tests
        testMember.memberId = response.body.member.member_id;
    });

    test('POST /api/register with duplicate email should fail', async () => {
        const response = await request(app)
            .post('/api/register')
            .send(testMember)
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('already registered');
    });

    test('POST /api/register with missing name should fail', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({ email: 'incomplete@test.com' })
            .expect(400);

        expect(response.body.success).toBe(false);
    });
});

describe('Member Retrieval', () => {
    test('GET /api/members should return array of members', async () => {
        const response = await request(app)
            .get('/api/members')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/members/:memberId should return single member', async () => {
        // First get a member to test with
        const membersRes = await request(app).get('/api/members');
        if (membersRes.body.length === 0) {
            return; // Skip if no members
        }

        const memberId = membersRes.body[0].member_id;

        const response = await request(app)
            .get(`/api/members/${memberId}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.member_id).toBe(memberId);
    });

    test('GET /api/members/:memberId with invalid ID should return 404', async () => {
        const response = await request(app)
            .get('/api/members/INVALID-123456')
            .expect(404);

        expect(response.body.error).toBe('Member not found');
    });
});

describe('Stamp System', () => {
    let testMemberId;

    beforeAll(async () => {
        // Create a test member for stamp tests
        const response = await request(app)
            .post('/api/register')
            .send({
                name: 'Stamp Test User',
                email: `stamp-test-${Date.now()}@example.com`
            });
        testMemberId = response.body.member.member_id;
    });

    test('POST /api/members/:memberId/stamp should add stamp', async () => {
        const response = await request(app)
            .post(`/api/members/${testMemberId}/stamp`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.member.stamps).toBe(1);
    });

    test('Adding 6 stamps should trigger reward', async () => {
        // Add 5 more stamps (already have 1)
        for (let i = 0; i < 5; i++) {
            await request(app).post(`/api/members/${testMemberId}/stamp`);
        }

        const response = await request(app)
            .get(`/api/members/${testMemberId}`)
            .expect(200);

        // After 6 stamps: stamps reset to 0, available_rewards = 1
        expect(response.body.stamps).toBe(0);
        expect(response.body.available_rewards).toBe(1);
        expect(response.body.total_rewards).toBe(1);
    });

    test('POST /api/members/:memberId/stamp with invalid ID should return 404', async () => {
        const response = await request(app)
            .post('/api/members/INVALID-123456/stamp')
            .expect(404);

        expect(response.body.error).toBe('Member not found');
    });
});

describe('Reward Redemption', () => {
    let testMemberId;

    beforeAll(async () => {
        // Create member with a reward
        const memberRes = await request(app)
            .post('/api/register')
            .send({
                name: 'Redeem Test User',
                email: `redeem-test-${Date.now()}@example.com`
            });
        testMemberId = memberRes.body.member.member_id;

        // Add 6 stamps to get a reward
        for (let i = 0; i < 6; i++) {
            await request(app).post(`/api/members/${testMemberId}/stamp`);
        }
    });

    test('POST /api/members/:memberId/redeem should redeem reward', async () => {
        const response = await request(app)
            .post(`/api/members/${testMemberId}/redeem`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.member.available_rewards).toBe(0);
    });

    test('POST /api/members/:memberId/redeem with no rewards should fail', async () => {
        const response = await request(app)
            .post(`/api/members/${testMemberId}/redeem`)
            .expect(400);

        expect(response.body.error).toBe('No rewards available');
    });
});

describe('Search', () => {
    test('GET /api/search should return matching members', async () => {
        const response = await request(app)
            .get('/api/search')
            .query({ q: 'test' })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/search with member_id should find member', async () => {
        const membersRes = await request(app).get('/api/members');
        if (membersRes.body.length === 0) return;

        const memberId = membersRes.body[0].member_id;

        const response = await request(app)
            .get('/api/search')
            .query({ q: memberId })
            .expect(200);

        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].member_id).toBe(memberId);
    });
});

describe('Member Deletion', () => {
    let testMemberId;

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                name: 'Delete Test User',
                email: `delete-test-${Date.now()}@example.com`
            });
        testMemberId = response.body.member.member_id;
    });

    test('DELETE /api/members/:memberId should delete member', async () => {
        const response = await request(app)
            .delete(`/api/members/${testMemberId}`)
            .expect(200);

        expect(response.body.success).toBe(true);

        // Verify deletion
        await request(app)
            .get(`/api/members/${testMemberId}`)
            .expect(404);
    });

    test('DELETE /api/members/:memberId with invalid ID should return 404', async () => {
        const response = await request(app)
            .delete('/api/members/INVALID-123456')
            .expect(404);

        expect(response.body.error).toBe('Member not found');
    });
});

describe('Reward History', () => {
    test('GET /api/members/:memberId/history should return history array', async () => {
        const membersRes = await request(app).get('/api/members');
        if (membersRes.body.length === 0) return;

        const memberId = membersRes.body[0].member_id;

        const response = await request(app)
            .get(`/api/members/${memberId}/history`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/members/:memberId/history with invalid ID should return 404', async () => {
        const response = await request(app)
            .get('/api/members/INVALID-123456/history')
            .expect(404);

        expect(response.body.error).toBe('Member not found');
    });
});
