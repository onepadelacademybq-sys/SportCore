-- Macrociclo: nivel superior de periodización que agrupa mesociclos en una temporada/año.

CREATE TABLE macrocycles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL REFERENCES profiles(id),
  name              text NOT NULL,
  general_objective text,
  status            "MesocycleStatus" NOT NULL DEFAULT 'draft',
  start_date        date,
  end_date          date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_macrocycles_org        ON macrocycles(organization_id);
CREATE INDEX idx_macrocycles_created_by ON macrocycles(created_by);

-- Vincular mesociclos a un macrociclo (opcional). Al borrar el macrociclo, los
-- mesociclos quedan sueltos (no se borran).
ALTER TABLE mesocycles ADD COLUMN macrocycle_id uuid REFERENCES macrocycles(id) ON DELETE SET NULL;
CREATE INDEX idx_mesocycles_macrocycle ON mesocycles(macrocycle_id);

-- updated_at: trigger + default (patrón del proyecto, para inserts vía Supabase client)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON macrocycles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS (espeja exactamente las políticas de mesocycles)
ALTER TABLE macrocycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS macrocycles_select ON macrocycles;
DROP POLICY IF EXISTS macrocycles_insert ON macrocycles;
DROP POLICY IF EXISTS macrocycles_update ON macrocycles;
DROP POLICY IF EXISTS macrocycles_delete ON macrocycles;

CREATE POLICY macrocycles_select ON macrocycles FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY macrocycles_insert ON macrocycles FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

CREATE POLICY macrocycles_update ON macrocycles FOR UPDATE
  USING (organization_id = auth_org_id() AND (created_by = auth.uid() OR auth_role() = 'admin'));

CREATE POLICY macrocycles_delete ON macrocycles FOR DELETE
  USING (organization_id = auth_org_id() AND auth_role() = 'admin');
