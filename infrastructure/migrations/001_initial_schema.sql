-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL UNIQUE,
    network TEXT NOT NULL, -- mainnet, testnet, futurenet
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage entries table
CREATE TABLE state_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    storage_type TEXT NOT NULL, -- instance, persistent, temporary
    last_val_xdr TEXT,
    last_scanned_at TIMESTAMPTZ,
    UNIQUE(contract_id, storage_key)
);

-- TTL History table (Hypertable)
CREATE TABLE ttl_history (
    time TIMESTAMPTZ NOT NULL,
    entry_id UUID REFERENCES state_entries(id) ON DELETE CASCADE,
    ttl_ledgers INTEGER NOT NULL,
    estimated_runway_seconds BIGINT NOT NULL
);

-- Convert to hypertable
SELECT create_hypertable('ttl_history', 'time');

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES state_entries(id),
    severity TEXT NOT NULL, -- info, warning, critical
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, resolved, acknowledged
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Bump policies table
CREATE TABLE bump_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES state_entries(id), -- optional, can be per-contract
    target_ttl_ledgers INTEGER NOT NULL,
    trigger_threshold_ledgers INTEGER NOT NULL,
    priority_tier INTEGER NOT NULL DEFAULT 1,
    fee_budget_xlm DECIMAL(18, 7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
