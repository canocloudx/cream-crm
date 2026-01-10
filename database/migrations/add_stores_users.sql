-- ============================================
-- MIGRATION: Add Stores and Staff Users Tables
-- Created: 2026-01-10
-- ============================================

-- Stores table for managing coffee shop locations
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    manager VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff users table for managing baristas and owners
CREATE TABLE IF NOT EXISTS staff_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'barista',
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_store ON staff_users(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- Insert default store (if not exists)
INSERT INTO stores (name, address, manager, phone)
SELECT 'C.R.E.A.M. Paspatur', 'Cumhuriyet Mah 38. Sokak No:4', 'Ece Diler Türedi', '05336892009'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'C.R.E.A.M. Paspatur');

-- Insert default admin user (if not exists)
INSERT INTO staff_users (name, surname, email, role)
SELECT 'Admin', 'Manager', 'admin@creamcoffee.com', 'owner'
WHERE NOT EXISTS (SELECT 1 FROM staff_users WHERE email = 'admin@creamcoffee.com');

-- Comments
COMMENT ON TABLE stores IS 'Coffee shop locations';
COMMENT ON TABLE staff_users IS 'Staff accounts (owners, baristas)';
