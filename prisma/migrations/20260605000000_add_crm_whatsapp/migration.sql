-- ============================================================
-- Migración: CRM + WhatsApp Integration
-- Fecha: 2026-06-05
-- Tablas: leads, interactions, retention_scores
-- Columnas nuevas: profiles.whatsapp_phone,
--                  notification_preferences.whatsapp_enabled
-- ============================================================

-- ── Enums nuevos ──────────────────────────────────────────────

CREATE TYPE "LeadStatus" AS ENUM (
  'new', 'contacted', 'trial_scheduled', 'trial_done', 'converted', 'lost'
);

CREATE TYPE "LeadSource" AS ENUM (
  'web_form', 'instagram', 'facebook', 'referral', 'walk_in', 'whatsapp', 'other'
);

CREATE TYPE "InteractionType" AS ENUM (
  'whatsapp_sent', 'whatsapp_received', 'call', 'email', 'note', 'trial_class', 'follow_up'
);

CREATE TYPE "RetentionStatus" AS ENUM (
  'active', 'at_risk', 'losing', 'churned'
);

CREATE TYPE "WaMessageStatus" AS ENUM (
  'queued', 'sent', 'delivered', 'read', 'failed'
);

-- ── Columnas nuevas en tablas existentes ──────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Tabla: leads ──────────────────────────────────────────────

CREATE TABLE leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  phone         TEXT        NOT NULL,
  whatsapp      TEXT,
  email         TEXT,
  source        "LeadSource"  NOT NULL DEFAULT 'web_form',
  status        "LeadStatus"  NOT NULL DEFAULT 'new',
  sport         TEXT,
  notes         TEXT,
  lost_reason   TEXT,
  converted_at  TIMESTAMPTZ,
  profile_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status  ON leads(status);
CREATE INDEX idx_leads_source  ON leads(source);

-- Trigger updated_at
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Tabla: interactions ───────────────────────────────────────

CREATE TABLE interactions (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID              REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id       UUID              REFERENCES leads(id) ON DELETE CASCADE,
  type          "InteractionType" NOT NULL,
  summary       TEXT              NOT NULL,
  wa_message_id TEXT,
  wa_status     "WaMessageStatus",
  created_by    UUID              NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_profile ON interactions(profile_id);
CREATE INDEX idx_interactions_lead    ON interactions(lead_id);
CREATE INDEX idx_interactions_type    ON interactions(type);

-- ── Tabla: retention_scores ───────────────────────────────────

CREATE TABLE retention_scores (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID              UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score               INTEGER           NOT NULL DEFAULT 100,
  status              "RetentionStatus" NOT NULL DEFAULT 'active',
  last_class_at       TIMESTAMPTZ,
  classes_this_month  INTEGER           NOT NULL DEFAULT 0,
  alert_sent_at       TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retention_status ON retention_scores(status);
