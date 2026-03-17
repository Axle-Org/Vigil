# Vigil Architecture

Vigil is designed for high-availability monitoring and proactive management of Soroban state TTLs.

## System Components

### 1. Scanner (Rust)
- **Role**: Real-time monitoring and automated bumping.
- **Tech Stack**: Rust, `tokio`, `sqlx`, `stellar-rpc-client`.
- **Architecture**: Hexagonal.
  - `Domain`: Defines `StateEntry`, `TTLPolicy`, and `Alert`.
  - `Application`: Logic for evaluating policies and triggering bumps.
  - `Infrastructure`: PostgreSQL adapters, Soroban RPC clients, and WebSocket event streams.

### 2. History Parser (Go)
- **Role**: One-time/Periodic deep-scan of the Stellar History Archive Bucket List.
- **Why Go?**: The Stellar Ingestion SDK is most mature in Go.
- **Function**: Extracts every `CONTRACT_DATA` entry for a target contract to build an authoritative key inventory.

### 3. API Service (TypeScript/Hono)
- **Role**: Backend for the dashboard and external SDKs.
- **Tech Stack**: Node.js, Hono, Drizzle ORM, BullMQ.
- **Tasks**: User management, policy configuration, alert dispatching (Webhooks/Email), and managing the bump job queue.

### 4. Dashboard (Next.js)
- **Role**: User-facing monitoring tool.
- **Features**: Runway timelines, cost projections, and bulk management.

## Data Flow

1. **Registration**: User registers a contract via the API.
2. **Cold-Start**: The Go Parser scans the bucket list for all existing keys.
3. **Monitoring**: The Rust Scanner subscribes to ledger events and updates TTLs in TimescaleDB.
4. **Bumping**: The Scanner identifies entries below policy thresholds and submits `extendTTL` transactions.
5. **Alerting**: The API dispatches alerts if state reaches critical thresholds or if bumps fail.

## Infrastructure

- **TimescaleDB**: Used for storing TTL history and burn rates.
- **Redis**: Powering BullMQ for reliable job processing (bumps and alerts).
- **Docker**: For unified deployment.
