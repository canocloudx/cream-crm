// C.R.E.A.M. COFFEE CRM - Stamps & Rewards System

// Authentication check - redirect to login if not authenticated
(function checkAuth() {
    const session = localStorage.getItem('staffSession');
    if (!session) {
        window.location.href = '/login.html';
        return;
    }
    try {
        const user = JSON.parse(session);
        if (!user || !user.id) {
            localStorage.removeItem('staffSession');
            window.location.href = '/login.html';
            return;
        }
    } catch (e) {
        localStorage.removeItem('staffSession');
        window.location.href = '/login.html';
    }
})();

// URL-based routing
function getPageFromHash() {
    const hash = window.location.hash.replace("#", "").replace("/", "");
    const validPages = ['transactions', 'members', 'campaigns', 'settings', 'messages'];
    
    // Remove leading slash and get page name
    const pageName = hash;
    
    if (validPages.includes(pageName)) {
        return pageName;
    }
    
    // Default to transactions
    return 'transactions';
}

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initSidebar();
    // Load stats FIRST, then animate counters
    await loadStatsAndInitCounters();
    loadMembersFromAPI();
    initCharts();
    initModals();
    
    // Set page based on URL
    const initialPage = getPageFromHash();
    showPage(initialPage, false); // Don't update URL on initial load
});

// Helper function to show a page programmatically
function showPage(pageId, updateURL = true) {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    navItems.forEach(nav => {
        nav.classList.remove('active');
        if (nav.dataset.page === pageId) {
            nav.classList.add('active');
        }
    });
    
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `page-${pageId}`) {
            page.classList.add('active');
        }
    });
    
    // Update URL without page reload
    if (updateURL) {
        window.location.hash = '#' + pageId;
    }
    
    // Auto-load data based on page
    if (pageId === 'transactions') {
        startTransactionsAutoRefresh();
    } else {
        stopTransactionsAutoRefresh();
    }
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', (event) => {
    const pageId = getPageFromHash();
    showPage(pageId, false);
});


// Load stats from API and then initialize counters
async function loadStatsAndInitCounters() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update counters using data-stat attribute
        document.querySelectorAll('[data-stat]').forEach(counter => {
            const statType = counter.dataset.stat;
            let value = 0;

            switch (statType) {
                case 'totalMembers':
                    value = stats.totalMembers || 0;
                    break;
                case 'totalStamps':
                    value = stats.totalStamps || 0;
                    break;
                case 'totalRewards':
                    value = stats.totalRewards || 0;
                    break;
                case 'redeemed':
                    value = Math.floor((stats.totalRewards || 0) * 0.6);
                    break;
            }

            counter.dataset.count = value;
        });

        console.log('📊 Stats loaded:', stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }

    // Now animate the counters with correct values
    initCounters();
}


// Members array - populated from API
let members = [];

// Load members from database API
async function loadMembersFromAPI() {
    try {
        const response = await fetch('/api/members');
        const data = await response.json();
        members = data.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            memberId: m.member_id,
            stamps: m.stamps || 0,
            totalRewards: m.total_rewards || 0,
            availableRewards: m.available_rewards || 0,
            lastVisit: 'Recently',
            rewardHistory: []
        }));
        initMembersTable();
        console.log('✅ Loaded', members.length, 'members from database');
    } catch (error) {
        console.error('Failed to load members:', error);
        initMembersTable();
    }
}



// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const pageId = item.dataset.page;
            showPage(pageId, true); // Update URL when clicking nav
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
        const row = document.createElement('tr'); row.id = 'member-row-' + m.id;
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
                <span class="rewards-badge ${m.availableRewards > 0 ? 'has-rewards' : ''}">${m.availableRewards}</span>
            </td>
            <td>${m.lastVisit}</td>
            <td>
                <button class="btn-icon" onclick="viewMember(${m.id})">
                    <span class="material-icons-round">visibility</span>
                </button>
                <button class="btn-icon" onclick="addStampToMember(${m.id})">
                    <span class="material-icons-round">add_circle</span>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteMember(${m.id}, '${m.name}')">
                    <span class="material-icons-round">delete</span>
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
window.viewMember = function (id) {
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
                <button class="btn btn-outline" onclick="openMessageToMember(${member.id})"><span class="material-icons-round">message</span>Message</button>
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


// Add Stamp - NOW CALLS API
// Add Stamp - OPTIMIZED: INSTANT UI UPDATE
// Add Stamp - OPTIMIZED: INSTANT UI UPDATE
// Add Stamp - ROBUST OPTIMISTIC UPDATE
window.addStampToMember = async function (id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // OPTIMISTIC UPDATE HELPER
    const updateMemberRow = (mem) => {
        const row = document.getElementById("member-row-" + mem.id);
        if (row) {
            console.log("Updating row " + mem.id + " optimistically");
            
            // Stamps Cell (3nd td, index 3)
            const stampsCell = row.children[3];
            if (stampsCell) {
                let dotsHtml = "";
                for (let i = 0; i < 6; i++) {
                    dotsHtml += `<span class="stamp-dot ${i < mem.stamps ? "filled" : ""}"></span>`;
                }
                stampsCell.innerHTML = `<div class="stamps-display">${dotsHtml}</div>`;
            }
            
            // Rewards Badge (4th td, index 4)
            const rewardsCell = row.children[4];
            if (rewardsCell) {
                rewardsCell.innerHTML = `<span class="rewards-badge ${mem.availableRewards > 0 ? "has-rewards" : ""}">${mem.availableRewards}</span>`;
            }
        } else {
            console.warn("Row not found: member-row-" + mem.id);
        }
    };

    try {
        const originalStamps = member.stamps;
        const originalRewards = member.availableRewards;
        
        // PREDICT
        let predictedStamps = member.stamps + 1;
        let predictedRewards = member.availableRewards;
        if (predictedStamps >= 6) {
            predictedStamps = 0;
            predictedRewards++;
        }
        
        // APPLY LOCAL
        member.stamps = predictedStamps;
        member.availableRewards = predictedRewards;
        updateMemberRow(member); // INSTANT VISUAL CHANGE

        // NETWORK
        const response = await fetch(`/api/members/${member.memberId}/stamp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();

        if (result.success) {
            // CONFIRM
            member.stamps = result.member.stamps;
            member.totalRewards = result.member.total_rewards;
            member.availableRewards = result.member.available_rewards;
            updateMemberRow(member);

            if (result.member.stamps === 0 && originalStamps > 0) {
                showToast("success", "🎉 Reward Earned!", `${member.name} earned a free drink!`);
            } else {
                showToast("success", "Stamp Added", `${member.name} now has ${result.member.stamps}/6 stamps`);
            }
            // CRITICAL: NO TABLE RELOAD
        } else {
            // REVERT
            member.stamps = originalStamps;
            member.availableRewards = originalRewards;
            updateMemberRow(member);
            showToast("error", "Error", result.error || "Failed to add stamp");
        }
    } catch (error) {
        console.error("Stamp API error:", error);
        showToast("error", "Error", "Failed to add stamp. Check connection.");
    }
};

// Redeem Reward - NOW WITH OPTIMISTIC UPDATE
window.redeemReward = async function (id) {
    const member = members.find(m => m.id === id);
    if (!member || member.availableRewards <= 0) return;

    const updateMemberRow = (mem) => {
        const row = document.getElementById("member-row-" + mem.id);
        if (row) {
            const rewardsCell = row.children[4];
            if (rewardsCell) {
                rewardsCell.innerHTML = `<span class="rewards-badge ${mem.availableRewards > 0 ? "has-rewards" : ""}">${mem.availableRewards}</span>`;
            }
        }
    };

    const originalRewards = member.availableRewards;
    member.availableRewards = originalRewards - 1;
    updateMemberRow(member);
    showToast('success', 'Reward Redeemed', `Free drink applied for ${member.name}!`);

    try {
        const response = await fetch(`/api/members/${member.memberId}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            member.availableRewards = result.member.available_rewards;
            updateMemberRow(member);
        } else {
            member.availableRewards = originalRewards;
            updateMemberRow(member);
            showToast('error', 'Error', result.error || 'Failed to redeem reward');
        }
    } catch (error) {
        member.availableRewards = originalRewards;
        updateMemberRow(member);
        showToast('error', 'Error', 'Failed to redeem. Check connection.');
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
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: 'New Members',
                data: [28, 35, 42, 38, 45, 52, 48, 56],
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

window.closeModal = function () {
    document.getElementById('modalOverlay')?.classList.add('hidden');
};

window.openAddMemberModal = function () {
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

// ==================== 
// CAMPAIGN TABS & MESSAGING
// ====================

// Initialize Campaign Tabs
document.addEventListener('DOMContentLoaded', () => {
    initCampaignTabs();
    updateStoresList();
    loadUsers();
    populateMemberSelects();
});

function initCampaignTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
        });
    });
}


