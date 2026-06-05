-- ============================================================
-- Migración: Organizations + Row Level Security (RLS)
-- Fecha: 2026-06-05
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────

CREATE TYPE "OrgPlan"   AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE "OrgStatus" AS ENUM ('trialing', 'active', 'suspended', 'cancelled');

-- ── Tabla: organizations ──────────────────────────────────────

CREATE TABLE organizations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  slug              TEXT        UNIQUE NOT NULL,
  sport             TEXT        NOT NULL DEFAULT 'general',
  plan              "OrgPlan"   NOT NULL DEFAULT 'starter',
  status            "OrgStatus" NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT       UNIQUE,
  stripe_sub_id     TEXT        UNIQUE,
  plan_limits       JSONB       NOT NULL DEFAULT '{"max_resources":6,"max_members":100,"max_coaches":3}',
  plan_started_at   TIMESTAMPTZ,
  plan_expires_at   TIMESTAMPTZ,
  trial_ends_at     TIMESTAMPTZ,
  terminology       JSONB       NOT NULL DEFAULT '{"resource":"Cancha","coach":"Entrenador","player":"Jugador"}',
  logo_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── organization_id en profiles ────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_organization ON profiles(organization_id);

-- ── Helper: organización del usuario autenticado ───────────────
-- Función usada en todas las políticas RLS para evitar subconsultas repetidas

CREATE OR REPLACE FUNCTION auth_org_id() RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- ── Helper: rol del usuario autenticado ───────────────────────

CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$;

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Políticas por tabla
-- Principio: cada usuario solo ve datos de su misma organización
-- Los admins ven todo dentro de su org
-- ════════════════════════════════════════════════════════════════

-- ── profiles ───────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leer: mismo usuario O misma organización
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR organization_id = auth_org_id()
  );

-- Insertar: solo el propio usuario (al registrarse)
CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Actualizar: propio perfil, o admin de la misma org
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR (auth_role() = 'admin' AND organization_id = auth_org_id())
  );

-- ── organizations ──────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY orgs_select ON organizations FOR SELECT
  USING (id = auth_org_id());

CREATE POLICY orgs_update ON organizations FOR UPDATE
  USING (id = auth_org_id() AND auth_role() = 'admin');

-- ── bookings ────────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_select ON bookings FOR SELECT
  USING (
    player_id = auth.uid()
    OR coach_id = auth.uid()
    OR created_by = auth.uid()
    OR auth_role() = 'admin'
  );

CREATE POLICY bookings_insert ON bookings FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY bookings_update ON bookings FOR UPDATE
  USING (
    created_by = auth.uid()
    OR auth_role() IN ('admin', 'coach')
  );

-- ── courts ──────────────────────────────────────────────────────
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Todos en la org pueden leer canchas/recursos
CREATE POLICY courts_select ON courts FOR SELECT USING (true);

-- Solo admins pueden crear/modificar recursos
CREATE POLICY courts_insert ON courts FOR INSERT
  WITH CHECK (auth_role() = 'admin');

CREATE POLICY courts_update ON courts FOR UPDATE
  USING (auth_role() = 'admin');

-- ── training_groups ─────────────────────────────────────────────
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select ON training_groups FOR SELECT USING (true);

CREATE POLICY groups_insert ON training_groups FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'coach'));

CREATE POLICY groups_update ON training_groups FOR UPDATE
  USING (
    coach_id = auth.uid()
    OR auth_role() = 'admin'
  );

-- ── group_members ───────────────────────────────────────────────
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_members_select ON group_members FOR SELECT
  USING (
    player_id = auth.uid()
    OR auth_role() IN ('admin', 'coach')
  );

CREATE POLICY group_members_insert ON group_members FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'coach') OR player_id = auth.uid());

-- ── evaluations ─────────────────────────────────────────────────
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY evals_select ON evaluations FOR SELECT
  USING (
    player_id = auth.uid()
    OR coach_id = auth.uid()
    OR auth_role() = 'admin'
  );

CREATE POLICY evals_insert ON evaluations FOR INSERT
  WITH CHECK (coach_id = auth.uid() OR auth_role() = 'admin');

-- ── financial_transactions ──────────────────────────────────────
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY fin_tx_select ON financial_transactions FOR SELECT
  USING (auth_role() IN ('admin', 'coach'));

CREATE POLICY fin_tx_insert ON financial_transactions FOR INSERT
  WITH CHECK (auth_role() = 'admin');

-- ── notifications ───────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifs_select ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notifs_update ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── leads / interactions / retention_scores (CRM) ──────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_select ON leads FOR SELECT
  USING (auth_role() IN ('admin', 'coach'));

CREATE POLICY leads_all ON leads FOR ALL
  USING (auth_role() IN ('admin', 'coach'));

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY interactions_select ON interactions FOR SELECT
  USING (auth_role() IN ('admin', 'coach'));

ALTER TABLE retention_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY retention_select ON retention_scores FOR SELECT
  USING (
    profile_id = auth.uid()
    OR auth_role() IN ('admin', 'coach')
  );

-- ── audit_logs ──────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins ven los logs de auditoría
CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (auth_role() = 'admin');

-- Service role siempre puede insertar (bypass RLS desde el backend)
CREATE POLICY audit_insert ON audit_logs FOR INSERT
  WITH CHECK (true);
