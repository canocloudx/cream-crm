// C.R.E.A.M. COFFEE CRM - Application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSidebar();
    initCharts();
    initCounters();
    initPassDesigner();
    initBaristaApp();
    initCustomersTable();
    initNotifications();
    initModals();
});

// Sample Data
const customers = [
    { id: 1, name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '(555) 123-4567', tier: 'platinum', points: 4250, visits: 156, lastVisit: 'Today', status: 'active' },
    { id: 2, name: 'Mike Johnson', email: 'mike.j@email.com', phone: '(555) 234-5678', tier: 'gold', points: 2890, visits: 98, lastVisit: 'Today', status: 'active' },
    { id: 3, name: 'Emma Wilson', email: 'emma.w@email.com', phone: '(555) 345-6789', tier: 'silver', points: 1450, visits: 67, lastVisit: 'Yesterday', status: 'active' },
    { id: 4, name: 'David Kim', email: 'david.k@email.com', phone: '(555) 456-7890', tier: 'gold', points: 2100, visits: 84, lastVisit: '2 days ago', status: 'active' },
    { id: 5, name: 'Lisa Park', email: 'lisa.p@email.com', phone: '(555) 567-8901', tier: 'bronze', points: 320, visits: 23, lastVisit: '1 week ago', status: 'active' },
    { id: 6, name: 'James Brown', email: 'james.b@email.com', phone: '(555) 678-9012', tier: 'silver', points: 890, visits: 45, lastVisit: '3 days ago', status: 'active' },
    { id: 7, name: 'Maria Garcia', email: 'maria.g@email.com', phone: '(555) 789-0123', tier: 'platinum', points: 5200, visits: 178, lastVisit: 'Today', status: 'active' },
    { id: 8, name: 'Robert Taylor', email: 'robert.t@email.com', phone: '(555) 890-1234', tier: 'bronze', points: 150, visits: 12, lastVisit: '2 weeks ago', status: 'inactive' },
    { id: 9, name: 'Jennifer Lee', email: 'jennifer.l@email.com', phone: '(555) 901-2345', tier: 'gold', points: 1980, visits: 76, lastVisit: 'Yesterday', status: 'active' },
    { id: 10, name: 'William Chen', email: 'william.c@email.com', phone: '(555) 012-3456', tier: 'silver', points: 720, visits: 34, lastVisit: '5 days ago', status: 'active' }
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

    // Handle view all links
    document.querySelectorAll('[data-page]').forEach(link => {
        if (!link.classList.contains('nav-item')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.dataset.page;
                document.querySelector(`.nav-item[data-page="${pageId}"]`)?.click();
            });
        }
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
    const prefix = element.dataset.prefix || '';
    const duration = 1500;
    const start = Date.now();

    const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(eased * target);

        element.textContent = prefix + current.toLocaleString();

        if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
}

// Charts
function initCharts() {
    initEngagementChart();
    initPointsChart();
    initTierChart();
    initAcquisitionChart();
}

function initEngagementChart() {
    const ctx = document.getElementById('engagementChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Scans',
                data: [145, 182, 165, 198, 210, 285, 256],
                borderColor: '#EB5E28',
                backgroundColor: 'rgba(235, 94, 40, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#EB5E28'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,252,242,0.05)' }, ticks: { color: 'rgba(255,252,242,0.6)' } },
                y: { grid: { color: 'rgba(255,252,242,0.05)' }, ticks: { color: 'rgba(255,252,242,0.6)' } }
            }
        }
    });
}

function initPointsChart() {
    const ctx = document.getElementById('pointsChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Earned',
                    data: [12500, 14200, 11800, 15600],
                    backgroundColor: '#EB5E28',
                    borderRadius: 6
                },
                {
                    label: 'Redeemed',
                    data: [4200, 5100, 3800, 6200],
                    backgroundColor: '#CCC5B9',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,252,242,0.6)' } },
                y: { grid: { color: 'rgba(255,252,242,0.05)' }, ticks: { color: 'rgba(255,252,242,0.6)' } }
            }
        }
    });
}

function initTierChart() {
    const ctx = document.getElementById('tierChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bronze', 'Silver', 'Gold', 'Platinum'],
            datasets: [{
                data: [1200, 890, 520, 237],
                backgroundColor: ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2'],
                borderWidth: 0,
                spacing: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255,252,242,0.7)', padding: 16, usePointStyle: true }
                }
            }
        }
    });
}

function initAcquisitionChart() {
    const ctx = document.getElementById('acquisitionChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'New Members',
                data: [120, 145, 168, 190, 178, 215, 245, 278, 298, 325, 356, 380],
                borderColor: '#EB5E28',
                backgroundColor: 'rgba(235, 94, 40, 0.15)',
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
                x: { grid: { color: 'rgba(255,252,242,0.05)' }, ticks: { color: 'rgba(255,252,242,0.6)' } },
                y: { grid: { color: 'rgba(255,252,242,0.05)' }, ticks: { color: 'rgba(255,252,242,0.6)' } }
            }
        }
    });
}

