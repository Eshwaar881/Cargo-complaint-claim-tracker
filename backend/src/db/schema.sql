-- =====================================================================
-- CARGO COMPLAINT & CLAIM TRACKER — SCHEMA
-- Engine: node:sqlite (file-based, zero native deps)
-- =====================================================================

-- Shipments: the minimum context a complaint needs to make sense.
-- Fed by Milestone Tracking / AWB Tracker in a full ERP; here we
-- model just the fields a complaint references.
CREATE TABLE IF NOT EXISTS shipments (
  id              TEXT PRIMARY KEY,           -- e.g. shp_xxxxx
  awb_number      TEXT UNIQUE NOT NULL,        -- Airway Bill No.
  origin_code     TEXT NOT NULL,               -- IATA airport code
  origin_lat      REAL,
  origin_lng      REAL,
  dest_code       TEXT NOT NULL,
  dest_lat        REAL,
  dest_lng        REAL,
  shipper_name    TEXT NOT NULL,
  consignee_name  TEXT NOT NULL,
  commodity       TEXT,
  pieces          INTEGER DEFAULT 1,
  gross_weight_kg REAL,                        -- actual weight
  length_cm       REAL,
  width_cm        REAL,
  height_cm       REAL,
  chargeable_weight_kg REAL,                   -- max(actual, volumetric)
  milestone_status TEXT DEFAULT 'BOOKED',      -- BOOKED|IN_TRANSIT|ARRIVED|CUSTOMS|DELIVERED
  eta              TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- People & roles allowed to raise / own / resolve cases.
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN (
                'EXPORTER','IMPORTER','AGENT','LOGISTICS_PARTNER',
                'ADMIN','OPS_STAFF','DOC_EXECUTIVE','WAREHOUSE_STAFF',
                'ACCOUNTS_STAFF','PARTNER_MANAGER'
              )),
  created_at  TEXT NOT NULL
);

-- THE CORE TABLE — every complaint/claim, its workflow state, and ownership.
CREATE TABLE IF NOT EXISTS complaints (
  id               TEXT PRIMARY KEY,           -- e.g. cmp_xxxxx
  reference_code   TEXT UNIQUE NOT NULL,       -- human-facing e.g. CCT-2026-000123
  shipment_id      TEXT REFERENCES shipments(id),
  awb_number       TEXT,                       -- denormalized for fast lookup/display

  category         TEXT NOT NULL CHECK (category IN (
                     'DELAY','DAMAGE','MISSING_PACKAGE','BILLING_ISSUE','DOCUMENTATION_ISSUE'
                   )),
  subtype          TEXT,                       -- e.g. 'partial_damage', 'rate_discrepancy'
  description      TEXT NOT NULL,
  is_claim         INTEGER NOT NULL DEFAULT 0, -- 0 = complaint, 1 = formal monetary claim
  claim_amount     REAL,
  claim_currency   TEXT DEFAULT 'USD',

  priority         TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status           TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
                     'OPEN','ACKNOWLEDGED','INVESTIGATING','PENDING_CUSTOMER',
                     'RESOLVED','REJECTED','ESCALATED','CLOSED'
                   )),

  -- Step 2 required fields: source, status, owner, timestamp
  source           TEXT NOT NULL CHECK (source IN (
                     'CUSTOMER_PORTAL','AGENT_PORTAL','CRM','EMAIL','PHONE','INTERNAL_OPS'
                   )),
  raised_by_id     TEXT REFERENCES users(id),
  raised_by_name   TEXT NOT NULL,
  raised_by_email  TEXT NOT NULL,
  owner_id         TEXT REFERENCES users(id),
  owner_name       TEXT,

  sla_due_at       TEXT,                       -- computed from category+priority at creation
  resolved_at      TEXT,

  ai_summary       TEXT,                       -- Gemini-generated triage summary
  ai_recommendation TEXT,                       -- Gemini-generated next-action recommendation
  ai_sentiment     TEXT,                        -- urgent|neutral|frustrated etc (optional, derived)

  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- Full action/audit history per complaint — drives "action history" in dashboard.
CREATE TABLE IF NOT EXISTS complaint_events (
  id            TEXT PRIMARY KEY,
  complaint_id  TEXT NOT NULL REFERENCES complaints(id),
  event_type    TEXT NOT NULL CHECK (event_type IN (
                  'CREATED','STATUS_CHANGE','PRIORITY_CHANGE','OWNER_CHANGE',
                  'NOTE_ADDED','AI_TRIAGE','REMINDER_SENT','EMAIL_SENT',
                  'SLA_BREACHED','RESOLVED','REOPENED'
                )),
  actor_name    TEXT,
  detail        TEXT,                          -- free text / JSON blob describing the change
  created_at    TEXT NOT NULL
);

-- Outbound notifications log (SendGrid) — confirmations, reminders, follow-ups.
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  complaint_id  TEXT REFERENCES complaints(id),
  channel       TEXT NOT NULL DEFAULT 'EMAIL',
  recipient     TEXT NOT NULL,
  subject       TEXT,
  body_preview  TEXT,
  kind          TEXT CHECK (kind IN ('CONFIRMATION','REMINDER','FOLLOWUP','ESCALATION','RESOLUTION')),
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
  error_message TEXT,
  created_at    TEXT NOT NULL,
  sent_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_awb ON complaints(awb_number);
CREATE INDEX IF NOT EXISTS idx_events_complaint ON complaint_events(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_complaint ON notifications(complaint_id);
