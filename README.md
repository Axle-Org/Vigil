# Vigil

**State lifecycle manager for Soroban — TTL monitoring, auto-bump, and archival recovery.**

Vigil watches every piece of state in your Soroban contracts, warns you before anything expires, automatically bumps the entries that matter, and recovers state that has already been archived. It handles everything from storage key discovery and TTL tracking to bump policy enforcement, fee-optimized batch transactions, and full archival restoration.

If your contracts store state on Soroban, Vigil keeps it alive.

---

## Why Vigil Exists

Soroban uses a TTL-based state archival model that exists nowhere else in blockchain. Every storage entry — instance, persistent, and temporary — has a time-to-live measured in ledgers. When the TTL hits zero, persistent and instance state gets archived. Temporary state is deleted permanently. There is no grace period, no notification, and no built-in recovery path.

The problem: there is zero tooling for this. Developers either manually track TTLs, over-bump everything and waste fees, or discover in production that critical contract state has silently vanished. Mercury indexes events but does not manage TTLs. Block explorers show current state but not how close it is to disappearing.

Vigil is the missing infrastructure. It is purpose-built for state lifecycle management — designed with the assumption that no developer should have to think about ledger expiration math while building their application.

---

## Features

- **Continuous TTL monitoring** — scans all storage entries across registered contracts every ledger close, tracks instance, persistent, and temporary storage independently, and maintains a full TTL history over time
- **Multi-channel alerting** — configurable thresholds per contract, per storage type, or per individual key; alerts via webhook, email, and dashboard notification with tiered severity levels
- **Auto-bump engine** — define policies that keep critical state alive automatically; target TTL, trigger threshold, priority tier, and fee budget enforced on every ledger
- **Batch transaction optimization** — aggregates multiple bump operations into minimal transactions, respects size limits, and minimizes total network fees
- **Fee management** — real-time cost estimation, monthly projections, hard budget caps, and automatic escalation to alerts when budget is exhausted
- **Archival recovery** — detects expired state, locates the last known value from historical snapshots, constructs the `restoreFootprint` transaction, and applies a bump policy post-recovery so it never expires again
- **Storage key discovery** — event-based and simulation-based key detection with manual registration fallback; solves the problem of Soroban having no native "list all keys" RPC method
- **Dashboard** — contract health scores, projected expiration timelines, cost forecasts, cross-contract views, and a full activity log of every bump, alert, and recovery

---

## Requirements

- Rust 1.75 or higher (core scanner and bump engine)
- Node.js 20 or higher (TypeScript SDK and dashboard)
- PostgreSQL 15 or higher (state inventory and TTL history)
- Access to a Soroban RPC endpoint
- A funded Stellar account for auto-bump transactions (or a signing webhook for non-custodial mode)

---

## Installation

```bash
# Rust crate
cargo add vigil

# TypeScript SDK
pnpm add vigil-sdk

# Self-hosted (Docker)
docker compose up -d
```

---

## Architecture

Vigil is organized into five internal layers that compose into a unified lifecycle management system. The Rust crate exposes the scanner and bump engine directly. The TypeScript SDK and dashboard communicate through the REST API.

```
Soroban Ledger (continuous state changes)
        │
        ▼
┌───────────────────┐
│     Scanner       │  Discovers keys, polls TTLs, builds state inventory
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   Alert Engine    │  Evaluates thresholds — fires warnings across channels
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Policy Evaluator │  Matches entries against bump policies and fee budgets
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Bump Executor    │  Batches extendTTL operations, signs, submits, retries
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Recovery Service │  Locates archived state, restores, applies bump policy
└────────┬──────────┘
         │
         ▼
   State secured
   Inventory updated
   Activity logged
```

### Layer 1: Scanner

The foundation. Connects to Soroban RPC, discovers storage keys through event ingestion and transaction simulation, polls TTLs on a per-ledger cadence, and writes snapshots to PostgreSQL. Differentiates between instance, persistent, and temporary storage because each type has fundamentally different archival behavior. Caches state values as they are scanned, building the historical archive that powers recovery later.

