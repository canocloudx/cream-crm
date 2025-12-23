#!/bin/bash
# ============================================
# PostgreSQL Backup Script
# C.R.E.A.M. CRM Database
# ============================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/cream-crm/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-daily}"  # Can pass custom name like "pre-migration"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $1"; }
log_error() { echo -e "${RED}[$(date +%H:%M:%S)]${NC} $1"; }

# ============================================
# Setup
# ============================================
log_info "🗄️ Starting database backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Determine backup filename
BACKUP_FILE="${BACKUP_DIR}/cream_crm_${BACKUP_NAME}_${TIMESTAMP}.sql.gz"

# ============================================
# Perform Backup
# ============================================

# Check if running in Docker
if [[ -n "${PGHOST:-}" ]]; then
    # Running in Docker with environment variables
    log_info "Using Docker environment configuration"
    PGPASSWORD="${PGPASSWORD:-$POSTGRES_PASSWORD}" pg_dump \
        -h "${PGHOST}" \
        -U "${PGUSER:-cream_admin}" \
        -d "${PGDATABASE:-cream_crm}" \
        --no-owner \
        --no-acl \
        --format=plain \
        | gzip > "$BACKUP_FILE"
elif [[ -n "${DATABASE_URL:-}" ]]; then
    # Using DATABASE_URL
    log_info "Using DATABASE_URL configuration"
    pg_dump "$DATABASE_URL" \
        --no-owner \
        --no-acl \
        --format=plain \
        | gzip > "$BACKUP_FILE"
else
    log_error "No database configuration found!"
    log_error "Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD"
    exit 1
fi

# Verify backup
if [[ ! -f "$BACKUP_FILE" ]] || [[ ! -s "$BACKUP_FILE" ]]; then
    log_error "Backup file is empty or missing!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_info "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ============================================
# Upload to Cloud Storage (Optional)
# ============================================

# AWS S3
if command -v aws &> /dev/null && [[ -n "${AWS_S3_BUCKET:-}" ]]; then
    log_info "Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/backups/$(basename "$BACKUP_FILE")"
    log_info "✅ Uploaded to S3: s3://${AWS_S3_BUCKET}/backups/"
fi

# Backblaze B2
if command -v b2 &> /dev/null && [[ -n "${B2_BUCKET:-}" ]]; then
    log_info "Uploading to Backblaze B2..."
    b2 upload-file "${B2_BUCKET}" "$BACKUP_FILE" "backups/$(basename "$BACKUP_FILE")"
    log_info "✅ Uploaded to B2: ${B2_BUCKET}/backups/"
fi

# ============================================
# Cleanup Old Backups
# ============================================
log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

DELETED_COUNT=$(find "$BACKUP_DIR" -name "cream_crm_*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)

if [[ $DELETED_COUNT -gt 0 ]]; then
    log_info "Deleted $DELETED_COUNT old backup(s)"
fi

# ============================================
# Report
# ============================================
echo ""
echo "============================================"
echo "📊 BACKUP SUMMARY"
echo "============================================"
echo "Backup file: $(basename "$BACKUP_FILE")"
echo "Size: $BACKUP_SIZE"
echo "Location: $BACKUP_DIR"
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"
echo ""
echo "Total backup storage used:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "  Unable to determine"
echo "============================================"

log_info "🎉 Backup complete!"
