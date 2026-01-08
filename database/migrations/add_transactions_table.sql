-- Create transactions table for logging all member activity
-- Run this migration: psql -d cream_crm -f database/migrations/add_transactions_table.sql

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_data JSONB DEFAULT '{}',
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    shop VARCHAR(100) DEFAULT 'C.R.E.A.M. Paspatur',
    user_name VARCHAR(100) DEFAULT 'Admin',
    panel VARCHAR(50) DEFAULT 'crm',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Grant permissions
GRANT ALL ON TABLE transactions TO cream_admin;
GRANT SELECT, USAGE ON SEQUENCE transactions_id_seq TO cream_admin;
