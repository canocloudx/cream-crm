-- Add columns for latest message (for Wallet pass notifications)
-- Run this migration on your production database:
-- psql -d cream_crm -f database/migrations/add_message_columns.sql

ALTER TABLE members ADD COLUMN IF NOT EXISTS latest_message_title VARCHAR(200);
ALTER TABLE members ADD COLUMN IF NOT EXISTS latest_message_body TEXT;

-- Create pass_registrations table for Apple Wallet push notifications
CREATE TABLE IF NOT EXISTS pass_registrations (
    id SERIAL PRIMARY KEY,
    device_library_id VARCHAR(100) NOT NULL,
    push_token VARCHAR(255) NOT NULL,
    pass_type_id VARCHAR(100) NOT NULL,
    serial_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_library_id, pass_type_id, serial_number)
);
CREATE INDEX IF NOT EXISTS idx_pass_reg_serial ON pass_registrations(serial_number);
