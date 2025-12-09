// C.R.E.A.M. COFFEE - Customer Registration

document.addEventListener('DOMContentLoaded', () => {
    initRegistration();
});

// State
let currentStep = 1;
let customerData = {
    name: '',
    email: '',
    gender: '',
    birthday: '',
    memberId: ''
};

function initRegistration() {
    initForm();
    initNavigation();
    generateMemberId();
}

// Generate unique member ID
function generateMemberId() {
    const id = Math.floor(100000 + Math.random() * 900000);
    customerData.memberId = `CREAM-${id}`;
}

// Form Handling
function initForm() {
    const form = document.getElementById('registrationForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const birthdayInput = document.getElementById('birthday');

    // Set max date for birthday (must be 13+ years old)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    birthdayInput.max = maxDate.toISOString().split('T')[0];

    // Real-time validation
    nameInput.addEventListener('input', () => validateName(nameInput));
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    birthdayInput.addEventListener('change', () => validateBirthday(birthdayInput));

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const isNameValid = validateName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isBirthdayValid = validateBirthday(birthdayInput);

        if (isNameValid && isEmailValid && isBirthdayValid) {
            // Save data
            customerData.name = nameInput.value.trim();
            customerData.email = emailInput.value.trim();
            customerData.gender = document.getElementById('gender').value;
            customerData.birthday = birthdayInput.value;

            // Update card preview
            updateCardPreview();

            // Go to step 2
            goToStep(2);
        }
    });
}

function validateName(input) {
    const value = input.value.trim();
    const errorEl = document.getElementById('nameError');

    if (value.length < 2) {
        input.classList.add('error');
        errorEl.textContent = value.length === 0 ? 'Name is required' : 'Name must be at least 2 characters';
        return false;
    }

    input.classList.remove('error');
    errorEl.textContent = '';
    return true;
}

function validateEmail(input) {
    const value = input.value.trim();
    const errorEl = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
        input.classList.add('error');
        errorEl.textContent = value.length === 0 ? 'Email is required' : 'Please enter a valid email';
        return false;
    }

    input.classList.remove('error');
    errorEl.textContent = '';
    return true;
}

function validateBirthday(input) {
    const value = input.value;
    const errorEl = document.getElementById('birthdayError');

    if (!value) {
        input.classList.add('error');
        errorEl.textContent = 'Birthday is required';
        return false;
    }

    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13) {
        input.classList.add('error');
        errorEl.textContent = 'You must be at least 13 years old';
        return false;
    }

    input.classList.remove('error');
    errorEl.textContent = '';
    return true;
}

// Card Preview Update
function updateCardPreview() {
    document.getElementById('cardName').textContent = customerData.name;
    document.getElementById('memberId').textContent = customerData.memberId;
    document.getElementById('miniCardName').textContent = customerData.name;
}

// Navigation
function initNavigation() {
    const toWalletBtn = document.getElementById('toWalletBtn');
    const addToAppleWalletBtn = document.getElementById('addToAppleWalletBtn');
    const addToGoogleWalletBtn = document.getElementById('addToGoogleWalletBtn');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const closeBtn = document.getElementById('closeBtn');

    toWalletBtn?.addEventListener('click', () => goToStep(3));

    addToAppleWalletBtn?.addEventListener('click', () => {
        addToAppleWallet(addToAppleWalletBtn);
    });

    addToGoogleWalletBtn?.addEventListener('click', () => {
        addToGoogleWallet(addToGoogleWalletBtn);
    });

    screenshotBtn?.addEventListener('click', () => {
        showSuccessScreen();
    });

    closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        // Could redirect to store website or close
        window.location.href = 'index.html';
    });
}

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));

    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = step;
    }

    // Update progress bar
    updateProgress(step);
}

function updateProgress(step) {
    const progressFill = document.getElementById('progressFill');
    const stepIndicator = document.getElementById('stepIndicator');

    const percentage = (step / 3) * 100;
    progressFill.style.width = `${percentage}%`;

    stepIndicator.textContent = `Step ${step} of 3`;
}

// Apple Wallet Integration (Simulated)
function addToAppleWallet(btn) {
    // Show loading state
    btn.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Adding to Wallet...</span>
    `;
    btn.disabled = true;
    btn.style.opacity = '0.7';

    // Simulate API call
    setTimeout(() => {
        // In production, this would:
        // 1. Send customer data to server
        // 2. Generate and sign a .pkpass file
        // 3. Return the pass for download

        // For demo, we show success screen
        showSuccessScreen('apple');
    }, 2000);
}

// Google Wallet Integration (Simulated)
function addToGoogleWallet(btn) {
    // Show loading state
    btn.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Adding to Google Wallet...</span>
    `;
    btn.disabled = true;
    btn.style.opacity = '0.7';

    // Simulate API call
    setTimeout(() => {
        // In production, this would:
        // 1. Send customer data to server
        // 2. Create a Google Wallet loyalty object using Google Wallet API
        // 3. Generate a "Save to Google Wallet" JWT token
        // 4. Open Google Wallet save flow

        // For demo, we show success screen
        showSuccessScreen('google');
    }, 2000);
}

function showSuccessScreen(walletType = 'apple') {
    // Hide all steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));

    // Show success
    const successStep = document.getElementById('stepSuccess');
    successStep.classList.add('active');

    // Update progress to complete
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('stepIndicator').textContent = 'Complete!';

    // Trigger confetti effect
    createConfetti();
}

// Confetti Animation
function createConfetti() {
    const container = document.querySelector('.success-animation');
    const colors = ['#EB5E28', '#FFFCF2', '#22c55e', '#ffd700'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: 50%;
            top: 50%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            transform: translate(-50%, -50%);
            opacity: 0;
            animation: confettiFall ${1 + Math.random() * 2}s ${Math.random() * 0.5}s ease-out forwards;
        `;
        container.appendChild(confetti);
    }

    // Add confetti animation styles
    if (!document.getElementById('confettiStyles')) {
        const style = document.createElement('style');
        style.id = 'confettiStyles';
        style.textContent = `
            @keyframes confettiFall {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(
                        calc(-50% + ${Math.random() * 200 - 100}px),
                        calc(-50% + ${Math.random() * 300 + 100}px)
                    ) rotate(${Math.random() * 720}deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Utility: Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

// Generate QR Code for Barcode (if needed)
function generateBarcodeQR() {
    const barcodeContainer = document.getElementById('cardBarcode');
    if (barcodeContainer && typeof QRCode !== 'undefined') {
        // Clear existing
        barcodeContainer.innerHTML = '';

        new QRCode(barcodeContainer, {
            text: customerData.memberId,
            width: 80,
            height: 80,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }
}
