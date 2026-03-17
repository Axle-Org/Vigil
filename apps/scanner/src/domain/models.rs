use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageType {
    Instance,
    Persistent,
    Temporary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateEntry {
    pub id: Uuid,
    pub contract_id: Uuid,
    pub storage_key: String,
    pub storage_type: StorageType,
    pub last_val_xdr: Option<String>,
    pub last_scanned_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TTLSnapshot {
    pub time: DateTime<Utc>,
    pub entry_id: Uuid,
    pub ttl_ledgers: i32,
    pub estimated_runway_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: Uuid,
    pub contract_id: Uuid,
    pub entry_id: Option<Uuid>,
    pub severity: AlertSeverity,
    pub message: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}
