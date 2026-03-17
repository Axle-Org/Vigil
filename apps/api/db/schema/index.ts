import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, decimal } from 'drizzle-orm/pg-core';

export const storageTypeEnum = pgEnum('storage_type', ['instance', 'persistent', 'temporary']);
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical']);
export const alertStatusEnum = pgEnum('alert_status', ['active', 'resolved', 'acknowledged']);

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(),
  network: text('network').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const stateEntries = pgTable('state_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  storageType: text('storage_type').notNull(),
  lastValXdr: text('last_val_xdr'),
  lastScannedAt: timestamp('last_scanned_at'),
});

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  entryId: uuid('entry_id').references(() => stateEntries.id),
  severity: text('severity').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

export const bumpPolicies = pgTable('bump_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  entryId: uuid('entry_id').references(() => stateEntries.id),
  targetTtlLedgers: integer('target_ttl_ledgers').notNull(),
  triggerThresholdLedgers: integer('trigger_threshold_ledgers').notNull(),
  priorityTier: integer('priority_tier').notNull().default(1),
  feeBudgetXlm: decimal('fee_budget_xlm', { precision: 18, scale: 7 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
