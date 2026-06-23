-- ============================================================
-- Migración: RLS en tablas financieras sin cobertura
-- Fecha: 2026-06-23
-- Auditoría: class_wallet, wallet_transactions, subscriptions
-- y group_payments no tenían RLS — cualquier usuario autenticado
-- podía leer créditos y pagos de otros jugadores/orgs.
-- ============================================================
-- Nota: estas tablas no tienen organization_id directamente.
-- El scope de org se resuelve via JOIN a profiles o training_groups,
-- ambas con índice en organization_id (idx_profiles_organization,
-- idx_training_groups_org).
-- ============================================================

-- ── class_wallet ─────────────────────────────────────────────
-- Una wallet por jugador. El jugador ve la propia; admin/coach
-- ven las de todos los jugadores de su org.

ALTER TABLE class_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallet_select ON class_wallet;
DROP POLICY IF EXISTS wallet_insert ON class_wallet;
DROP POLICY IF EXISTS wallet_update ON class_wallet;

CREATE POLICY wallet_select ON class_wallet FOR SELECT
  USING (
    player_id = auth.uid()
    OR (
      auth_role() IN ('admin', 'coach')
      AND player_id IN (
        SELECT id FROM profiles WHERE organization_id = auth_org_id()
      )
    )
  );

CREATE POLICY wallet_insert ON class_wallet FOR INSERT
  WITH CHECK (
    auth_role() IN ('admin', 'coach')
    AND player_id IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

CREATE POLICY wallet_update ON class_wallet FOR UPDATE
  USING (
    auth_role() IN ('admin', 'coach')
    AND player_id IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

-- ── wallet_transactions ───────────────────────────────────────
-- Historial de créditos y débitos. Solo lectura para el jugador;
-- insert restringido a admin/coach (los server actions usan
-- service role, pero RLS protege acceso directo desde el cliente).

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallet_tx_select ON wallet_transactions;
DROP POLICY IF EXISTS wallet_tx_insert ON wallet_transactions;

CREATE POLICY wallet_tx_select ON wallet_transactions FOR SELECT
  USING (
    player_id = auth.uid()
    OR (
      auth_role() IN ('admin', 'coach')
      AND player_id IN (
        SELECT id FROM profiles WHERE organization_id = auth_org_id()
      )
    )
  );

CREATE POLICY wallet_tx_insert ON wallet_transactions FOR INSERT
  WITH CHECK (
    auth_role() IN ('admin', 'coach')
    AND player_id IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

-- ── subscriptions ─────────────────────────────────────────────
-- Membresías de jugadores dentro de una academia. El jugador
-- ve solo la propia; admin ve todas las de su org.

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
DROP POLICY IF EXISTS subscriptions_insert ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update ON subscriptions;

CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (
    player_id = auth.uid()
    OR (
      auth_role() = 'admin'
      AND player_id IN (
        SELECT id FROM profiles WHERE organization_id = auth_org_id()
      )
    )
  );

CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT
  WITH CHECK (
    auth_role() = 'admin'
    AND player_id IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE
  USING (
    auth_role() = 'admin'
    AND player_id IN (
      SELECT id FROM profiles WHERE organization_id = auth_org_id()
    )
  );

-- ── group_payments ────────────────────────────────────────────
-- Pagos mensuales de grupos. El scope de org viene del grupo
-- al que pertenece el pago (training_groups.organization_id).

ALTER TABLE group_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_payments_select ON group_payments;
DROP POLICY IF EXISTS group_payments_insert ON group_payments;
DROP POLICY IF EXISTS group_payments_update ON group_payments;

CREATE POLICY group_payments_select ON group_payments FOR SELECT
  USING (
    player_id = auth.uid()
    OR (
      auth_role() IN ('admin', 'coach')
      AND group_id IN (
        SELECT id FROM training_groups WHERE organization_id = auth_org_id()
      )
    )
  );

CREATE POLICY group_payments_insert ON group_payments FOR INSERT
  WITH CHECK (
    auth_role() IN ('admin', 'coach')
    AND group_id IN (
      SELECT id FROM training_groups WHERE organization_id = auth_org_id()
    )
  );

CREATE POLICY group_payments_update ON group_payments FOR UPDATE
  USING (
    auth_role() IN ('admin', 'coach')
    AND group_id IN (
      SELECT id FROM training_groups WHERE organization_id = auth_org_id()
    )
  );
