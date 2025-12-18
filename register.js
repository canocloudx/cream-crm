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

    // Form submission - SAVES TO HETZNER DATABASE
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isNameValid = validateName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isBirthdayValid = validateBirthday(birthdayInput);

        if (isNameValid && isEmailValid && isBirthdayValid) {
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-text">Registering...</span>';
            submitBtn.disabled = true;

            try {
                // Send to API (saves to Hetzner PostgreSQL)
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value.trim(),
                        email: emailInput.value.trim(),
                        gender: document.getElementById('gender').value,
                        birthday: birthdayInput.value
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Save data locally for display
                    customerData.name = result.member.name;
                    customerData.email = result.member.email;
                    customerData.gender = result.member.gender;
                    customerData.birthday = result.member.birthday;
                    customerData.memberId = result.member.member_id;

                    // Update card preview
                    updateCardPreview();

                    // Go to step 2
                    goToStep(2);
                } else {
                    alert(result.error || 'Registration failed. Please try again.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Could not connect to server. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
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
        window.location.href = 'index.html';
    });
}

function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = step;
    }
    updateProgress(step);
}

function updateProgress(step) {
    const progressFill = document.getElementById('progressFill');
    const stepIndicator = document.getElementById('stepIndicator');
    const percentage = (step / 3) * 100;
    progressFill.style.width = `${percentage}%`;
    stepIndicator.textContent = `Step ${step} of 3`;
}

// Apple Wallet Integration
function addToAppleWallet(btn) {
    btn.innerHTML = '<div class="loading-spinner"></div><span>Adding to Wallet...</span>';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    setTimeout(() => {
        showSuccessScreen('apple');
    }, 2000);
}

// Google Wallet Integration
function addToGoogleWallet(btn) {
    btn.innerHTML = '<div class="loading-spinner"></div><span>Adding to Google Wallet...</span>';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    setTimeout(() => {
        showSuccessScreen('google');
    }, 2000);
}

function showSuccessScreen(walletType = 'apple') {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const successStep = document.getElementById('stepSuccess');
    successStep.classList.add('active');
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('stepIndicator').textContent = 'Complete!';
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
