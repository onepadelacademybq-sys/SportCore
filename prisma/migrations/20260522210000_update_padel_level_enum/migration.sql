-- Migration: Replace PadelLevel enum with One Padel official levels
-- Old: iniciacion | intermedio | avanzado | elite
-- New: 5ta_masculino | 6ta_masculino | 7ma_masculino | femenino_d | femenino_c |
--      juvenil_s18 | juvenil_s16 | juvenil_s14 | prejuvenil | baby_padel
--
-- Idempotent: safe to re-run if a previous attempt failed partway.

-- Step 1: Clean up any leftover from a previous failed run
DROP TYPE IF EXISTS "PadelLevel_new";

-- Step 2: Create the new enum type
CREATE TYPE "PadelLevel_new" AS ENUM (
  '5ta_masculino',
  '6ta_masculino',
  '7ma_masculino',
  'femenino_d',
  'femenino_c',
  'juvenil_s18',
  'juvenil_s16',
  'juvenil_s14',
  'prejuvenil',
  'baby_padel'
);

-- Step 3: Migrate each column that uses PadelLevel

-- profiles.padel_level (nullable) — incompatible old values → NULL
ALTER TABLE "profiles"
  ALTER COLUMN "padel_level" TYPE "PadelLevel_new"
    USING NULL;

-- exercises.level (NOT NULL) — reset to first valid value
ALTER TABLE "exercises"
  ALTER COLUMN "level" TYPE "PadelLevel_new"
    USING '5ta_masculino'::"PadelLevel_new";

-- mesocycles.level (NOT NULL)
ALTER TABLE "mesocycles"
  ALTER COLUMN "level" TYPE "PadelLevel_new"
    USING '5ta_masculino'::"PadelLevel_new";

-- training_groups.level (NOT NULL)
ALTER TABLE "training_groups"
  ALTER COLUMN "level" TYPE "PadelLevel_new"
    USING '5ta_masculino'::"PadelLevel_new";

-- coach_profiles.preferred_levels (array) — reset to empty
ALTER TABLE "coach_profiles"
  ALTER COLUMN "preferred_levels" TYPE "PadelLevel_new"[]
    USING ARRAY[]::"PadelLevel_new"[];

-- Step 4: Swap types
DROP TYPE "PadelLevel";
ALTER TYPE "PadelLevel_new" RENAME TO "PadelLevel";