async function populateMemberSelects() {
    const selects = ['memberSelect', 'rewardMemberSelect'];

    try {
        // Fetch members from API if not already loaded
        let membersList = members;
        if (!membersList || membersList.length === 0) {
            const response = await fetch('/api/members');
            membersList = await response.json();
        }

        const memberCount = membersList.length;

        // Update member count labels
        document.querySelectorAll('.radio-label').forEach(label => {
            if (label.textContent.includes('All Members (')) {
                label.textContent = `All Members (${memberCount.toLocaleString()})`;
            }
        });

        // Update reward preview text
        const previewText = document.querySelector('.reward-preview-text span');
        if (previewText && previewText.textContent.includes('Will be added to')) {
            previewText.textContent = `Will be added to ${memberCount.toLocaleString()} members`;
        }

        // Populate select dropdowns
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }

            membersList.forEach(m => {
                const option = document.createElement('option');
                option.value = m.id;
                option.textContent = `${m.name} (${m.member_id || m.memberId})`;
                select.appendChild(option);
            });
        });

        console.log('✅ Populated member selects with', memberCount, 'members');
    } catch (error) {
        console.error('Error populating member selects:', error);
    }
}

// Toggle recipient select visibility
window.toggleRecipientSelect = function () {
    const specific = document.querySelector('input[name="recipient"][value="specific"]');
    const selectGroup = document.getElementById('memberSelectGroup');

    if (specific?.checked) {
        selectGroup.style.display = 'block';
    } else {
        selectGroup.style.display = 'none';
    }
};

window.toggleRewardRecipientSelect = function () {
    const specific = document.querySelector('input[name="rewardRecipient"][value="specific"]');
    const selectGroup = document.getElementById('rewardMemberSelectGroup');

    if (specific?.checked) {
        selectGroup.style.display = 'block';
    } else {
        selectGroup.style.display = 'none';
    }
};

// Character count
window.updateCharCount = function () {
    const textarea = document.getElementById('msgBody');
    const counter = document.getElementById('charCount');
    if (!textarea || !counter) return;

    const len = textarea.value.length;
    counter.textContent = `${len}/160 characters`;
    counter.style.color = len > 160 ? '#C27B7B' : 'var(--text-light)';
};

// Preview message
window.previewMessage = function () {
    const title = document.getElementById('msgTitle')?.value || 'No title';
    const body = document.getElementById('msgBody')?.value || 'No message';
    const isAll = document.querySelector('input[name="recipient"][value="all"]')?.checked;
    const recipient = isAll ? `All Members (${members.length.toLocaleString()})` :
        document.getElementById('memberSelect')?.dataset?.memberName || 'No member selected';

    openModal('Message Preview', `
        <div class="message-preview">
            <div class="preview-header">
                <div class="preview-icon">☕</div>
                <div class="preview-app">C.R.E.A.M. COFFEE</div>
            </div>
            <h3 style="margin: 16px 0 8px;">${title}</h3>
            <p style="color: var(--text-medium); margin-bottom: 16px;">${body}</p>
            <div style="font-size: 12px; color: var(--text-light); padding-top: 12px; border-top: 1px solid var(--glass-border);">
                Will be sent to: <strong>${recipient}</strong>
            </div>
        </div>
    `);
};

// Send message
window.sendMessage = async function () {
    const title = document.getElementById('msgTitle')?.value;
    const body = document.getElementById('msgBody')?.value;

    if (!title || !body) {
        showToast('error', 'Missing Info', 'Please enter a title and message');
        return;
    }

    const isAll = document.querySelector('input[name="recipient"][value="all"]')?.checked;
    let selectedMemberId = null;

    // Check if specific member is selected
    if (!isAll) {
        selectedMemberId = document.getElementById('memberSelect')?.value;
        if (!selectedMemberId) {
            showToast('error', 'No Member Selected', 'Please search and select a member');
            return;
        }
    }

    const memberName = document.getElementById('memberSelect')?.dataset?.memberName;
    const count = isAll ? members.length.toLocaleString() : '1';
    const recipientText = isAll ? `${count} member(s)` : memberName;

    try {
        // Send to all members or specific member
        if (isAll) {
            // Send to all members
            for (const member of members) {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: member.id, title, body })
                });
            }
        } else {
            // Send to specific member
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: parseInt(selectedMemberId), title, body })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }
        }

        showToast('success', 'Message Sent!', `Message delivered to ${recipientText}`);

        // Clear form
        document.getElementById('msgTitle').value = '';
        document.getElementById('msgBody').value = '';
        updateCharCount();

        // Clear member search if specific member was selected
        if (!isAll) {
            clearSelectedMember('message');
        }
    } catch (error) {
        console.error('Message send error:', error);
        showToast('error', 'Send Failed', 'Could not send message. Please try again.');
    }
};

// Send reward
window.sendReward = function () {
    const rewardType = document.getElementById('rewardType')?.value;
    const isAll = document.querySelector('input[name="rewardRecipient"][value="all"]')?.checked;

    const rewardNames = {
        'free_drink': 'Free Drink',
        'bonus_stamp': 'Bonus Stamp',
        'double_stamps': 'Double Stamps'
    };

    const count = isAll ? members.length.toLocaleString() : '1';
    const rewardName = rewardNames[rewardType] || 'Reward';

    showToast('success', 'Reward Sent!', `${rewardName} sent to ${count} member(s)`);
};

