// C.R.E.A.M. COFFEE CRM - Stamps & Rewards System
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initSidebar();
    // Load stats FIRST, then animate counters
    await loadStatsAndInitCounters();
    loadMembersFromAPI();
    initCharts();
    initModals();
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
window.addStampToMember = async function (id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    try {
        // Call API to add stamp
        const response = await fetch(`/api/members/${member.memberId}/stamp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            // Update local data with response
            const prevStamps = member.stamps;
            member.stamps = result.member.stamps;
            member.totalRewards = result.member.total_rewards;
            member.availableRewards = result.member.available_rewards;

            if (result.member.stamps === 0 && prevStamps > 0) {
                // Just earned a reward (stamps reset to 0)
                showToast('success', '🎉 Reward Earned!', `${member.name} earned a free drink!`);
            } else {
                showToast('success', 'Stamp Added', `${member.name} now has ${result.member.stamps}/6 stamps`);
            }

            // Refresh table
            const tbody = document.getElementById('membersTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                loadMembersFromAPI();
            }
        } else {
            showToast('error', 'Error', result.error || 'Failed to add stamp');
        }
    } catch (error) {
        console.error('Stamp API error:', error);
        showToast('error', 'Error', 'Failed to add stamp. Check connection.');
    }
};

// Redeem Reward - NOW CALLS API  
window.redeemReward = async function (id) {
    const member = members.find(m => m.id === id);
    if (!member || member.availableRewards <= 0) return;

    try {
        const response = await fetch(`/api/members/${member.memberId}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            member.availableRewards = result.member.available_rewards;
            showToast('success', 'Reward Redeemed', `Free drink applied for ${member.name}!`);

            // Refresh table
            const tbody = document.getElementById('membersTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                loadMembersFromAPI();
            }
        } else {
            showToast('error', 'Error', result.error || 'Failed to redeem reward');
        }
    } catch (error) {
        console.error('Redeem API error:', error);
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
    updateUsersList();
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

    openModal(`Message ${member.name}`, `
        <div class="member-message-form">
            <div class="message-recipient">
                <span class="material-icons-round">person</span>
                <span>Sending to: <strong>${member.name}</strong> (${member.memberId})</span>
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
        showToast('success', 'Message Sent!', `Message delivered to ${member.name}`);
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
        tbody.innerHTML = '';
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

let staffUsers = JSON.parse(localStorage.getItem('cream_users')) || defaultStaffUsers;

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

// Modified Add User to handle both add and edit
window.addUser = function (event) {
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

    if (editingUserId) {
        // Update existing user
        const user = staffUsers.find(u => u.id === editingUserId);
        if (user) {
            user.name = name;
            user.surname = surname;
            user.email = email;
            user.phone = phone;
            user.type = type;
            saveUsers();
            showToast('success', 'User Updated', `${name} ${surname}'s info has been updated`);
        }
        editingUserId = null;
    } else {
        // Create new user
        const newUser = {
            id: staffUsers.length > 0 ? Math.max(...staffUsers.map(u => u.id)) + 1 : 1,
            name: name,
            surname: surname,
            email: email,
            phone: phone,
            type: type
        };
        staffUsers.push(newUser);
        saveUsers();
        showToast('success', 'User Added', `${name} ${surname} has been added as ${type === 'owner' ? 'an Owner' : 'a Barista'}`);
    }

    updateUsersList();
    closeUserModal();
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
        updateUsersList();
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

// Stores Data
// Stores Data - Load from localStorage if available
const defaultStores = [
    {
        id: 1,
        name: 'C.R.E.A.M. Paspatur',
        address: 'Cumhuriyet Mah 38. Sokak No:4',
        manager: 'Ece Diler Türedi',
        phone: '05336892009'
    }
];

let stores = JSON.parse(localStorage.getItem('cream_stores')) || defaultStores;

function saveStores() {
    localStorage.setItem('cream_stores', JSON.stringify(stores));
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
        updateUsersList();
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
        updateUsersList();
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
                tbody.innerHTML = '';
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
