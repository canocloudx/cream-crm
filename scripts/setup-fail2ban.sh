#!/bin/bash
# ============================================
# Fail2ban Setup Script
# C.R.E.A.M. CRM Host Security Layer
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

log_info "🛡️ Installing and configuring Fail2ban..."

# ============================================
# Step 1: Install Fail2ban
# ============================================
apt-get update
apt-get install -y fail2ban

# Stop fail2ban before configuring
systemctl stop fail2ban || true

# ============================================
# Step 2: Create main jail configuration
# ============================================
log_info "Creating jail configuration..."

cat > /etc/fail2ban/jail.d/cream-crm.conf << 'EOF'
# ============================================
# C.R.E.A.M. CRM Fail2ban Configuration
# ============================================

[DEFAULT]
# Default ban settings
bantime = 1h
findtime = 10m
maxretry = 5

# Use UFW for banning
banaction = ufw

# Email notifications (optional - configure sendmail first)
# destemail = admin@creamcoff.com
# sender = fail2ban@creamcoff.com
# mta = sendmail
# action = %(action_mwl)s

# ============================================
# SSH Protection (backup - Tailscale is primary)
# ============================================
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
findtime = 1h

# Also protect against SSH probing
[sshd-ddos]
enabled = true
filter = sshd-ddos
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 48h

# ============================================
# Nginx Protection
# ============================================
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 1h

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 1m
bantime = 1h

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 1d

# ============================================
# C.R.E.A.M. API Protection
# ============================================
[cream-api-abuse]
enabled = true
filter = cream-api
logpath = /opt/cream-crm/logs/access.log
maxretry = 100
findtime = 1m
bantime = 30m

[cream-api-auth-fail]
enabled = true
filter = cream-api-auth
logpath = /opt/cream-crm/logs/access.log
maxretry = 10
findtime = 5m
bantime = 1h

# ============================================
# General Web Protection
# ============================================
[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 1
bantime = 1d
EOF

# ============================================
# Step 3: Create custom filters
# ============================================
log_info "Creating custom filters..."

# API abuse filter (too many requests)
cat > /etc/fail2ban/filter.d/cream-api.conf << 'EOF'
# C.R.E.A.M. API Abuse Filter
# Matches excessive requests and error responses

[Definition]
failregex = ^<HOST> - .* "(GET|POST|PUT|DELETE|PATCH) /api/.*" (429|5\d{2})
            ^<HOST> - .* "(GET|POST|PUT|DELETE|PATCH) /api/.*" 200 .* "\d+\.\d+ ms"

ignoreregex = 

# Notes:
# - Matches 429 (rate limit) and 5xx errors
# - These indicate potential abuse or attack
EOF

# API auth failure filter
cat > /etc/fail2ban/filter.d/cream-api-auth.conf << 'EOF'
# C.R.E.A.M. API Authentication Failure Filter
# Matches failed login/auth attempts

[Definition]
failregex = ^<HOST> - .* "(GET|POST) /api/(login|auth|members/\S+).*" (401|403)
            ^<HOST> - .* "Authorization failed" 

ignoreregex = ^<HOST> - .* "401" .*favicon

# Notes:
# - Matches 401 (unauthorized) and 403 (forbidden)
# - Ignores favicon requests that sometimes return 401
EOF

# Nginx bad bots filter (enhanced)
cat > /etc/fail2ban/filter.d/nginx-badbots.conf << 'EOF'
# Enhanced Bad Bots Filter

[Definition]
failregex = ^<HOST> - .* "(GET|POST|HEAD).*HTTP.*" .* "(.*(?:360Spider|80legs|AhrefsBot|Baiduspider|DotBot|Googlebot-Image|MJ12bot|SemrushBot|YandexBot|zgrab|masscan|nuclei|nikto).*)"

ignoreregex = 
EOF

# ============================================
# Step 4: Create log directory
# ============================================
log_info "Setting up log directory..."

mkdir -p /opt/cream-crm/logs
touch /opt/cream-crm/logs/access.log
chown -R nodejs:nodejs /opt/cream-crm/logs 2>/dev/null || true

# ============================================
# Step 5: Enable and start Fail2ban
# ============================================
log_info "Starting Fail2ban..."

systemctl enable fail2ban
systemctl start fail2ban

# Wait for startup
sleep 3

# ============================================
# Step 6: Verify configuration
# ============================================
log_info "Verifying configuration..."

echo ""
echo "============================================"
echo "🛡️ FAIL2BAN STATUS"
echo "============================================"
fail2ban-client status

echo ""
echo "============================================"
echo "📋 ACTIVE JAILS"
echo "============================================"
fail2ban-client status | grep "Jail list" | sed 's/.*Jail list://' | tr ',' '\n' | while read jail; do
    jail=$(echo "$jail" | tr -d ' \t')
    if [[ -n "$jail" ]]; then
        echo ""
        echo "--- $jail ---"
        fail2ban-client status "$jail" 2>/dev/null || echo "  (pending activation)"
    fi
done

echo ""
cat << 'EOF'
============================================
✅ FAIL2BAN SETUP COMPLETE!
============================================

USEFUL COMMANDS:

# Check status of all jails
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd

# Manually ban an IP
sudo fail2ban-client set sshd banip 1.2.3.4

# Manually unban an IP
sudo fail2ban-client set sshd unbanip 1.2.3.4

# View fail2ban logs
sudo tail -f /var/log/fail2ban.log

# Test a filter against a log file
sudo fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf

============================================
EOF

log_info "🎉 Fail2ban setup complete!"