// New campaign modal
window.openNewCampaignModal = function () {
    openModal('New Campaign', `
        <div class="form-group">
            <label>Campaign Name</label>
            <input type="text" class="form-input" placeholder="e.g., Weekend Special">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="form-input textarea" rows="3" placeholder="Describe your campaign..."></textarea>
        </div>
        <div class="form-group">
            <label>Campaign Type</label>
            <select class="form-input">
                <option>Double Stamps</option>
                <option>Free Reward</option>
                <option>Bonus Stamp</option>
            </select>
        </div>
        <div class="form-group">
            <label>Start Date</label>
            <input type="date" class="form-input">
        </div>
        <div class="form-group">
            <label>End Date</label>
            <input type="date" class="form-input">
        </div>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="closeModal(); showToast('success', 'Campaign Created', 'Your campaign has been scheduled');">Create Campaign</button>
        </div>
    `);
};

// Send message to specific member from stamp card
window.openMessageToMember = function (id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    openModal(`Message ${user.name}`, `
        <div class="member-message-form">
            <div class="message-recipient">
                <span class="material-icons-round">person</span>
                <span>Sending to: <strong>${user.name}</strong> (${member.memberId})</span>
            </div>
            
            <div class="form-group">
                <label>Message Title</label>
                <input type="text" class="form-input" id="memberMsgTitle" placeholder="e.g., Your reward is waiting!">
            </div>

            <div class="form-group">
                <label>Message</label>
                <textarea class="form-input textarea" id="memberMsgBody" rows="4" placeholder="Write your message here..."></textarea>
            </div>

            <div class="quick-templates">
                <label>Quick Templates:</label>
                <div class="template-chips">
                    <button class="template-chip" onclick="useTemplate('reward')">🎉 Reward Ready</button>
                    <button class="template-chip" onclick="useTemplate('miss')">👋 We Miss You</button>
                    <button class="template-chip" onclick="useTemplate('birthday')">🎂 Happy Birthday</button>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="sendMessageToMember(${member.id})">
                    <span class="material-icons-round">send</span>
                    Send Message
                </button>
            </div>
        </div>
    `);
};

window.useTemplate = function (type) {
    const titleInput = document.getElementById('memberMsgTitle');
    const bodyInput = document.getElementById('memberMsgBody');

    const templates = {
        reward: {
            title: 'Your Free Drink is Waiting! 🎉',
            body: 'Hi! You have a free drink reward ready to use. Stop by and enjoy it on us!'
        },
        miss: {
            title: 'We Miss You! 👋',
            body: "It's been a while! We'd love to see you again. Come grab your favorite drink soon!"
        },
        birthday: {
            title: 'Happy Birthday! 🎂',
            body: 'Wishing you a wonderful birthday! Enjoy a special treat on us today!'
        }
    };

    if (templates[type]) {
        titleInput.value = templates[type].title;
        bodyInput.value = templates[type].body;
    }
};

window.sendMessageToMember = async function (id) {
    const member = members.find(m => m.id === id);
    const title = document.getElementById('memberMsgTitle')?.value;
    const body = document.getElementById('memberMsgBody')?.value;

    if (!title || !body) {
        showToast('error', 'Missing Info', 'Please enter a title and message');
        return;
    }

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: member.id, title, body })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        closeModal();
        showToast('success', 'Message Sent!', `Message delivered to ${user.name}`);
    } catch (error) {
        console.error('Message send error:', error);
        showToast('error', 'Send Failed', 'Could not send message. Please try again.');
    }
};

// ==================== 
// BIRTHDAY AUTO-REWARDS
// ====================

// Add birthday to sample members
const memberBirthdays = {
    1: '1992-12-10', // Sarah Chen - birthday today for demo!
    2: '1988-03-15',
    3: '1995-07-22',
    4: '1990-11-28',
    5: '1993-04-10',
    6: '1987-09-05',
    7: '1994-12-10', // Maria Garcia - birthday today for demo!
    8: '1991-02-14',
    9: '1989-06-30',
    10: '1996-01-20'
};

// Check for birthdays on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkBirthdays, 1500);
});

function checkBirthdays() {
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const birthdayMembers = [];

    Object.entries(memberBirthdays).forEach(([id, date]) => {
        const [year, month, day] = date.split('-');
        const memberDate = `${month}-${day}`;

        if (memberDate === todayStr) {
            const member = members.find(m => m.id === parseInt(id));
            if (member) {
                birthdayMembers.push(member);
                // Auto-add birthday reward
                member.availableRewards++;
                member.totalRewards++;
                member.rewardHistory.unshift({
                    type: 'earned',
                    date: today.toISOString().split('T')[0],
                    desc: '🎂 Birthday free drink!'
                });
            }
        }
    });

    if (birthdayMembers.length > 0) {
        showBirthdayNotification(birthdayMembers);
    }
}

