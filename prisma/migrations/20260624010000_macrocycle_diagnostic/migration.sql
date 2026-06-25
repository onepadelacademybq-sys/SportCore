-- Diagnóstico de periodización en el macrociclo (Secciones 1-2 del planificador).
-- Idempotente: seguro de re-aplicar (CREATE TYPE no soporta IF NOT EXISTS).

DO $$ BEGIN
  CREATE TYPE "AthleteLevel" AS ENUM ('principiante', 'intermedio', 'avanzado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CompetitionType" AS ENUM ('aislada', 'agrupada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PeriodizationModel" AS ENUM ('regular', 'concentrado', 'dup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE macrocycles ADD COLUMN IF NOT EXISTS athlete_level       "AthleteLevel";
ALTER TABLE macrocycles ADD COLUMN IF NOT EXISTS competition_type    "CompetitionType";
ALTER TABLE macrocycles ADD COLUMN IF NOT EXISTS periodization_model "PeriodizationModel";
ALTER TABLE macrocycles ADD COLUMN IF NOT EXISTS qualities           text[] NOT NULL DEFAULT '{}';
