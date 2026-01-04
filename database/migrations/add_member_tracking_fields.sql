-- Migration: Add member tracking fields
-- Run: psql -d cream_crm -f database/migrations/add_member_tracking_fields.sql

-- Add new tracking fields to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE members ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE members ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT true;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted_at);
CREATE INDEX IF NOT EXISTS idx_members_consent ON members(consent);
CREATE INDEX IF NOT EXISTS idx_members_language ON members(language);

-- Note: 'age' is computed from birthday, not stored
-- Note: 'member_since' uses existing created_at column