function showBirthdayNotification(birthdayMembers) {
    const names = birthdayMembers.map(m => m.name).join(', ');

    openModal('🎂 Birthday Rewards Sent!', `
        <div class="birthday-notification">
            <div class="birthday-icon">🎉</div>
            <h3>Happy Birthday!</h3>
            <p>Automatic birthday rewards have been sent to:</p>
            <div class="birthday-members">
                ${birthdayMembers.map(m => `
                    <div class="birthday-member">
                        <div class="customer-avatar">${m.name.split(' ').map(n => n[0]).join('')}</div>
                        <span>${m.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="birthday-message">
                <span class="material-icons-round">message</span>
                <p>"Happy Birthday! Don't forget to Enjoy Your Complimentary Coffee ☕"</p>
            </div>
            <button class="btn btn-primary" onclick="closeModal()">
                <span class="material-icons-round">check</span>
                Great!
            </button>
        </div>
    `);

    // Refresh the table
    const tbody = document.getElementById('membersTableBody');
    if (tbody) {
        initMembersTable();
    }
}

// ====================
// USER MANAGEMENT SYSTEM
// ====================

// Staff Users Data - Load from localStorage if available
const defaultStaffUsers = [
    {
        id: 1,
        name: 'Admin',
        surname: 'Manager',
        email: 'admin@creamcoffee.com',
        phone: '+1 555-0100',
        type: 'owner'
    },
    {
        id: 2,
        name: 'John',
        surname: 'Doe',
        email: 'john@creamcoffee.com',
        phone: '+1 555-0101',
        type: 'barista'
    }
];

let staffUsers = []; // Will be loaded from API

function saveUsers() {
    localStorage.setItem('cream_users', JSON.stringify(staffUsers));
}

// Open User Modal
window.openUserModal = function () {
    const overlay = document.getElementById('userModalOverlay');
    overlay?.classList.remove('hidden');

    // Reset form
    document.getElementById('addUserForm')?.reset();
};

// Toggle Password Visibility
window.togglePasswordVisibility = function () {
    const passwordInput = document.getElementById('userPassword');
    const toggleBtn = document.querySelector('.password-toggle .material-icons-round');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = 'visibility';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = 'visibility_off';
    }
};

// Update Users List UI
function updateUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    const usersCount = staffUsers.length;

    let html = `
        <div class="user-list-header">
            <span class="users-count">Staff Members (${usersCount})</span>
        </div>
    `;

    staffUsers.forEach(user => {
        const initials = user.name[0] + user.surname[0];
        const fullName = `${user.name} ${user.surname}`;
        const typeClass = user.type;
        const typeLabel = user.type === 'owner' ? 'Owner' : 'Barista';

        html += `
            <div class="user-item">
                <div class="user-item-avatar ${typeClass}">${initials}</div>
                <div class="user-item-info">
                    <span class="user-item-name">${fullName}</span>
                    <span class="user-item-email">${user.email}</span>
                </div>
                <span class="user-type-badge ${typeClass}">${typeLabel}</span>
                <div class="user-actions">
                    <button class="btn-edit-user" onclick="editUser(${user.id})" title="Edit user">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="btn-delete-user" onclick="deleteUser(${user.id})" title="Delete user">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </div>
        `;
    });

    usersList.innerHTML = html;
}

// Track editing state
let editingUserId = null;

// Edit User - Opens modal with pre-filled data
window.editUser = function (id) {
    const user = staffUsers.find(u => u.id === id);
    if (!user) return;

    editingUserId = id;

    // Pre-fill form
    document.getElementById('userName').value = user.name;
    document.getElementById('userSurname').value = user.surname;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPhone').value = user.phone;
    document.getElementById('userType').value = user.type;

    // Update modal title and button
    const modalHeader = document.querySelector('#userModalOverlay .modal-header h2');
    const submitBtn = document.querySelector('#addUserForm button[type="submit"]');

    if (modalHeader) modalHeader.textContent = 'Edit User';
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="material-icons-round">save</span> Save Changes';
    }

    // Open modal
    document.getElementById('userModalOverlay')?.classList.remove('hidden');
};


// Load users from database
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        staffUsers = users;
        loadUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Make loadUsers globally accessible
window.loadUsers = loadUsers;

// Modified Add User to handle both add and edit - NOW USES API
window.addUser = async function (event) {
    event.preventDefault();

    const name = document.getElementById('userName')?.value;
    const surname = document.getElementById('userSurname')?.value;
    const email = document.getElementById('userEmail')?.value;
    const password = document.getElementById('userPassword')?.value;
    const phone = document.getElementById('userPhone')?.value;
    const type = document.getElementById('userType')?.value;

    // Validation (password not required when editing)
    if (!name || !surname || !email || !phone || !type) {
        showToast('error', 'Missing Information', 'Please fill in all required fields');
        return;
    }

    if (!editingUserId && !password) {
        showToast('error', 'Missing Password', 'Please enter a password for the new user');
        return;
    }

    try {
        if (editingUserId) {
            // Update existing user via API
            const response = await fetch(`/api/users/${editingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, surname, email, phone, role: type })
            });
            if (!response.ok) throw new Error('Failed to update user');
            showToast('success', 'User Updated', `${name} ${surname}'s info has been updated`);
            editingUserId = null;
        } else {
            // Create new user via API
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, surname, email, phone, role: type, password })
            });
            if (!response.ok) throw new Error('Failed to create user');
            showToast('success', 'User Added', `${name} ${surname} has been added as ${type === 'owner' ? 'an Owner' : 'a Barista'}`);
        }
        
        await loadUsers();
        closeUserModal();
    } catch (error) {
        console.error('User error:', error);
        showToast('error', 'Error', error.message);
    }
};

// Modified closeUserModal to reset state
window.closeUserModal = function () {
    const overlay = document.getElementById('userModalOverlay');
    overlay?.classList.add('hidden');

    // Reset editing state
    editingUserId = null;

    // Reset modal title and button
    const modalHeader = document.querySelector('#userModalOverlay .modal-header h2');
    const submitBtn = document.querySelector('#addUserForm button[type="submit"]');

    if (modalHeader) modalHeader.textContent = 'Add New User';
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="material-icons-round">person_add</span> Add User';
    }

    // Reset form
    document.getElementById('addUserForm')?.reset();
};

// Delete User
window.deleteUser = function (id) {
    const userIndex = staffUsers.findIndex(u => u.id === id);
    if (userIndex === -1) return;

    const user = staffUsers[userIndex];
    const fullName = `${user.name} ${user.surname}`;

    // Confirm deletion
    if (confirm(`Are you sure you want to delete ${fullName}?`)) {
        staffUsers.splice(userIndex, 1);
        saveUsers();
        loadUsers();
        showToast('success', 'User Deleted', `${fullName} has been removed`);
    }
};

// Close user modal when clicking outside
document.addEventListener('click', function (e) {
    const overlay = document.getElementById('userModalOverlay');
    if (e.target === overlay) {
        closeUserModal();
    }
    const qrOverlay = document.getElementById('qrCodesModalOverlay');
    if (e.target === qrOverlay) {
        closeQRCodesModal();
    }
});

// ====================
// QR CODES MODAL
// ====================

// Open QR Codes Modal
window.openQRCodesModal = function () {
    const overlay = document.getElementById('qrCodesModalOverlay');
    overlay?.classList.remove('hidden');
};

// Close QR Codes Modal
window.closeQRCodesModal = function () {
    const overlay = document.getElementById('qrCodesModalOverlay');
    overlay?.classList.add('hidden');
};

// Download QR Code
window.downloadQR = function (type) {
    const urls = {
        member: 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://cream-coffee.com/member-survey',
        elite: 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://cream-coffee.com/elite-member-survey'
    };

    const filename = type === 'member' ? 'cream-member-survey-qr.png' : 'cream-elite-member-survey-qr.png';

    // Open in new tab (for download)
    const link = document.createElement('a');
    link.href = urls[type];
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Downloading QR Code', `${type === 'member' ? 'Member' : 'Elite Member'} survey QR code`);
};

// ====================
// STORE MANAGEMENT
// ====================

// Stores Data - Load from API
let stores = [];

// Load stores from API
async function loadStores() {
    try {
        const response = await fetch('/api/stores');
        if (response.ok) {
            stores = await response.json();
            updateStoresList();
        }
    } catch (error) {
        console.error('Failed to load stores:', error);
    }
}

let editingStoreId = null;

// Open Store Modal
window.openStoreModal = function () {
    const overlay = document.getElementById('storeModalOverlay');
    overlay?.classList.remove('hidden');
    document.getElementById('addStoreForm')?.reset();
};

// Close Store Modal
window.closeStoreModal = function () {
    const overlay = document.getElementById('storeModalOverlay');
    overlay?.classList.add('hidden');
    editingStoreId = null;

    const modalHeader = document.querySelector('#storeModalOverlay .modal-header h2');
    const submitBtn = document.querySelector('#addStoreForm button[type="submit"]');
    if (modalHeader) modalHeader.textContent = 'Add New Store';
    if (submitBtn) submitBtn.innerHTML = '<span class="material-icons-round">add_business</span> Add Store';

    document.getElementById('addStoreForm')?.reset();
};

