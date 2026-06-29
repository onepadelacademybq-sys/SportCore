-- Config por mesociclo (Fase C): sesiones/semana, horas/sesión, suspender. Idempotente.

ALTER TABLE mesocycles ADD COLUMN IF NOT EXISTS sessions_per_week integer;
ALTER TABLE mesocycles ADD COLUMN IF NOT EXISTS hours_per_session numeric(3,1);
ALTER TABLE mesocycles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
