-- ============================================================
-- Migración: organization_id en todas las tablas core
-- Sprint 0→1 — Multi-tenancy completo
-- Fecha: 2026-06-18
-- ============================================================
-- Prerrequisito: migración 20260605000001_add_organizations_rls
-- ya creó la tabla organizations, profiles.organization_id,
-- y los helpers auth_org_id() / auth_role().
-- ============================================================

-- ── 0. Enum ResourceType para EspacioReservable (Epic 2) ──────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResourceType') THEN
    CREATE TYPE "ResourceType" AS ENUM (
      'cancha', 'campo', 'carril', 'pista', 'sala'
    );
  END IF;
END $$;

-- ── 1. Agregar organization_id a tablas core ──────────────────

ALTER TABLE courts             ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE courts             ADD COLUMN IF NOT EXISTS resource_type "ResourceType" NOT NULL DEFAULT 'cancha';

ALTER TABLE bookings           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE training_groups    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE mesocycles         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE exercises          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE evaluations        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE evaluation_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE tournaments        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE bank_accounts      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE invoices           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE payments           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE expenses           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE leads              ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE announcements      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE equipment          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE academy_settings   ADD COLUMN IF NOT EXISTS organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE;

-- ── 2. Índices ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_courts_org              ON courts(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_org            ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_groups_org     ON training_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_mesocycles_org          ON mesocycles(organization_id);
CREATE INDEX IF NOT EXISTS idx_exercises_org           ON exercises(organization_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_org         ON evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_eval_templates_org      ON evaluation_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_org         ON tournaments(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_tx_org        ON financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_org       ON bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org            ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org            ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org            ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org               ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_org       ON announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_org           ON equipment(organization_id);

-- ── 3. Backfill: asignar datos existentes a la org ────────────
-- Si existe exactamente una org (One Padel Academy) se migran
-- todos los registros huérfanos. Si no hay ninguna, se crea.

DO $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    SELECT COALESCE(name, 'Mi Academia') INTO v_org_name
      FROM academy_settings LIMIT 1;

    INSERT INTO organizations (id, name, slug, sport, plan, status, trial_ends_at)
    VALUES (
      gen_random_uuid(),
      COALESCE(v_org_name, 'Mi Academia'),
      regexp_replace(lower(COALESCE(v_org_name, 'mi-academia')), '[^a-z0-9]', '-', 'g'),
      'padel',
      'pro',
      'active',
      NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_org_id;

    UPDATE profiles SET organization_id = v_org_id WHERE organization_id IS NULL;
  END IF;

  UPDATE courts              SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE bookings            SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE training_groups     SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE mesocycles          SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE exercises           SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE evaluations         SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE evaluation_templates SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE tournaments         SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE financial_transactions SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE bank_accounts       SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE invoices            SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE payments            SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE expenses            SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE leads               SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE announcements       SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE equipment           SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE academy_settings    SET organization_id = v_org_id WHERE organization_id IS NULL;
END $$;

-- ── 4. RLS — Drop políticas obsoletas y recrear con org_id ────

-- courts
DROP POLICY IF EXISTS courts_select  ON courts;
DROP POLICY IF EXISTS courts_insert  ON courts;
DROP POLICY IF EXISTS courts_update  ON courts;
DROP POLICY IF EXISTS courts_delete  ON courts;

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY courts_select ON courts FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY courts_insert ON courts FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY courts_update ON courts FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY courts_delete ON courts FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- bookings
DROP POLICY IF EXISTS bookings_select ON bookings;
DROP POLICY IF EXISTS bookings_insert ON bookings;
DROP POLICY IF EXISTS bookings_update ON bookings;
DROP POLICY IF EXISTS bookings_delete ON bookings;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_select ON bookings FOR SELECT
  USING (
    organization_id = auth_org_id()
    AND (
      player_id  = auth.uid()
      OR coach_id = auth.uid()
      OR created_by = auth.uid()
      OR auth_role() = 'admin'
      OR auth_role() = 'coach'
    )
  );

CREATE POLICY bookings_insert ON bookings FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND created_by = auth.uid());

CREATE POLICY bookings_update ON bookings FOR UPDATE
  USING (
    organization_id = auth_org_id()
    AND (created_by = auth.uid() OR auth_role() IN ('admin', 'coach'))
  );

CREATE POLICY bookings_delete ON bookings FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- training_groups
DROP POLICY IF EXISTS groups_select ON training_groups;
DROP POLICY IF EXISTS groups_insert ON training_groups;
DROP POLICY IF EXISTS groups_update ON training_groups;
DROP POLICY IF EXISTS groups_delete ON training_groups;

ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select ON training_groups FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY groups_insert ON training_groups FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY groups_update ON training_groups FOR UPDATE
  USING (
    organization_id = auth_org_id()
    AND (coach_id = auth.uid() OR auth_role() = 'admin')
  );

CREATE POLICY groups_delete ON training_groups FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- group_members
DROP POLICY IF EXISTS group_members_select ON group_members;
DROP POLICY IF EXISTS group_members_insert ON group_members;
DROP POLICY IF EXISTS group_members_update ON group_members;

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_members_select ON group_members FOR SELECT
  USING (
    player_id = auth.uid()
    OR auth_role() IN ('admin', 'coach')
  );

CREATE POLICY group_members_insert ON group_members FOR INSERT
  WITH CHECK (auth_role() IN ('admin', 'coach') OR player_id = auth.uid());

CREATE POLICY group_members_update ON group_members FOR UPDATE
  USING (auth_role() IN ('admin', 'coach'));

-- mesocycles
ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mesocycles_select ON mesocycles;
DROP POLICY IF EXISTS mesocycles_insert ON mesocycles;
DROP POLICY IF EXISTS mesocycles_update ON mesocycles;
DROP POLICY IF EXISTS mesocycles_delete ON mesocycles;

CREATE POLICY mesocycles_select ON mesocycles FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY mesocycles_insert ON mesocycles FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY mesocycles_update ON mesocycles FOR UPDATE
  USING (organization_id = auth_org_id() AND (created_by = auth.uid() OR auth_role() = 'admin'));

CREATE POLICY mesocycles_delete ON mesocycles FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercises_select ON exercises;
DROP POLICY IF EXISTS exercises_insert ON exercises;
DROP POLICY IF EXISTS exercises_update ON exercises;
DROP POLICY IF EXISTS exercises_delete ON exercises;

CREATE POLICY exercises_select ON exercises FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY exercises_insert ON exercises FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY exercises_update ON exercises FOR UPDATE
  USING (organization_id = auth_org_id() AND (created_by = auth.uid() OR auth_role() = 'admin'));

CREATE POLICY exercises_delete ON exercises FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- evaluations
DROP POLICY IF EXISTS evals_select ON evaluations;
DROP POLICY IF EXISTS evals_insert ON evaluations;
DROP POLICY IF EXISTS evals_update ON evaluations;
DROP POLICY IF EXISTS evals_delete ON evaluations;

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY evals_select ON evaluations FOR SELECT
  USING (
    organization_id = auth_org_id()
    AND (player_id = auth.uid() OR coach_id = auth.uid() OR auth_role() = 'admin')
  );

CREATE POLICY evals_insert ON evaluations FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND (coach_id = auth.uid() OR auth_role() = 'admin'));

CREATE POLICY evals_update ON evaluations FOR UPDATE
  USING (organization_id = auth_org_id() AND (coach_id = auth.uid() OR auth_role() = 'admin'));

CREATE POLICY evals_delete ON evaluations FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- evaluation_templates
ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eval_templates_select ON evaluation_templates;
DROP POLICY IF EXISTS eval_templates_insert ON evaluation_templates;
DROP POLICY IF EXISTS eval_templates_update ON evaluation_templates;

CREATE POLICY eval_templates_select ON evaluation_templates FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY eval_templates_insert ON evaluation_templates FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY eval_templates_update ON evaluation_templates FOR UPDATE
  USING (organization_id = auth_org_id() AND (created_by = auth.uid() OR auth_role() = 'admin'));

-- tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournaments_select ON tournaments;
DROP POLICY IF EXISTS tournaments_insert ON tournaments;
DROP POLICY IF EXISTS tournaments_update ON tournaments;
DROP POLICY IF EXISTS tournaments_delete ON tournaments;

CREATE POLICY tournaments_select ON tournaments FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY tournaments_insert ON tournaments FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY tournaments_update ON tournaments FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY tournaments_delete ON tournaments FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- financial_transactions
DROP POLICY IF EXISTS fin_tx_select ON financial_transactions;
DROP POLICY IF EXISTS fin_tx_insert ON financial_transactions;
DROP POLICY IF EXISTS fin_tx_update ON financial_transactions;

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY fin_tx_select ON financial_transactions FOR SELECT
  USING (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY fin_tx_insert ON financial_transactions FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY fin_tx_update ON financial_transactions FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_accounts_select ON bank_accounts;
DROP POLICY IF EXISTS bank_accounts_insert ON bank_accounts;
DROP POLICY IF EXISTS bank_accounts_update ON bank_accounts;

CREATE POLICY bank_accounts_select ON bank_accounts FOR SELECT
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY bank_accounts_insert ON bank_accounts FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY bank_accounts_update ON bank_accounts FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select ON invoices;
DROP POLICY IF EXISTS invoices_insert ON invoices;

CREATE POLICY invoices_select ON invoices FOR SELECT
  USING (
    organization_id = auth_org_id()
    AND (player_id = auth.uid() OR auth_role() = 'admin')
  );

CREATE POLICY invoices_insert ON invoices FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

-- payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select ON payments;
DROP POLICY IF EXISTS payments_insert ON payments;

CREATE POLICY payments_select ON payments FOR SELECT
  USING (
    organization_id = auth_org_id()
    AND (player_id = auth.uid() OR auth_role() IN ('admin', 'coach'))
  );

CREATE POLICY payments_insert ON payments FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expenses_select ON expenses;
DROP POLICY IF EXISTS expenses_insert ON expenses;

CREATE POLICY expenses_select ON expenses FOR SELECT
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY expenses_insert ON expenses FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

-- leads (CRM)
DROP POLICY IF EXISTS leads_select ON leads;
DROP POLICY IF EXISTS leads_all    ON leads;
DROP POLICY IF EXISTS leads_insert ON leads;
DROP POLICY IF EXISTS leads_update ON leads;
DROP POLICY IF EXISTS leads_delete ON leads;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_select ON leads FOR SELECT
  USING (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY leads_insert ON leads FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY leads_update ON leads FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY leads_delete ON leads FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- interactions
DROP POLICY IF EXISTS interactions_select ON interactions;
DROP POLICY IF EXISTS interactions_insert ON interactions;

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY interactions_select ON interactions FOR SELECT
  USING (
    auth_role() IN ('admin', 'coach')
    AND created_by IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

CREATE POLICY interactions_insert ON interactions FOR INSERT
  WITH CHECK (
    auth_role() IN ('admin', 'coach')
    AND created_by = auth.uid()
  );

-- retention_scores
DROP POLICY IF EXISTS retention_select ON retention_scores;

ALTER TABLE retention_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY retention_select ON retention_scores FOR SELECT
  USING (
    profile_id = auth.uid()
    OR (
      auth_role() IN ('admin', 'coach')
      AND profile_id IN (
        SELECT id FROM profiles WHERE organization_id = auth_org_id()
      )
    )
  );

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select ON announcements;
DROP POLICY IF EXISTS announcements_insert ON announcements;

CREATE POLICY announcements_select ON announcements FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY announcements_insert ON announcements FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

-- equipment
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS equipment_select ON equipment;
DROP POLICY IF EXISTS equipment_insert ON equipment;
DROP POLICY IF EXISTS equipment_update ON equipment;

CREATE POLICY equipment_select ON equipment FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY equipment_insert ON equipment FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY equipment_update ON equipment FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');

-- academy_settings (per-org)
ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academy_settings_select ON academy_settings;
DROP POLICY IF EXISTS academy_settings_update ON academy_settings;

CREATE POLICY academy_settings_select ON academy_settings FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY academy_settings_update ON academy_settings FOR UPDATE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');