// Add/Edit Store
window.addStore = async function (event) {
    event.preventDefault();

    const name = document.getElementById('storeName')?.value;
    const address = document.getElementById('storeAddress')?.value;
    const manager = document.getElementById('storeManager')?.value;
    const phone = document.getElementById('storePhone')?.value;

    if (!name || !address || !manager || !phone) {
        showToast('error', 'Missing Information', 'Please fill in all fields');
        return;
    }

    try {
        if (editingStoreId) {
            const response = await fetch(`/api/stores/${editingStoreId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, address, manager, phone })
            });
            if (!response.ok) throw new Error('Failed to update store');
            showToast('success', 'Store Updated', `${name} has been updated`);
            editingStoreId = null;
        } else {
            const response = await fetch('/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, address, manager, phone })
            });
            if (!response.ok) throw new Error('Failed to add store');
            showToast('success', 'Store Added', `${name} has been added`);
        }
        await loadStores();
        updateStoresList();
        loadUsers();
        closeStoreModal();
    } catch (error) {
        console.error('Store error:', error);
        showToast('error', 'Error', error.message);
    }
};

// Edit Store
window.editStore = function (id) {
    const store = stores.find(s => s.id === id);
    if (!store) return;

    editingStoreId = id;
    document.getElementById('storeName').value = store.name;
    document.getElementById('storeAddress').value = store.address;
    document.getElementById('storeManager').value = store.manager;
    document.getElementById('storePhone').value = store.phone;

    const modalHeader = document.querySelector('#storeModalOverlay .modal-header h2');
    const submitBtn = document.querySelector('#addStoreForm button[type="submit"]');
    if (modalHeader) modalHeader.textContent = 'Edit Store';
    if (submitBtn) submitBtn.innerHTML = '<span class="material-icons-round">save</span> Save Changes';

    document.getElementById('storeModalOverlay')?.classList.remove('hidden');
};

// Delete Store
window.deleteStore = function (id) {
    const storeIndex = stores.findIndex(s => s.id === id);
    if (storeIndex === -1) return;

    const store = stores[storeIndex];
    if (confirm(`Are you sure you want to delete ${store.name}?`)) {
        stores.splice(storeIndex, 1);
        saveStores();
        updateStoresList();
        loadUsers();
        showToast('success', 'Store Deleted', `${store.name} has been removed`);
    }
};

// Update Stores List
function updateStoresList() {
    const storesList = document.getElementById('storesList');
    if (!storesList) return;

    let html = `<div class="store-list-header"><span class="stores-count">Locations (${stores.length})</span></div>`;

    stores.forEach(store => {
        html += `
            <div class="store-item">
                <div class="store-item-icon"><span class="material-icons-round">store</span></div>
                <div class="store-item-info">
                    <span class="store-item-name">${store.name}</span>
                    <span class="store-item-address">${store.address}</span>
                    <span class="store-item-manager"><span class="material-icons-round">person</span>${store.manager}</span>
                    <span class="store-item-phone"><span class="material-icons-round">phone</span>${store.phone}</span>
                </div>
                <div class="store-actions">
                    <button class="btn-edit-store" onclick="editStore(${store.id})" title="Edit store"><span class="material-icons-round">edit</span></button>
                    <button class="btn-delete-store" onclick="deleteStore(${store.id})" title="Delete store"><span class="material-icons-round">delete</span></button>
                </div>
            </div>
        `;
    });

    storesList.innerHTML = html;
}

// Close store modal when clicking outside
document.addEventListener('click', function (e) {
    const storeOverlay = document.getElementById('storeModalOverlay');
    if (e.target === storeOverlay) closeStoreModal();
});

// Delete Member - CALLS API
window.deleteMember = async function (id, name) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/members/${member.memberId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            showToast('success', 'Member Deleted', `${name} has been removed from the system.`);

            // Refresh table
            const tbody = document.getElementById('membersTableBody');
            if (tbody) {
                loadMembersFromAPI();
            }
        } else {
            showToast('error', 'Error', result.error || 'Failed to delete member');
        }
    } catch (error) {
        console.error('Delete API error:', error);
        showToast('error', 'Error', 'Failed to delete member. Check connection.');
    }
};

// ============================================
// DYNAMIC DATA LOADING
// ============================================

// Load campaigns from API
async function loadCampaigns() {
    try {
        const response = await fetch('/api/campaigns');
        const campaigns = await response.json();
        renderCampaigns(campaigns);
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

// Render campaigns dynamically
function renderCampaigns(campaigns) {
    const container = document.getElementById('campaignsList');
    if (!container) return;

    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">campaign</span>
                <p>No active campaigns. Create one to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = campaigns.map(c => `
        <div class="campaign-card ${c.is_active ? 'active' : 'inactive'}">
            <div class="campaign-header">
                <span class="campaign-status ${c.is_active ? 'active' : ''}">${c.is_active ? 'Active' : 'Inactive'}</span>
                <button class="btn-icon" onclick="deleteCampaign(${c.id})">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
            <h3>${c.name}</h3>
            <p>${c.description || 'No description'}</p>
            <div class="campaign-meta">
                <span class="campaign-type">${c.campaign_type || 'General'}</span>
                ${c.start_date ? `<span class="campaign-date">${new Date(c.start_date).toLocaleDateString()}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Delete campaign
window.deleteCampaign = async function (id) {
    if (!confirm('Delete this campaign?')) return;
    try {
        await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        showToast('success', 'Deleted', 'Campaign removed');
        loadCampaigns();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete campaign');
    }
};

// Load messages from API
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Render messages dynamically
function renderMessages(messages) {
    const container = document.getElementById('messagesList');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">message</span>
                <p>No messages sent yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.slice(0, 10).map(m => `
        <div class="message-item">
            <span class="material-icons-round">email</span>
            <div class="message-content">
                <span class="message-title">${m.title}</span>
                <span class="message-meta">${m.member_name || 'All Members'} • ${new Date(m.sent_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Load global reward history from API
async function loadRewardHistory() {
    try {
        const response = await fetch('/api/rewards/history');
        const history = await response.json();
        renderGlobalRewardHistory(history);
    } catch (error) {
        console.error('Error loading reward history:', error);
    }
}

// Render global reward history
function renderGlobalRewardHistory(history) {
    const container = document.getElementById('rewardHistoryList');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">card_giftcard</span>
                <p>No reward activity yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.slice(0, 10).map(h => `
        <div class="reward-history-item ${h.type}">
            <span class="material-icons-round">${h.type === 'earned' ? 'card_giftcard' : 'redeem'}</span>
            <div class="reward-history-content">
                <span class="reward-history-title">${h.description}</span>
                <span class="reward-history-meta">${h.member_name} • ${new Date(h.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Initialize dynamic data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCampaigns();
    loadMessages();
    loadRewardHistory();
});

// Create campaign with API
window.createCampaign = async function () {
    const name = document.getElementById('campaignName')?.value;
    const description = document.getElementById('campaignDesc')?.value;
    const campaign_type = document.getElementById('campaignType')?.value;
    const start_date = document.getElementById('campaignStart')?.value;
    const end_date = document.getElementById('campaignEnd')?.value;

    if (!name) {
        showToast('error', 'Error', 'Please enter a campaign name');
        return;
    }

    try {
        const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, campaign_type, start_date, end_date, is_active: true })
        });
        const result = await response.json();
        if (result.success) {
            closeModal();
            showToast('success', 'Campaign Created', 'Your campaign is now active');
            loadCampaigns();
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to create campaign');
    }
};

console.log('✅ All CRM functions loaded');

// ====================
// MEMBER SEARCH AUTOCOMPLETE
// ====================

// Store for member data used in search
let memberSearchData = [];

// Initialize member search data
async function initMemberSearchData() {
    try {
        if (members && members.length > 0) {
            memberSearchData = members;
        } else {
            const response = await fetch('/api/members');
            memberSearchData = await response.json();
        }
        console.log('✅ Member search data loaded:', memberSearchData.length, 'members');
    } catch (error) {
        console.error('Error loading member search data:', error);
    }
}

// Filter and show member suggestions
window.filterMembers = function (input, suggestionsId) {
    const query = input.value.toLowerCase().trim();
    const suggestionsContainer = document.getElementById(suggestionsId);

    if (!suggestionsContainer) return;

    // If query is empty, hide suggestions
    if (query.length === 0) {
        suggestionsContainer.classList.remove('active');
        suggestionsContainer.innerHTML = '';
        return;
    }

    // Filter members by name
    const matches = memberSearchData.filter(m => {
        const name = (m.name || '').toLowerCase();
        const memberId = (m.member_id || m.memberId || '').toLowerCase();
        return name.includes(query) || memberId.includes(query);
    }).slice(0, 8); // Limit to 8 suggestions

    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div class="member-suggestions-empty">No members found</div>';
        suggestionsContainer.classList.add('active');
        return;
    }

    // Render suggestions
    suggestionsContainer.innerHTML = matches.map(m => {
        const name = m.name || '';
        const memberId = m.member_id || m.memberId || '';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

        // Highlight matching text
        const highlightedName = highlightMatch(name, query);

        return `
            <div class="member-suggestion-item" onclick="selectMember(${m.id}, '${name.replace(/'/g, "\\'")}', '${memberId}', '${suggestionsId}')">
                <div class="member-suggestion-avatar">${initials}</div>
                <div class="member-suggestion-info">
                    <span class="member-suggestion-name">${highlightedName}</span>
                    <span class="member-suggestion-id">${memberId}</span>
                </div>
            </div>
        `;
    }).join('');

    suggestionsContainer.classList.add('active');
};

// Highlight matching text
function highlightMatch(text, query) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return `${before}<mark>${match}</mark>${after}`;
}

// Select a member from suggestions
window.selectMember = function (id, name, memberId, suggestionsId) {
    const suggestionsContainer = document.getElementById(suggestionsId);
    const isRewards = suggestionsId === 'rewardMemberSuggestions';

    // Get the corresponding elements - use campaignMemberSearch for messages
    const searchInput = document.getElementById(isRewards ? 'rewardMemberSearch' : 'campaignMemberSearch');
    const hiddenInput = document.getElementById(isRewards ? 'rewardMemberSelect' : 'memberSelect');
    const container = document.getElementById(isRewards ? 'rewardMemberSelectGroup' : 'memberSelectGroup');

    // Update inputs
    if (searchInput) searchInput.value = name;
    if (hiddenInput) {
        hiddenInput.value = id;
        hiddenInput.dataset.memberName = name;
        hiddenInput.dataset.memberId = memberId;
    }

    // Hide suggestions
    if (suggestionsContainer) suggestionsContainer.classList.remove('active');

    // Show selected member chip
    showSelectedMemberChip(container, id, name, memberId, isRewards);

    console.log('✅ Selected member:', name, '(ID:', id, ')');
};

// Show selected member chip
function showSelectedMemberChip(container, id, name, memberId, isRewards) {
    // Remove existing chip
    const existingChip = container.querySelector('.selected-member-chip');
    if (existingChip) existingChip.remove();

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

    const chip = document.createElement('div');
    chip.className = 'selected-member-chip';
    chip.innerHTML = `
        <div class="member-suggestion-avatar">${initials}</div>
        <span>${name}</span>
        <span class="material-icons-round remove-member" onclick="clearSelectedMember('${isRewards ? 'reward' : 'message'}')">close</span>
    `;

    container.appendChild(chip);
}

// Clear selected member
window.clearSelectedMember = function (type) {
    const isRewards = type === 'reward';
    // Use campaignMemberSearch for messages
    const searchInput = document.getElementById(isRewards ? 'rewardMemberSearch' : 'campaignMemberSearch');
    const hiddenInput = document.getElementById(isRewards ? 'rewardMemberSelect' : 'memberSelect');
    const container = document.getElementById(isRewards ? 'rewardMemberSelectGroup' : 'memberSelectGroup');

    if (searchInput) searchInput.value = '';
    if (hiddenInput) {
        hiddenInput.value = '';
        delete hiddenInput.dataset.memberName;
        delete hiddenInput.dataset.memberId;
    }

    // Remove chip
    const chip = container.querySelector('.selected-member-chip');
    if (chip) chip.remove();
};

// Close suggestions when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.member-search-container')) {
        document.querySelectorAll('.member-suggestions').forEach(s => s.classList.remove('active'));
    }
});

// Initialize member search data on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMemberSearchData, 500);
});

// ============================================
// EXPORT DATA TO CSV
// ============================================

// Updated export function with all data points
window.exportData = function() {
    if (!members || members.length === 0) {
        showToast('error', 'No Data', 'No members to export');
        return;
    }
    
    // Calculate age from birthday
    const calculateAge = (birthday) => {
        if (!birthday) return '';
        const today = new Date();
        const birth = new Date(birthday);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };
    
    // CSV headers matching user requirements
    const headers = [
        'Member ID',
        'Name', 
        'Date of Birth',
        'Age',
        'Gender',
        'Email',
        'Phone Number',
        'Member Since',
        'Language',
        'Device Type',
        'Stamps',
        'Rewards',
        'Consent',
        'Deleted At'
    ];
    
    // Convert members to CSV rows
    const rows = members.map(m => [
        m.member_id || '',
        m.name || '',
        m.birthday ? new Date(m.birthday).toLocaleDateString() : '',
        calculateAge(m.birthday),
        m.gender || '',
        m.email || '',
        m.phone || '',
        m.created_at ? new Date(m.created_at).toLocaleDateString() : '',
        m.language || 'en',
        m.device_type || '',
        m.stamps || 0,
        m.availableRewards || 0,
        m.consent !== false ? 'Yes' : 'No',
        m.deleted_at ? new Date(m.deleted_at).toLocaleDateString() : ''
    ]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cream-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Export Complete', `${members.length} members exported to CSV`);
};

// ============================================
// TRANSACTIONS FEED
// ============================================

let transactionsInterval = null;

window.loadTransactions = async function() {
    try {
        const response = await fetch('/api/transactions?limit=100');
        const transactions = await response.json();
        
        // Store for CSV export
        allTransactions = transactions;
        
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-light);">No transactions yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.map(t => {
            // Format timestamp: DD MMM YYYY HH:MM
            const date = new Date(t.created_at);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formattedDate = `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            // Format transaction data
            let transactionText = '';
            const data = t.transaction_data || {};
            if (t.transaction_type === 'stamp') {
                transactionText = `Stamps: ${data.stamps_added || 1}`;
            } else if (t.transaction_type === 'redeem') {
                transactionText = 'Reward Redeemed';
            } else if (t.transaction_type === 'message') {
                transactionText = 'Message Sent';
            } else {
                transactionText = t.transaction_type;
            }
            
            // Transaction type badge color
            const typeColors = {
                stamp: '#4CAF50',
                redeem: '#9C27B0', 
                message: '#2196F3',
                birthday: '#FF9800',
                coupon: '#E91E63'
            };
            const typeColor = typeColors[t.transaction_type] || '#757575';
            
            return `
                <tr>
                    <td><code style="background: var(--glass-bg); padding: 4px 8px; border-radius: 4px;">${t.member_code || '-'}</code></td>
                    <td>${t.member_name || '-'}</td>
                    <td>${transactionText}</td>
                    <td>${t.campaign_id ? `Campaign #${t.campaign_id}` : '-'}</td>
                    <td><span style="background: ${typeColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">${t.transaction_type}</span></td>
                    <td style="white-space: nowrap;">${formattedDate}</td>
                    <td>Active</td>
                    <td>${t.shop || '-'}</td>
                    <td>${t.user_name || '-'}</td>
                    <td><span style="background: var(--glass-bg); padding: 4px 8px; border-radius: 4px; font-size: 11px;">${t.panel || 'crm'}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
};

// Start auto-refresh when on transactions page
function startTransactionsAutoRefresh() {
    if (transactionsInterval) clearInterval(transactionsInterval);
    loadTransactions();
    transactionsInterval = setInterval(loadTransactions, 10000); // Refresh every 10 seconds
}

function stopTransactionsAutoRefresh() {
    if (transactionsInterval) {
        clearInterval(transactionsInterval);
        transactionsInterval = null;
    }
}

// Page navigation is handled in showPage() function above

console.log('✅ Transactions feed loaded');

// ============================================
// TRANSACTIONS CSV EXPORT
// ============================================

let allTransactions = []; // Store all loaded transactions for export

window.exportTransactionsToCSV = function() {
    if (!allTransactions || allTransactions.length === 0) {
        showToast('warning', 'No Data', 'No transactions to export. Please wait for data to load.');
        return;
    }
    
    const headers = [
        'Transaction ID',
        'Timestamp',
        'Member Code',
        'Member Name',
        'Transaction Type',
        'Stamps Added',
        'New Total',
        'Campaign ID',
        'Shop',
        'User',
        'Panel'
    ];
    
    const rows = allTransactions.map(t => {
        const data = t.transaction_data || {};
        return [
            t.id || '',
            t.created_at ? new Date(t.created_at).toLocaleString() : '',
            t.member_code || '',
            t.member_name || '',
            t.transaction_type || '',
            data.stamps_added || '',
            data.new_total || '',
            t.campaign_id || '',
            t.shop || '',
            t.user_name || '',
            t.panel || ''
        ];
    });
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cream-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Export Complete', `${allTransactions.length} transactions exported to CSV`);
};

// ============================================
// MONITORING PAGE
// ============================================

let monitoringInterval = null;

// Load monitoring data from API
async function loadMonitoringData() {
    try {
        const response = await fetch('/api/monitoring');
        const data = await response.json();
        updateMonitoringUI(data);
    } catch (error) {
        console.error('Failed to load monitoring data:', error);
        // Show error state with null checks
        const serverText = document.getElementById('serverStatusText');
        const serverStatus = document.getElementById('serverStatus');
        if (serverText) serverText.textContent = 'Error';
        if (serverStatus) {
            const indicator = serverStatus.querySelector('.status-indicator');
            if (indicator) indicator.className = 'status-indicator unhealthy';
        }
    }
}

// Update the monitoring UI with data
function updateMonitoringUI(data) {
    // Update last refresh time (optional element)
    const lastUpdate = document.getElementById('monitoringLastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    }
    
    // Server status
    const serverStatus = document.getElementById('serverStatus');
    if (!serverStatus) return; // Exit if modal not present
    const serverIndicator = serverStatus.querySelector('.status-indicator');
    const serverText = document.getElementById('serverStatusText');
    if (data.status === 'healthy') {
        serverIndicator.className = 'status-indicator healthy';
        serverText.textContent = 'Online';
    } else if (data.status === 'degraded') {
        serverIndicator.className = 'status-indicator degraded';
        serverText.textContent = 'Degraded';
    } else {
        serverIndicator.className = 'status-indicator unhealthy';
        serverText.textContent = 'Offline';
    }
    
    // Database status
    const dbIndicator = document.getElementById('dbStatus').querySelector('.status-indicator');
    const dbText = document.getElementById('dbStatusText');
    if (data.database && data.database.status === 'connected') {
        dbIndicator.className = 'status-indicator healthy';
        dbText.textContent = 'Connected';
    } else {
        dbIndicator.className = 'status-indicator unhealthy';
        dbText.textContent = 'Disconnected';
    }
    
    // Latency metrics
    if (data.database) {
        document.getElementById('dbLatency').textContent = data.database.latency + 'ms';
    }
    document.getElementById('responseTime').textContent = data.responseTime + 'ms';
    
    // System info
    if (data.system) {
        document.getElementById('systemUptime').textContent = data.system.uptimeFormatted;
        document.getElementById('nodeVersion').textContent = data.system.nodeVersion;
        document.getElementById('systemPlatform').textContent = data.system.platform;
        document.getElementById('processPid').textContent = data.system.pid;
    }
    
    // Memory
    if (data.memory) {
        document.getElementById('memoryUsed').textContent = data.memory.heapUsed + ' MB';
        document.getElementById('memoryTotal').textContent = data.memory.heapTotal + ' MB';
        document.getElementById('memoryPercent').textContent = data.memory.percentUsed + '%';
        document.getElementById('memoryBar').style.width = data.memory.percentUsed + '%';
        document.getElementById('memoryRss').textContent = data.memory.rss + ' MB';
        document.getElementById('memoryExternal').textContent = data.memory.external + ' MB';
    }
    
    // Database pool
    if (data.database && data.database.pool) {
        document.getElementById('poolTotal').textContent = data.database.pool.total || '-';
        document.getElementById('poolIdle').textContent = data.database.pool.idle || '-';
        document.getElementById('poolWaiting').textContent = data.database.pool.waiting || '-';
    }
    
    // Business metrics
    if (data.metrics) {
        document.getElementById('metricMembers').textContent = data.metrics.totalMembers.toLocaleString();
        document.getElementById('metricStamps').textContent = data.metrics.totalStamps.toLocaleString();
        document.getElementById('metricRewards').textContent = data.metrics.totalRewards.toLocaleString();
        document.getElementById('metricToday').textContent = data.metrics.todayMembers.toLocaleString();
        document.getElementById('metricTransactions').textContent = data.metrics.last24hTransactions.toLocaleString();
    }
    
    // Recent activity
    if (data.recentActivity) {
        renderActivityFeed(data.recentActivity);
    }
}

// Render activity feed
function renderActivityFeed(activities) {
    const container = document.getElementById('activityFeed');
    if (!container) return; // Element not present in modal
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="activity-loading">No recent activity</div>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const iconClass = activity.type === 'stamp' ? 'stamp' : 
                          activity.type === 'redeem' ? 'redeem' : 'register';
        const icon = activity.type === 'stamp' ? '☕' : 
                     activity.type === 'redeem' ? '🎁' : '👤';
        
        const timeAgo = getTimeAgo(new Date(activity.timestamp));
        
        let description = '';
        if (activity.type === 'stamp') {
            description = `${activity.memberName || activity.memberCode} received a stamp`;
        } else if (activity.type === 'redeem') {
            description = `${activity.memberName || activity.memberCode} redeemed a reward`;
        } else {
            description = `${activity.memberName || 'New member'} registered`;
        }
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${icon}</div>
                <div class="activity-info">
                    <span class="activity-title">${description}</span>
                    <span class="activity-meta">${activity.panel || 'crm'}</span>
                </div>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;
    }).join('');
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// Start auto-refresh when on monitoring page
function startMonitoringAutoRefresh() {
    loadMonitoringData(); // Load immediately
    monitoringInterval = setInterval(loadMonitoringData, 10000); // Refresh every 10s
}

// Stop auto-refresh
function stopMonitoringAutoRefresh() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
}

// Hook into page navigation
const originalShowPage = window.showPage;
if (originalShowPage) {
    window.showPage = function(pageId) {
        // Stop monitoring refresh when leaving
        stopMonitoringAutoRefresh();
        
        // Call original function
        originalShowPage(pageId);
        
        // Start refresh if on monitoring page
        if (pageId === 'monitoring') {
            startMonitoringAutoRefresh();
        }
    };
}

// ============================================
// MONITORING MODAL FUNCTIONS
// ============================================

function openMonitoringModal() {
    document.getElementById('monitoringModalOverlay').classList.remove('hidden');
    loadMonitoringData();
    startMonitoringAutoRefresh();
}

function closeMonitoringModal() {
    document.getElementById('monitoringModalOverlay').classList.add('hidden');
    stopMonitoringAutoRefresh();
}

// Close modal when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('monitoringModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeMonitoringModal();
            }
        });
    }
});

