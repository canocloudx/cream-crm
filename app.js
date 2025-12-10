// C.R.E.A.M. COFFEE CRM - Stamps & Rewards System
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSidebar();
    initCounters();
    initMembersTable();
    initCharts();
    initModals();
});

// Sample Member Data (Stamps & Rewards only - NO POINTS)
const members = [
    { 
        id: 1, 
        name: 'Sarah Chen', 
        email: 'sarah.chen@email.com', 
        memberId: 'CREAM-123456',
        stamps: 4, 
        totalRewards: 5,
        availableRewards: 1, 
        lastVisit: 'Today',
        rewardHistory: [
            { type: 'earned', date: '2024-12-08', desc: 'Free drink earned' },
            { type: 'used', date: '2024-12-09', desc: 'Free latte redeemed' },
            { type: 'earned', date: '2024-12-01', desc: 'Free drink earned' },
            { type: 'used', date: '2024-12-02', desc: 'Free cappuccino redeemed' }
        ]
    },
    { 
        id: 2, 
        name: 'Mike Johnson', 
        email: 'mike.j@email.com', 
        memberId: 'CREAM-234567',
        stamps: 2, 
        totalRewards: 3,
        availableRewards: 0, 
        lastVisit: 'Today',
        rewardHistory: [
            { type: 'earned', date: '2024-12-05', desc: 'Free drink earned' },
            { type: 'used', date: '2024-12-06', desc: 'Free americano redeemed' }
        ]
    },
    { 
        id: 3, 
        name: 'Emma Wilson', 
        email: 'emma.w@email.com', 
        memberId: 'CREAM-345678',
        stamps: 5, 
        totalRewards: 2,
        availableRewards: 0, 
        lastVisit: 'Yesterday',
        rewardHistory: [
            { type: 'earned', date: '2024-11-28', desc: 'Free drink earned' },
            { type: 'used', date: '2024-11-29', desc: 'Free mocha redeemed' }
        ]
    },
    { 
        id: 4, 
        name: 'David Kim', 
        email: 'david.k@email.com', 
        memberId: 'CREAM-456789',
        stamps: 1, 
        totalRewards: 8,
        availableRewards: 2, 
        lastVisit: '2 days ago',
        rewardHistory: [
            { type: 'earned', date: '2024-12-07', desc: 'Free drink earned' },
            { type: 'earned', date: '2024-12-03', desc: 'Free drink earned' }
        ]
    },
    { 
        id: 5, 
        name: 'Lisa Park', 
        email: 'lisa.p@email.com', 
        memberId: 'CREAM-567890',
        stamps: 0, 
        totalRewards: 0,
        availableRewards: 0, 
        lastVisit: '1 week ago',
        rewardHistory: []
    },
    { 
        id: 6, 
        name: 'James Brown', 
        email: 'james.b@email.com', 
        memberId: 'CREAM-678901',
        stamps: 3, 
        totalRewards: 4,
        availableRewards: 1, 
        lastVisit: '3 days ago',
        rewardHistory: [
            { type: 'earned', date: '2024-12-04', desc: 'Free drink earned' }
        ]
    },
    { 
        id: 7, 
        name: 'Maria Garcia', 
        email: 'maria.g@email.com', 
        memberId: 'CREAM-789012',
        stamps: 5, 
        totalRewards: 12,
        availableRewards: 3, 
        lastVisit: 'Today',
        rewardHistory: [
            { type: 'earned', date: '2024-12-10', desc: 'Free drink earned' },
            { type: 'earned', date: '2024-12-08', desc: 'Free drink earned' },
            { type: 'earned', date: '2024-12-05', desc: 'Free drink earned' }
        ]
    },
    { 
        id: 8, 
        name: 'Robert Taylor', 
        email: 'robert.t@email.com', 
        memberId: 'CREAM-890123',
        stamps: 0, 
        totalRewards: 1,
        availableRewards: 0, 
        lastVisit: '2 weeks ago',
        rewardHistory: [
            { type: 'used', date: '2024-11-25', desc: 'Free latte redeemed' }
        ]
    },
    { 
        id: 9, 
        name: 'Jennifer Lee', 
        email: 'jennifer.l@email.com', 
        memberId: 'CREAM-901234',
        stamps: 4, 
        totalRewards: 6,
        availableRewards: 1, 
        lastVisit: 'Yesterday',
        rewardHistory: [
            { type: 'earned', date: '2024-12-09', desc: 'Free drink earned' }
        ]
    },
    { 
        id: 10, 
        name: 'William Chen', 
        email: 'william.c@email.com', 
        memberId: 'CREAM-012345',
        stamps: 2, 
        totalRewards: 2,
        availableRewards: 0, 
        lastVisit: '5 days ago',
        rewardHistory: [
            { type: 'used', date: '2024-12-04', desc: 'Free americano redeemed' }
        ]
    }
];

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.dataset.page;

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `page-${pageId}`) {
                    page.classList.add('active');
                }
            });
        });
    });
}

