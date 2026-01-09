#!/bin/bash
# ============================================
# C.R.E.A.M. CRM - Cloud Backup Script
# Backs up PostgreSQL database to Cloudflare R2
# ============================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cream_backup_${TIMESTAMP}.sql.gz"
R2_BUCKET="${R2_BUCKET:-cream-backups}"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_requirements() {
    local missing=0
    
    if [ -z "${PGHOST:-}" ]; then
        log_error "PGHOST is not set"
        missing=1
    fi
    
    if [ -z "${PGUSER:-}" ]; then
        log_error "PGUSER is not set"
        missing=1
    fi
    
    if [ -z "${PGDATABASE:-}" ]; then
        log_error "PGDATABASE is not set"
        missing=1
    fi
    
    if [ -z "${R2_ACCOUNT_ID:-}" ]; then
        log_error "R2_ACCOUNT_ID is not set"
        missing=1
    fi
    
    if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
        log_error "AWS_ACCESS_KEY_ID is not set"
        missing=1
    fi
    
    if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        log_error "AWS_SECRET_ACCESS_KEY is not set"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        log_error "Missing required environment variables. Exiting."
        exit 1
    fi
}

# Create database backup
create_backup() {
    log_info "📦 Creating database backup..."
    
    mkdir -p "${BACKUP_DIR}"
    
    # Use pg_dump to create backup
    if pg_dump -h "${PGHOST}" -U "${PGUSER}" "${PGDATABASE}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
        local size=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
        log_info "✅ Backup created: ${BACKUP_FILE} (${size})"
    else
        log_error "Failed to create backup"
        exit 1
    fi
}

# Upload backup to Cloudflare R2
upload_to_r2() {
    log_info "☁️ Uploading to Cloudflare R2..."
    
    if aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${R2_BUCKET}/${BACKUP_FILE}" \
        --endpoint-url "${R2_ENDPOINT}" \
        --no-progress; then
        log_info "✅ Uploaded to R2: s3://${R2_BUCKET}/${BACKUP_FILE}"
    else
        log_error "Failed to upload to R2"
        exit 1
    fi
}

# Clean up old local backups (keep last N)
cleanup_local() {
    local keep=${LOCAL_RETENTION:-7}
    log_info "�� Cleaning up local backups (keeping last ${keep})..."
    
    local count=$(ls -1 "${BACKUP_DIR}"/cream_backup_*.sql.gz 2>/dev/null | wc -l)
    
    if [ "$count" -gt "$keep" ]; then
        ls -t "${BACKUP_DIR}"/cream_backup_*.sql.gz | tail -n +$((keep + 1)) | xargs -r rm -v
        log_info "Removed $((count - keep)) old local backups"
    else
        log_info "No local backups to remove"
    fi
}

# Clean up old R2 backups (keep last N)
cleanup_r2() {
    local keep=${R2_RETENTION:-30}
    log_info "🧹 Cleaning up R2 backups (keeping last ${keep})..."
    
    # List and delete old backups
    aws s3 ls "s3://${R2_BUCKET}/" --endpoint-url "${R2_ENDPOINT}" 2>/dev/null \
        | grep "cream_backup_" \
        | sort -r \
        | tail -n +$((keep + 1)) \
        | awk '{print $4}' \
        | while read -r file; do
            if [ -n "$file" ]; then
                aws s3 rm "s3://${R2_BUCKET}/${file}" --endpoint-url "${R2_ENDPOINT}" \
                    && log_info "Removed old backup: ${file}"
            fi
        done
}

# Main execution
main() {
    echo "============================================"
    echo "C.R.E.A.M. CRM - Cloud Backup"
    echo "Started at: $(date)"
    echo "============================================"
    
    check_requirements
    create_backup
    upload_to_r2
    cleanup_local
    cleanup_r2
    
    echo "============================================"
    echo "✅ Backup complete: ${BACKUP_FILE}"
    echo "Finished at: $(date)"
    echo "============================================"
}

main "$@"