// ==================== 
// MEMBER LOGIN & PROFILE SYSTEM
// ====================

// Check for existing member session on page load
document.addEventListener('DOMContentLoaded', () => {
    checkMemberSession();
});

// Check if member is logged in
function checkMemberSession() {
    const memberData = localStorage.getItem('staffSession');
    if (memberData) {
        try {
            const member = JSON.parse(memberData);
            updateMemberUI(member);
        } catch (e) {
            localStorage.removeItem('staffSession');
        }
    }
}

// Update UI based on staff login state
function updateMemberUI(user) {
    const loginSection = document.getElementById('memberLoginSection');
    const profileSection = document.getElementById('memberProfileSection');
    const memberAvatar = document.getElementById('memberAvatar');
    const memberDisplayName = document.getElementById('memberDisplayName');
    const memberDisplayId = document.getElementById('memberDisplayId');
    
    if (user) {
        // Show logged-in state
        loginSection.classList.add('hidden');
        profileSection.classList.remove('hidden');
        
        // Set avatar initials - safely access name
        const name = user.name || 'User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        memberAvatar.textContent = initials;
        memberDisplayName.textContent = name;
        memberDisplayId.textContent = user.email || '';
    } else {
        // Show logged-out state
        loginSection.classList.remove('hidden');
        profileSection.classList.add('hidden');
    }
}

