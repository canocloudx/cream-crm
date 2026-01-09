#!/bin/bash
# ============================================
# C.R.E.A.M. CRM - Cloud Restore Script
# Restores PostgreSQL database from Cloudflare R2 backup
# ============================================

set -euo pipefail

# Configuration
R2_BUCKET="${R2_BUCKET:-cream-backups}"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
TEMP_DIR="/tmp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
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

# List available backups
list_backups() {
    echo -e "${CYAN}Available backups in R2:${NC}"
    aws s3 ls "s3://${R2_BUCKET}/" --endpoint-url "${R2_ENDPOINT}" 2>/dev/null \
        | grep "cream_backup_" \
        | sort -r \
        | head -20 \
        | awk '{print NR". " $4 " (" $3 " bytes, " $1 " " $2 ")"}'
}

# Download backup from R2
download_backup() {
    local backup_file="$1"
    local local_file="${TEMP_DIR}/${backup_file}"
    
    log_info "⬇️ Downloading backup: ${backup_file}..."
    
    if aws s3 cp "s3://${R2_BUCKET}/${backup_file}" "${local_file}" \
        --endpoint-url "${R2_ENDPOINT}" \
        --no-progress; then
        log_info "✅ Downloaded to: ${local_file}"
        echo "${local_file}"
    else
        log_error "Failed to download backup"
        exit 1
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    log_warn "⚠️  This will OVERWRITE the current database!"
    echo -n "Are you sure you want to continue? (yes/no): "
    read -r confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi
    
    log_info "🔄 Restoring database from: ${backup_file}..."
    
    # Drop and recreate database connections
    log_info "Terminating existing connections..."
    psql -h "${PGHOST}" -U "${PGUSER}" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PGDATABASE}' AND pid <> pg_backend_pid();" \
        2>/dev/null || true
    
    # Restore the database
    if gunzip -c "${backup_file}" | psql -h "${PGHOST}" -U "${PGUSER}" "${PGDATABASE}"; then
        log_info "✅ Database restored successfully!"
    else
        log_error "Failed to restore database"
        exit 1
    fi
    
    # Cleanup
    rm -f "${backup_file}"
    log_info "Cleaned up temporary file"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list              List available backups in R2"
    echo "  restore <file>    Restore from a specific backup file"
    echo "  latest            Restore from the most recent backup"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 restore cream_backup_20260109_120000.sql.gz"
    echo "  $0 latest"
}

# Main execution
main() {
    local command="${1:-}"
    
    case "$command" in
        list)
            list_backups
            ;;
        restore)
            local backup_file="${2:-}"
            if [ -z "$backup_file" ]; then
                log_error "Please specify a backup file"
                usage
                exit 1
            fi
            local local_file=$(download_backup "$backup_file")
            restore_database "$local_file"
            ;;
        latest)
            log_info "Finding latest backup..."
            local latest=$(aws s3 ls "s3://${R2_BUCKET}/" --endpoint-url "${R2_ENDPOINT}" 2>/dev/null \
                | grep "cream_backup_" \
                | sort -r \
                | head -1 \
                | awk '{print $4}')
            
            if [ -z "$latest" ]; then
                log_error "No backups found in R2"
                exit 1
            fi
            
            log_info "Latest backup: ${latest}"
            local local_file=$(download_backup "$latest")
            restore_database "$local_file"
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

main "$@"
