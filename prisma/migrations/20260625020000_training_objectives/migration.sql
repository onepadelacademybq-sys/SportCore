-- Catálogo de objetivos de entrenamiento (Fase B). Lista predefinida (global) +
-- objetivos creados por la organización ("Otro"). Cada objetivo mapea a un theme
-- de ejercicio para el filtro de biblioteca (Fase D). Idempotente.

CREATE TABLE IF NOT EXISTS training_objectives (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,  -- null = catálogo global
  name            text NOT NULL,
  theme           text,  -- calentamiento | tecnica | tactica | fisico | mental | vuelta_a_la_calma
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_objectives_org ON training_objectives(organization_id);

ALTER TABLE training_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_objectives_select ON training_objectives;
DROP POLICY IF EXISTS training_objectives_insert ON training_objectives;

CREATE POLICY training_objectives_select ON training_objectives FOR SELECT
  USING (organization_id IS NULL OR organization_id = auth_org_id());

CREATE POLICY training_objectives_insert ON training_objectives FOR INSERT
  WITH CHECK (organization_id = auth_org_id() AND auth_role() IN ('admin', 'coach'));

ALTER TABLE mesocycles ADD COLUMN IF NOT EXISTS objective_id uuid REFERENCES training_objectives(id) ON DELETE SET NULL;

-- Semilla global (organization_id null), solo si aún no hay objetivos globales.
INSERT INTO training_objectives (name, theme)
SELECT v.name, v.theme FROM (VALUES
  ('Golpes de fondo',        'tecnica'),
  ('Volea',                  'tecnica'),
  ('Bandeja',                'tecnica'),
  ('Víbora',                 'tecnica'),
  ('Smash',                  'tecnica'),
  ('Saque y resto',          'tecnica'),
  ('Salida de pared',        'tecnica'),
  ('Posicionamiento en cancha', 'tactica'),
  ('Juego en pareja',        'tactica'),
  ('Transiciones',           'tactica'),
  ('Construcción de punto',  'tactica'),
  ('Resistencia aeróbica',   'fisico'),
  ('Fuerza y potencia',      'fisico'),
  ('Velocidad y agilidad',   'fisico'),
  ('Flexibilidad y movilidad','fisico'),
  ('Concentración',          'mental'),
  ('Manejo de presión',      'mental')
) AS v(name, theme)
WHERE NOT EXISTS (SELECT 1 FROM training_objectives WHERE organization_id IS NULL);