// Pass Designer
function initPassDesigner() {
    const bgColor = document.getElementById('passBgColor');
    const accentColor = document.getElementById('passAccentColor');
    const textColor = document.getElementById('passTextColor');
    const walletPass = document.getElementById('walletPass');

    const updateColors = () => {
        if (!walletPass) return;
        walletPass.style.background = bgColor?.value || '#252422';
        walletPass.style.setProperty('--accent', accentColor?.value || '#EB5E28');

        document.querySelectorAll('.color-hex').forEach((hex, i) => {
            const inputs = [bgColor, accentColor, textColor];
            if (inputs[i]) hex.textContent = inputs[i].value.toUpperCase();
        });
    };

    [bgColor, accentColor, textColor].forEach(input => {
        input?.addEventListener('input', updateColors);
    });
}

// Barista App
function initBaristaApp() {
    const simulateBtn = document.getElementById('simulateScan');
    const manualBtn = document.getElementById('manualLookup');
    const noCustomer = document.getElementById('noCustomerState');
    const customerFound = document.getElementById('customerFoundState');
    const addPointsBtn = document.getElementById('addPointsBtn');
    const redeemBtn = document.getElementById('redeemBtn');

    simulateBtn?.addEventListener('click', () => {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        showCustomer(customer);
        showToast('success', 'Pass Scanned', `Customer ${customer.name} identified`);
    });

    manualBtn?.addEventListener('click', () => {
        openModal('Search Customer', `
            <div class="form-group">
                <label>Phone or Email</label>
                <input type="text" class="form-input" placeholder="Enter phone or email">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="closeModal()">Search</button>
            </div>
        `);
    });

    function showCustomer(customer) {
        if (!noCustomer || !customerFound) return;
        noCustomer.classList.add('hidden');
        customerFound.classList.remove('hidden');

        const initials = customer.name.split(' ').map(n => n[0]).join('');
        document.getElementById('baristaAvatar').textContent = initials;
        document.getElementById('baristaCustomerName').textContent = customer.name;
        document.getElementById('baristaCustomerTier').textContent = customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1) + ' Member';
        document.getElementById('baristaCustomerTier').className = `tier-badge ${customer.tier}`;
        document.getElementById('baristaPoints').textContent = customer.points.toLocaleString();

        const tierThresholds = { bronze: 500, silver: 1500, gold: 3000, platinum: 5000 };
        const nextTier = tierThresholds[customer.tier] || 5000;
        document.getElementById('baristaNextTier').textContent = Math.max(0, nextTier - customer.points).toLocaleString();
        
        // Update stamp card
        if (typeof updateStampCard === 'function') {
            updateStampCard(customer);
        }
    }

    addPointsBtn?.addEventListener('click', () => {
        openModal('Add Points', `
            <div class="form-group">
                <label>Purchase Amount ($)</label>
                <input type="number" class="form-input" id="purchaseAmount" placeholder="0.00">
                <span style="font-size: 12px; color: rgba(255,252,242,0.5); margin-top: 6px; display: block;">1 point per $1 spent</span>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="addPoints()">Add Points</button>
            </div>
        `);
    });

    redeemBtn?.addEventListener('click', () => {
        openModal('Redeem Reward', `
            <div class="rewards-list" style="margin-bottom: 20px;">
                <div class="reward-item" onclick="redeemReward('Free Drip Coffee', 150)">
                    <div class="reward-icon">☕</div>
                    <div class="reward-info"><span class="reward-name">Free Drip Coffee</span><span class="reward-points">150 points</span></div>
                </div>
                <div class="reward-item" onclick="redeemReward('Free Pastry', 250)">
                    <div class="reward-icon">🥐</div>
                    <div class="reward-info"><span class="reward-name">Free Pastry</span><span class="reward-points">250 points</span></div>
                </div>
                <div class="reward-item" onclick="redeemReward('Free Specialty Latte', 400)">
                    <div class="reward-icon">🍵</div>
                    <div class="reward-info"><span class="reward-name">Free Specialty Latte</span><span class="reward-points">400 points</span></div>
                </div>
            </div>
        `);
    });
}

window.addPoints = function () {
    const amount = document.getElementById('purchaseAmount')?.value || 0;
    closeModal();
    showToast('success', 'Points Added', `${amount} points added to customer account`);
};

window.redeemReward = function (reward, points) {
    closeModal();
    showToast('success', 'Reward Redeemed', `${reward} (-${points} points)`);
};