// Sidebar Toggle
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');

    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// Animated Counters
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 1500;
    const start = Date.now();

    const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(eased * target);

        element.textContent = current.toLocaleString();

        if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
}

// Members Table
function initMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

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
                    ${renderStampsSmall(m.stamps)}
                </div>
            </td>
            <td>
                <span class="rewards-badge ${m.availableRewards > 0 ? 'has-rewards' : ''}">${m.availableRewards} available</span>
            </td>
            <td>${m.lastVisit}</td>
            <td>
                <button class="btn-icon" onclick="viewMember(${m.id})">
                    <span class="material-icons-round">visibility</span>
                </button>
                <button class="btn-icon" onclick="addStampToMember(${m.id})">
                    <span class="material-icons-round">add_circle</span>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Search
    const search = document.getElementById('memberSearch');
    search?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#membersTableBody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // Top members list
    renderTopMembers();
}

function renderStampsSmall(count) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<span class="stamp-dot ${i < count ? 'filled' : ''}"></span>`;
    }
    return html;
}

function renderTopMembers() {
    const list = document.getElementById('topMembersList');
    if (!list) return;

    const sorted = [...members].sort((a, b) => b.totalRewards - a.totalRewards).slice(0, 5);
    
    sorted.forEach((m, i) => {
        const initials = m.name.split(' ').map(n => n[0]).join('');
        const item = document.createElement('div');
        item.className = 'top-member-item';
        item.innerHTML = `
            <span class="rank">#${i + 1}</span>
            <div class="customer-avatar">${initials}</div>
            <div class="top-member-info">
                <span class="name">${m.name}</span>
                <span class="stat">${m.totalRewards} rewards earned</span>
            </div>
        `;
        list.appendChild(item);
    });
}

// View Member Detail
window.viewMember = function(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    const initials = member.name.split(' ').map(n => n[0]).join('');
    
    openModal(`${member.name}`, `
        <div class="member-detail">
            <div class="member-header">
                <div class="customer-avatar-large">${initials}</div>
                <div class="member-info">
                    <div class="member-id">${member.memberId}</div>
                    <div class="member-email">${member.email}</div>
                </div>
            </div>

            <div class="stamp-card-modal">
                <h4>☕ Stamp Card</h4>
                <div class="stamps-grid-modal">
                    ${renderStampsLarge(member.stamps)}
                </div>
                <p class="stamp-progress">${6 - member.stamps} more stamp${6 - member.stamps !== 1 ? 's' : ''} for a free drink!</p>
            </div>

            <div class="rewards-summary">
                <div class="reward-stat">
                    <span class="num">${member.availableRewards}</span>
                    <span class="label">Available</span>
                </div>
                <div class="reward-stat">
                    <span class="num">${member.totalRewards}</span>
                    <span class="label">Total Earned</span>
                </div>
            </div>

            <div class="reward-history">
                <h4>Reward History</h4>
                ${renderRewardHistory(member.rewardHistory)}
            </div>

            <div class="modal-actions">
                <button class="btn btn-primary" onclick="addStampToMember(${member.id}); closeModal();">
                    <span class="material-icons-round">add_circle</span>
                    Add Stamp
                </button>
                ${member.availableRewards > 0 ? `
                <button class="btn btn-secondary" onclick="redeemReward(${member.id}); closeModal();">
                    <span class="material-icons-round">redeem</span>
                    Redeem Reward
                </button>
                ` : ''}
            </div>
        </div>
    `);
};

function renderStampsLarge(count) {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<div class="stamp-large ${i < count ? 'filled' : 'empty'}">${i < count ? '☕' : ''}</div>`;
    }
    return html;
}

