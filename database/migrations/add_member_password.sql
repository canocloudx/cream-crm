-- Migration: Add password hash to members table
-- Description: Enables member authentication for login feature

-- Add password_hash column (nullable for existing members)
ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add last_login timestamp to track member activity
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Index for faster login lookups by email
CREATE INDEX IF NOT EXISTS idx_members_email_login ON members(email) WHERE password_hash IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN members.password_hash IS 'BCrypt hashed password for member authentication';
COMMENT ON COLUMN members.last_login IS 'Timestamp of last successful login';
