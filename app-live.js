// C.R.E.A.M. CRM - Live Database Integration
// This file connects the CRM dashboard to the Hetzner PostgreSQL database

// Override members array with live data
let members = [];

// Load members from API on page load
async function loadMembersFromAPI() {
    try {
        if (typeof CreamAPI !== 'undefined') {
            const data = await CreamAPI.getMembers();
            members = data.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                memberId: m.member_id,
                stamps: m.stamps,
                totalRewards: m.total_rewards,
                availableRewards: m.available_rewards,
                lastVisit: formatLastVisit(m.updated_at),
                rewardHistory: []
            }));
            console.log('✅ Loaded', members.length, 'members from Hetzner database');
            
            // Refresh the members table
            refreshMembersTable();
            
            // Update stats
            updateDashboardStats();
        }
    } catch (error) {
        console.error('Failed to load members from API:', error);
    }
}

function formatLastVisit(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
}

function refreshMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    members.forEach(m => {
        const initials = m.name.split(' ').map(n => n[0]).join('');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="checkbox"></td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${initials}</div>
                    <div>
                        <div class="customer-name">${m.name}</div>
                        <div class="customer-email">${m.email}</div>
                    </div>
                </div>
            </td>
            <td><code class="member-id-code">${m.memberId}</code></td>
            <td>
                <div class="stamps-display">
                    ${renderStampDotsSmall(m.stamps)}
                </div>
            </td>
            <td>
                <span class="rewards-badge ${m.availableRewards > 0 ? 'has-rewards' : ''}">${m.availableRewards}</span>
            </td>
            <td>${m.lastVisit}</td>
            <td>
                <button class="btn-icon" onclick="viewMember(${m.id})">
                    <span class="material-icons-round">visibility</span>
                </button>
                <button class="btn-icon" onclick="addStampToMemberLive('${m.memberId}')">
                    <span class="material-icons-round">add_circle</span>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderStampDotsSmall(count) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<span class="stamp-dot ${i < count ? 'filled' : ''}"></span>`;
    }
    return html;
}

async function updateDashboardStats() {
    try {
        if (typeof CreamAPI !== 'undefined') {
            const stats = await CreamAPI.getStats();
            
            // Update stat cards
            const statCards = document.querySelectorAll('.stat-card .stat-value');
            if (statCards[0]) statCards[0].textContent = stats.totalMembers || members.length;
            if (statCards[1]) statCards[1].textContent = stats.totalStamps || 0;
            if (statCards[2]) statCards[2].textContent = stats.totalRewards || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Add stamp using API
async function addStampToMemberLive(memberId) {
    try {
        const result = await CreamAPI.addStamp(memberId);
        if (result.success) {
            showToast(`Stamp added! ${result.member.stamps}/6`);
            if (result.member.stamps === 0) {
                showToast('🎉 Free drink earned!', 'success');
            }
            loadMembersFromAPI();  // Refresh
        }
    } catch (error) {
        console.error('Failed to add stamp:', error);
        showToast('Error adding stamp', 'error');
    }
}

// Redeem reward using API
async function redeemRewardLive(memberId) {
    try {
        const result = await CreamAPI.redeemReward(memberId);
        if (result.success) {
            showToast('Reward redeemed!', 'success');
            loadMembersFromAPI();  // Refresh
        } else {
            showToast(result.error || 'No rewards available', 'error');
        }
    } catch (error) {
        console.error('Failed to redeem:', error);
        showToast('Error redeeming reward', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for CreamAPI to be available
    setTimeout(() => {
        loadMembersFromAPI();
    }, 500);
});

console.log('🔄 Live database integration loaded');