// Customers Table
function initCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');
    if (!tbody) return;

    customers.forEach(c => {
        const initials = c.name.split(' ').map(n => n[0]).join('');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="checkbox"></td>
            <td>
                <div class="customer-cell">
                    <div class="customer-avatar">${initials}</div>
                    <div>
                        <div class="customer-name">${c.name}</div>
                        <div class="customer-email">${c.email}</div>
                    </div>
                </div>
            </td>
            <td>${c.phone}</td>
            <td><span class="tier-badge ${c.tier}">${c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}</span></td>
            <td><strong>${c.points.toLocaleString()}</strong></td>
            <td>${c.visits}</td>
            <td>${c.lastVisit}</td>
            <td><span class="geofence-status ${c.status}">${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
            <td>
                <button class="btn-icon"><span class="material-icons-round">visibility</span></button>
                <button class="btn-icon"><span class="material-icons-round">edit</span></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Search
    const search = document.getElementById('customerSearch');
    search?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#customersTable tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// Notifications
function initNotifications() {
    const message = document.getElementById('notifMessage');
    const counter = document.querySelector('.char-count');

    message?.addEventListener('input', () => {
        const len = message.value.length;
        counter.textContent = `${len}/160 characters`;
        counter.style.color = len > 160 ? '#ef4444' : 'rgba(255,252,242,0.5)';
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
// STAMP CARD SYSTEM
// ====================

// Add stamps to customer data
customers.forEach(c => {
    c.stamps = Math.floor(Math.random() * 6); // 0-5 stamps
    c.rewards = c.stamps >= 6 ? 1 : 0;
    // Reset to random for demo
    c.stamps = c.stamps % 6;
});

// Initialize Stamp Card
function initStampCard() {
    const addStampBtn = document.getElementById('addStampBtn');
    
    addStampBtn?.addEventListener('click', () => {
        addStamp();
    });
}

// Update stamp card display
function updateStampCard(customer) {
    const stampGrid = document.getElementById('stampGrid');
    const stampCountDisplay = document.getElementById('stampCountDisplay');
    const stampProgress = document.querySelector('.stamp-progress');
    const rewardsWallet = document.getElementById('rewardsWallet');
    const earnedRewardsList = document.getElementById('earnedRewardsList');
    const rewardCountBadge = document.getElementById('rewardCountBadge');
    
    if (!stampGrid) return;
    
    // Store current customer for stamp operations
    window.currentCustomer = customer;
    
    // Update stamp grid
    const stamps = customer.stamps || 0;
    stampGrid.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const stamp = document.createElement('div');
        stamp.className = `stamp ${i < stamps ? 'filled' : 'empty'}`;
        stampGrid.appendChild(stamp);
    }
    
    // Update count display
    if (stampCountDisplay) {
        stampCountDisplay.textContent = `${stamps}/6 stamps`;
    }
    
    // Update progress text
    if (stampProgress) {
        const remaining = 6 - stamps;
        if (remaining > 0) {
            stampProgress.textContent = `${remaining} more stamp${remaining > 1 ? 's' : ''} for a FREE drink!`;
        } else {
            stampProgress.textContent = 'Reward ready to claim!';
        }
    }
    
    // Update rewards wallet
    const rewards = customer.rewards || 0;
    if (rewards > 0 && rewardsWallet) {
        rewardsWallet.style.display = 'block';
        rewardCountBadge.textContent = rewards;
        
        earnedRewardsList.innerHTML = '';
        for (let i = 0; i < rewards; i++) {
            const rewardEl = document.createElement('div');
            rewardEl.className = 'earned-reward';
            rewardEl.innerHTML = `
                <div class="earned-reward-info">
                    <span class="earned-reward-icon">🎉</span>
                    <div class="earned-reward-details">
                        <span class="earned-reward-name">Free Drink</span>
                        <span class="earned-reward-date">Earned: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="use-reward-btn" onclick="useReward(${i})">Use</button>
            `;
            earnedRewardsList.appendChild(rewardEl);
        }
    } else if (rewardsWallet) {
        rewardsWallet.style.display = 'none';
    }
}

// Add a stamp
function addStamp() {
    const customer = window.currentCustomer;
    if (!customer) {
        showToast('error', 'Error', 'No customer selected');
        return;
    }
    
    customer.stamps = (customer.stamps || 0) + 1;
    
    // Check if earned a reward (6 stamps = 1 free drink)
    if (customer.stamps >= 6) {
        customer.stamps = 0;
        customer.rewards = (customer.rewards || 0) + 1;
        showToast('success', '🎉 Reward Earned!', 'Customer earned a FREE drink!');
    } else {
        showToast('success', 'Stamp Added', `${customer.stamps}/6 stamps collected`);
    }
    
    updateStampCard(customer);
}

// Use a reward
window.useReward = function(index) {
    const customer = window.currentCustomer;
    if (!customer || !customer.rewards || customer.rewards <= 0) return;
    
    customer.rewards--;
    showToast('success', 'Reward Used', 'Free drink applied!');
    updateStampCard(customer);
};

// Hook into existing showCustomer function
const originalShowCustomer = window.showCustomerOriginal || null;

// Patch the initBaristaApp to include stamp card
const originalInitBaristaApp = initBaristaApp;
initBaristaApp = function() {
    originalInitBaristaApp();
    initStampCard();
    
    // Patch simulate scan to also update stamp card
    const simulateBtn = document.getElementById('simulateScan');
    const originalClick = simulateBtn?.onclick;
    
    simulateBtn?.addEventListener('click', () => {
        setTimeout(() => {
            if (window.currentCustomer) {
                updateStampCard(window.currentCustomer);
            }
        }, 100);
    });
};