function renderRewardHistory(history) {
    if (!history || history.length === 0) {
        return '<p class="no-history">No reward history yet</p>';
    }
    
    return history.slice(0, 5).map(h => `
        <div class="history-item ${h.type}">
            <span class="material-icons-round">${h.type === 'earned' ? 'card_giftcard' : 'redeem'}</span>
            <div class="history-info">
                <span class="desc">${h.desc}</span>
                <span class="date">${h.date}</span>
            </div>
        </div>
    `).join('');
}

// Add Stamp
window.addStampToMember = function(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    member.stamps++;
    
    if (member.stamps >= 6) {
        member.stamps = 0;
        member.totalRewards++;
        member.availableRewards++;
        member.rewardHistory.unshift({
            type: 'earned',
            date: new Date().toISOString().split('T')[0],
            desc: 'Free drink earned'
        });
        showToast('success', '🎉 Reward Earned!', `${member.name} earned a free drink!`);
    } else {
        showToast('success', 'Stamp Added', `${member.name} now has ${member.stamps}/6 stamps`);
    }

    // Refresh table
    const tbody = document.getElementById('membersTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        initMembersTable();
    }
};

// Redeem Reward
window.redeemReward = function(id) {
    const member = members.find(m => m.id === id);
    if (!member || member.availableRewards <= 0) return;

    member.availableRewards--;
    member.rewardHistory.unshift({
        type: 'used',
        date: new Date().toISOString().split('T')[0],
        desc: 'Free drink redeemed'
    });
    
    showToast('success', 'Reward Redeemed', `Free drink applied for ${member.name}!`);

    // Refresh table
    const tbody = document.getElementById('membersTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        initMembersTable();
    }
};

// Charts
function initCharts() {
    initStampsChart();
    initRewardsChart();
    initGrowthChart();
}

function initStampsChart() {
    const ctx = document.getElementById('stampsChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Stamps Given',
                data: [45, 62, 55, 78, 90, 125, 98],
                borderColor: '#9C7B6B',
                backgroundColor: 'rgba(156, 123, 107, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#9C7B6B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(45, 41, 38, 0.05)' }, ticks: { color: '#8B7F74' } },
                y: { grid: { color: 'rgba(45, 41, 38, 0.05)' }, ticks: { color: '#8B7F74' } }
            }
        }
    });
}

function initRewardsChart() {
    const ctx = document.getElementById('rewardsChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Earned',
                    data: [42, 58, 48, 65],
                    backgroundColor: '#6B9080',
                    borderRadius: 6
                },
                {
                    label: 'Redeemed',
                    data: [28, 35, 32, 45],
                    backgroundColor: '#D5BDAF',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#5D534B' } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#8B7F74' } },
                y: { grid: { color: 'rgba(45, 41, 38, 0.05)' }, ticks: { color: '#8B7F74' } }
            }
        }
    });
}

function initGrowthChart() {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'New Members',
                data: [120, 145, 168, 190, 178, 215, 245, 278, 298, 325, 356, 380],
                borderColor: '#D4A574',
                backgroundColor: 'rgba(212, 165, 116, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(45, 41, 38, 0.05)' }, ticks: { color: '#8B7F74' } },
                y: { grid: { color: 'rgba(45, 41, 38, 0.05)' }, ticks: { color: '#8B7F74' } }
            }
        }
    });
}

// Modal System
function initModals() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function openModal(title, content) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    overlay?.classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('modalOverlay')?.classList.add('hidden');
};

window.openAddMemberModal = function() {
    openModal('Add New Member', `
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="form-input" placeholder="Enter full name">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-input" placeholder="Enter email">
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="closeModal(); showToast('success', 'Member Added', 'New member created successfully');">Add Member</button>
        </div>
    `);
};

window.openPassDesigner = function() {
    openModal('Pass Designer', `
        <p style="text-align: center; padding: 40px 0;">Pass Designer coming soon!</p>
    `);
};

// Toast System
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'check_circle', error: 'error', warning: 'warning' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-icons-round toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