// Open member login modal
function openMemberLoginModal() {
    document.getElementById('memberLoginModalOverlay').classList.remove('hidden');
    document.getElementById('memberLoginEmail').focus();
    // Clear any previous errors
    document.getElementById('memberLoginError').classList.add('hidden');
}

// Close member login modal
function closeMemberLoginModal() {
    document.getElementById('memberLoginModalOverlay').classList.add('hidden');
    document.getElementById('memberLoginForm').reset();
}

// Handle member login
async function handleMemberLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('memberLoginEmail').value;
    const password = document.getElementById('memberLoginPassword').value;
    const errorDiv = document.getElementById('memberLoginError');
    const errorText = document.getElementById('memberLoginErrorText');
    
    try {
        const response = await fetch('/api/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorText.textContent = data.error || 'Login failed';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Save session and update UI
        localStorage.setItem('staffSession', JSON.stringify(data.user));
        updateMemberUI(data.user);
        closeMemberLoginModal();
        showToast('success', 'Welcome!', `Logged in as ${data.user.name}`);
    } catch (error) {
        errorText.textContent = 'Connection error. Please try again.';
        errorDiv.classList.remove('hidden');
    }
}

// Open member profile modal
function openMemberProfileModal() {
    const memberData = localStorage.getItem('staffSession');
    if (!memberData) return;
    
    const user = JSON.parse(memberData);
    
    // Populate profile fields
    const name = user.name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileMemberId').textContent = user.email || '';
    document.getElementById('profileStamps').textContent = member.stamps || 0;
    document.getElementById('profileRewards').textContent = member.available_rewards || 0;
    
    // Populate form fields
    document.getElementById('profileEditName').value = user.name || '';
    document.getElementById('profileEditPhone').value = member.phone || '';
    document.getElementById('profileEditBirthday').value = member.birthday ? member.birthday.split('T')[0] : '';
    document.getElementById('profileEditGender').value = member.gender || '';
    document.getElementById('profileEditEmail').value = member.email || '';
    
    document.getElementById('memberProfileModalOverlay').classList.remove('hidden');
}

