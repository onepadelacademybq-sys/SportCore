-- Plan = 12 mesociclos × 4 semanas auto-generados. El nivel vive en el diagnóstico
-- del plan y el objetivo lo asigna el coach después, así que dejan de ser obligatorios.
-- Idempotente.

ALTER TABLE mesocycles ALTER COLUMN level DROP NOT NULL;
ALTER TABLE mesocycles ALTER COLUMN general_objective DROP NOT NULL;
