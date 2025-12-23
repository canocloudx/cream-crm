#!/bin/bash
# ============================================
# Cloudflare Tunnel Setup
# Zero-exposed-ports configuration
# ============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Configuration
DOMAIN="${1:-creamcoff.com}"
TUNNEL_NAME="cream-crm-$(hostname)"

log_info "☁️ Setting up Cloudflare Tunnel for $DOMAIN..."

# ============================================
# Step 1: Install cloudflared
# ============================================
log_info "Installing cloudflared..."

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    armv7l) ARCH="arm" ;;
esac

# Download and install
curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}" -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version

# ============================================
# Step 2: Authenticate with Cloudflare
# ============================================
log_info "Authenticating with Cloudflare..."
log_warn "This will open a browser or provide a URL to authenticate"

cloudflared tunnel login

# ============================================
# Step 3: Create Tunnel
# ============================================
log_info "Creating tunnel: $TUNNEL_NAME..."

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    log_warn "Tunnel '$TUNNEL_NAME' already exists, using existing tunnel"
else
    cloudflared tunnel create "$TUNNEL_NAME"
fi

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
log_info "Tunnel ID: $TUNNEL_ID"

# ============================================
# Step 4: Configure Tunnel
# ============================================
log_info "Configuring tunnel..."

mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml << EOF
# Cloudflare Tunnel Configuration
# Generated: $(date)

tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

# Ingress rules - how traffic is routed
ingress:
  # Main domain - production app
  - hostname: $DOMAIN
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
  
  # www subdomain - redirect to main
  - hostname: www.$DOMAIN
    service: http://localhost:3000
  
  # API subdomain (optional)
  - hostname: api.$DOMAIN
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
  
  # Staging subdomain
  - hostname: staging.$DOMAIN
    service: http://localhost:3000
  
  # Catch-all - return 404
  - service: http_status:404

# Optional: Origin configuration
originRequest:
  connectTimeout: 30s
  noHappyEyeballs: false
EOF

log_info "Configuration saved to /etc/cloudflared/config.yml"

# ============================================
# Step 5: Route DNS
# ============================================
log_info "Setting up DNS routes..."

# Create DNS routes for each hostname
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN" || log_warn "DNS route for $DOMAIN may already exist"
cloudflared tunnel route dns "$TUNNEL_NAME" "www.$DOMAIN" || log_warn "DNS route for www.$DOMAIN may already exist"
cloudflared tunnel route dns "$TUNNEL_NAME" "staging.$DOMAIN" || log_warn "DNS route for staging.$DOMAIN may already exist"

# ============================================
# Step 6: Install as System Service
# ============================================
log_info "Installing as systemd service..."

cloudflared service install

# Enable and start
systemctl enable cloudflared
systemctl start cloudflared

# Wait for startup
sleep 5

# Check status
if systemctl is-active --quiet cloudflared; then
    log_info "✅ Cloudflare Tunnel is running!"
else
    log_error "Cloudflare Tunnel failed to start"
    journalctl -u cloudflared -n 20
    exit 1
fi

# ============================================
# Step 7: Close public ports (optional)
# ============================================
cat << EOF

============================================
☁️ CLOUDFLARE TUNNEL SETUP COMPLETE!
============================================

Tunnel Name: $TUNNEL_NAME
Tunnel ID: $TUNNEL_ID

Your server is now accessible via:
  - https://$DOMAIN
  - https://www.$DOMAIN
  - https://staging.$DOMAIN

NEXT STEPS:

1. Verify the tunnel is working:
   curl https://$DOMAIN/api/stats

2. Since Cloudflare Tunnel handles all traffic, you can
   close public HTTP/HTTPS ports for extra security:
   
   sudo ufw delete allow 80/tcp
   sudo ufw delete allow 443/tcp
   
   This makes your server completely invisible to port scans!

3. Configure additional Cloudflare settings:
   - Enable WAF in Cloudflare Dashboard
   - Set up rate limiting rules
   - Enable DDoS protection (automatic)

USEFUL COMMANDS:

# Check tunnel status
cloudflared tunnel info $TUNNEL_NAME

# View logs
journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

============================================
EOF

log_info "🎉 Setup complete!"