// Close member profile modal
function closeMemberProfileModal() {
    document.getElementById('memberProfileModalOverlay').classList.add('hidden');
}

// Handle member profile update
async function handleMemberProfileUpdate(event) {
    event.preventDefault();
    
    const memberData = localStorage.getItem('staffSession');
    if (!memberData) return;
    
    const member = JSON.parse(memberData);
    
    const updatedData = {
        name: document.getElementById('profileEditName').value,
        phone: document.getElementById('profileEditPhone').value || null,
        birthday: document.getElementById('profileEditBirthday').value || null,
        gender: document.getElementById('profileEditGender').value || null
    };
    
    try {
        const response = await fetch(`/api/member/profile/${user.email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showToast('error', 'Error', data.error || 'Failed to update profile');
            return;
        }
        
        // Update session with new data
        const updatedMember = { ...member, ...data.user };
        localStorage.setItem('staffSession', JSON.stringify(updatedMember));
        updateMemberUI(updatedMember);
        
        closeMemberProfileModal();
        showToast('success', 'Profile Updated', 'Your changes have been saved');
    } catch (error) {
        showToast('error', 'Error', 'Connection error. Please try again.');
    }
}

// Handle member logout
function handleMemberLogout() {
    localStorage.removeItem('staffSession');
    updateMemberUI(null);
    closeMemberProfileModal();
    showToast('info', 'Logged Out', 'You have been logged out');
}

// Open set password modal
function openSetPasswordModal() {
    closeMemberLoginModal();
    document.getElementById('setPasswordModalOverlay').classList.remove('hidden');
    document.getElementById('setPasswordEmail').focus();
    document.getElementById('setPasswordError').classList.add('hidden');
}

// Close set password modal
function closeSetPasswordModal() {
    document.getElementById('setPasswordModalOverlay').classList.add('hidden');
    document.getElementById('setPasswordForm').reset();
}

// Handle set password
async function handleSetPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('setPasswordEmail').value;
    const password = document.getElementById('setPasswordNew').value;
    const confirmPassword = document.getElementById('setPasswordConfirm').value;
    const errorDiv = document.getElementById('setPasswordError');
    const errorText = document.getElementById('setPasswordErrorText');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorText.textContent = 'Passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/staff/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorText.textContent = data.error || 'Failed to set password';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        closeSetPasswordModal();
        showToast('success', 'Password Set', 'You can now login with your new password');
        openMemberLoginModal();
        document.getElementById('memberLoginEmail').value = email;
    } catch (error) {
        errorText.textContent = 'Connection error. Please try again.';
        errorDiv.classList.remove('hidden');
    }
}

// Toggle password visibility for member login
function toggleMemberPasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('.material-icons-round');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
    }
}

