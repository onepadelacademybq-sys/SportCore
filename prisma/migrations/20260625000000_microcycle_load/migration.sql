-- Capa de carga por microciclo (Sección 6 del planificador): fase b/e/c/T + volumen + intensidad.
-- Idempotente: seguro de re-aplicar.

DO $$ BEGIN
  CREATE TYPE "ContentPhase" AS ENUM ('basico', 'especifico', 'competitivo', 'transicion');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE microcycles ADD COLUMN IF NOT EXISTS content_phase     "ContentPhase";
ALTER TABLE microcycles ADD COLUMN IF NOT EXISTS planned_volume    integer;
ALTER TABLE microcycles ADD COLUMN IF NOT EXISTS planned_intensity integer;
