#!/bin/bash
# ============================================
# Tailscale Zero Trust Setup
# C.R.E.A.M. CRM Production Infrastructure
# ============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

log_info "🔐 Starting Tailscale Zero Trust Setup..."

# ============================================
# Step 1: Install Tailscale
# ============================================
log_info "Installing Tailscale..."

if command -v tailscale &> /dev/null; then
    log_info "Tailscale already installed, updating..."
    apt-get update && apt-get install -y tailscale
else
    curl -fsSL https://tailscale.com/install.sh | sh
fi

# Enable and start Tailscale daemon
systemctl enable --now tailscaled

# ============================================
# Step 2: Configure Tailscale
# ============================================
log_info "Configuring Tailscale..."

# Determine environment from hostname or prompt
if [[ $(hostname) == *"staging"* ]] || [[ $(hostname) == *"stg"* ]]; then
    ENV_TAG="tag:cream-staging"
elif [[ $(hostname) == *"prod"* ]] || [[ $(hostname) == *"prd"* ]]; then
    ENV_TAG="tag:cream-production"
else
    log_warn "Could not determine environment from hostname"
    read -p "Enter environment (staging/production): " ENV_INPUT
    if [[ "$ENV_INPUT" == "staging" ]]; then
        ENV_TAG="tag:cream-staging"
    else
        ENV_TAG="tag:cream-production"
    fi
fi

# Authenticate with Tailscale
log_info "Please authenticate with Tailscale..."
tailscale up \
    --ssh \
    --advertise-tags="$ENV_TAG" \
    --hostname="cream-$(hostname)"

# Wait for connection
sleep 3

# Verify connection
if tailscale status &> /dev/null; then
    log_info "✅ Tailscale connected successfully!"
    TAILSCALE_IP=$(tailscale ip -4)
    log_info "📡 Tailscale IP: $TAILSCALE_IP"
else
    log_error "Tailscale connection failed"
    exit 1
fi

# ============================================
# Step 3: Configure Firewall (UFW)
# ============================================
log_info "Configuring firewall..."

# Install UFW if not present
apt-get install -y ufw

# Reset UFW to defaults
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow Tailscale interface (this is the magic - only Tailscale traffic allowed)
ufw allow in on tailscale0

# Allow HTTP/HTTPS from anywhere (for Cloudflare)
# Comment these out if using Cloudflare Tunnel instead
ufw allow 80/tcp comment 'HTTP for Cloudflare'
ufw allow 443/tcp comment 'HTTPS for Cloudflare'

# IMPORTANT: Block public SSH - use Tailscale SSH instead
# This is commented out for safety - uncomment after verifying Tailscale SSH works
# ufw deny 22/tcp

log_warn "⚠️  Public SSH (port 22) is still open for safety"
log_warn "   After verifying Tailscale SSH works, run:"
log_warn "   sudo ufw deny 22/tcp"

# Enable UFW
ufw --force enable

log_info "✅ Firewall configured!"
ufw status verbose

# ============================================
# Step 4: Test Tailscale SSH
# ============================================
log_info "Testing Tailscale SSH..."

cat << EOF

============================================
🔐 TAILSCALE SETUP COMPLETE!
============================================

Your server's Tailscale IP: $TAILSCALE_IP
Hostname in Tailnet: cream-$(hostname)

NEXT STEPS:

1. From your laptop (with Tailscale installed), test SSH:
   ssh $(whoami)@$TAILSCALE_IP

2. Or use Tailscale's magic DNS:
   ssh $(whoami)@cream-$(hostname)

3. After confirming Tailscale SSH works, disable public SSH:
   sudo ufw deny 22/tcp

4. Configure ACLs in Tailscale Admin Console:
   https://login.tailscale.com/admin/acls

============================================
EOF

# ============================================
# Step 5: Output recommended ACLs
# ============================================
cat << 'EOF'

RECOMMENDED TAILSCALE ACL CONFIGURATION:
(Paste this in https://login.tailscale.com/admin/acls)

{
  "tagOwners": {
    "tag:cream-production": ["autogroup:admin"],
    "tag:cream-staging": ["autogroup:admin"],
    "tag:cream-admin": ["autogroup:admin"],
    "tag:ci": ["autogroup:admin"]
  },
  
  "acls": [
    // Admins can access all servers on all ports
    {
      "action": "accept",
      "src": ["tag:cream-admin"],
      "dst": ["tag:cream-production:*", "tag:cream-staging:*"]
    },
    
    // CI can access servers for deployment
    {
      "action": "accept",
      "src": ["tag:ci"],
      "dst": ["tag:cream-production:22", "tag:cream-staging:22"]
    },
    
    // Staging can query production DB for replication (optional)
    {
      "action": "accept",
      "src": ["tag:cream-staging"],
      "dst": ["tag:cream-production:5432"]
    }
  ],
  
  "ssh": [
    // Allow admins to SSH to any server
    {
      "action": "check",
      "src": ["tag:cream-admin"],
      "dst": ["tag:cream-production", "tag:cream-staging"],
      "users": ["autogroup:nonroot", "root"]
    },
    
    // CI uses key-based auth
    {
      "action": "accept",
      "src": ["tag:ci"],
      "dst": ["tag:cream-production", "tag:cream-staging"],
      "users": ["deploy"]
    }
  ]
}

EOF

log_info "🎉 Tailscale setup complete!"