### Layer 2: Alert Engine

Evaluates every TTL snapshot against user-defined thresholds. Supports tiered severity — info, warning, critical — with independent thresholds per contract, per storage type, or per individual key. Dispatches alerts through webhooks, email, and the dashboard notification system. Deduplicates alerts to prevent flooding. Maintains an alert history for audit purposes.

### Layer 3: Policy Evaluator

The decision layer for auto-bumping. Each policy defines a target TTL, a trigger threshold, a priority tier, and an optional fee budget. When the scanner reports an entry below its trigger threshold, the policy evaluator approves or rejects the bump based on priority, remaining budget, and whether a higher-priority entry needs the same funds. No bump transaction is ever constructed without passing through this layer.

### Layer 4: Bump Executor

Receives approved bump operations from the policy evaluator and turns them into Soroban transactions. Batches multiple `extendTTL` calls into single transactions to minimize fees. Handles transaction construction, signing (direct key or webhook-based), submission, confirmation, and retry with exponential backoff. Failed transactions enter a dead-letter queue with full diagnostic context. Supports both custodial mode (Vigil holds a dedicated bump key) and non-custodial mode (Vigil generates unsigned transactions and calls a user-provided signing endpoint).

### Layer 5: Recovery Service

When state has already been archived, this layer locates the entry's last known value from Vigil's historical snapshot cache, constructs the `restoreFootprint` transaction, handles submission and confirmation, and immediately applies a bump policy to the restored entry. Also provides a proactive "danger zone" view — entries within hours of archival that have no active bump policy — to prevent the need for recovery in the first place.

## Security Model

**Signing keys are scoped and isolated.** In custodial mode, Vigil uses a dedicated bump key that is separate from your contract deployment keys. This key only needs authority to submit `extendTTL` and `restoreFootprint` operations. It never touches your contract logic or funds beyond the XLM reserved for bump fees.

**Non-custodial mode requires zero trust.** Vigil generates unsigned transactions and sends them to your signing endpoint via webhook. Your infrastructure signs and submits. Vigil never sees a secret key.

**Fee budgets are hard limits.** The policy evaluator enforces fee caps before any transaction is constructed. A misconfigured policy cannot drain an account — it can only bump until the budget is exhausted, then it stops and alerts.

**State values are cached locally.** Vigil's historical snapshot cache stores state values in your PostgreSQL instance. No contract data is sent to any external service. The self-hosted deployment keeps everything on your infrastructure.

**RPC failures are handled gracefully.** The scanner supports multiple RPC endpoints with automatic failover. Bump and restore operations retry with exponential backoff and circuit breaking. A network outage triggers alerts but never results in silent data loss.

## Deployment Modes

| Mode            | Description                                                                             | Best For                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Library**     | Import the Rust crate or TypeScript SDK directly into your project                      | Developers who want programmatic TTL management integrated into their own tooling                         |
| **Self-hosted** | Docker Compose stack with scanner, bump engine, PostgreSQL, and dashboard               | Teams that want full control, no external dependencies, and keep signing keys on their own infrastructure |
| **Hosted**      | Managed service — register contracts through the dashboard and Vigil handles everything | Teams that want zero infrastructure overhead and are comfortable with custodial bump key management       |

---

## Storage Types

| Type           | Archival Behavior                                             | Vigil Handling                                                                                   |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Instance**   | Archived when TTL expires; recoverable via `restoreFootprint` | Monitored, auto-bumped, recoverable                                                              |
| **Persistent** | Archived when TTL expires; recoverable via `restoreFootprint` | Monitored, auto-bumped, recoverable                                                              |
| **Temporary**  | Permanently deleted when TTL expires; not recoverable         | Monitored and alerted only — Vigil warns aggressively but cannot recover deleted temporary state |

---

## Compatibility

Vigil is compatible with any contract deployed on Soroban (Stellar Mainnet, Testnet, and Futurenet). It communicates exclusively through the standard Soroban RPC interface and does not require contract modifications. Contracts do not need to know Vigil exists.

---

## License

MIT
