 // C.R.E.A.M. CRM API Client
// Connects frontend to Hetzner PostgreSQL via Node.js server

const API_BASE = '';  // Same origin

const CreamAPI = {
    // Get all members
    async getMembers() {
        const res = await fetch(`${API_BASE}/api/members`);
        return res.json();
    },

    // Get single member
    async getMember(memberId) {
        const res = await fetch(`${API_BASE}/api/members/${memberId}`);
        return res.json();
    },

    // Search members
    async searchMembers(query) {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
        return res.json();
    },

    // Register new member
    async registerMember(data) {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // Add stamp to member
    async addStamp(memberId) {
        const res = await fetch(`${API_BASE}/api/members/${memberId}/stamp`, {
            method: 'POST'
        });
        return res.json();
    },

    // Redeem reward
    async redeemReward(memberId) {
        const res = await fetch(`${API_BASE}/api/members/${memberId}/redeem`, {
            method: 'POST'
        });
        return res.json();
    },

    // Get reward history
    async getHistory(memberId) {
        const res = await fetch(`${API_BASE}/api/members/${memberId}/history`);
        return res.json();
    },

    // Get dashboard stats
    async getStats() {
        const res = await fetch(`${API_BASE}/api/stats`);
        return res.json();
    }
};

// Make it globally available
window.CreamAPI = CreamAPI;

console.log('🔌 C.R.E.A.M. API Client loaded');
