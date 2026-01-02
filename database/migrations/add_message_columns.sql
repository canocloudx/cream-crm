-- Add columns for latest message (for Wallet pass notifications)
-- Run this migration on your production database:
-- psql -d cream_crm -f database/migrations/add_message_columns.sql

ALTER TABLE members ADD COLUMN IF NOT EXISTS latest_message_title VARCHAR(200);
ALTER TABLE members ADD COLUMN IF NOT EXISTS latest_message_body TEXT;
