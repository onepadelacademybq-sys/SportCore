-- Migration: Replace 4-block session structure with 3-block structure
-- Old: calentamiento (15) | central_1_defensa (30) | central_2_ataque (30) | vuelta_a_la_calma (15)
-- New: calentamiento (10) | central (35) | vuelta_a_la_calma (15)
--
-- Idempotent: safe to re-run if a previous attempt failed partway.

-- Step 1: Clean up any leftover from a previous failed run
DROP TYPE IF EXISTS "SessionBlockType_new";

-- Step 2: Delete central_2_ataque blocks (cascade removes session_block_exercises too)
DELETE FROM session_blocks WHERE block_type = 'central_2_ataque';

-- Step 3: Create new enum with 3 values
CREATE TYPE "SessionBlockType_new" AS ENUM ('calentamiento', 'central', 'vuelta_a_la_calma');

-- Step 4: Migrate column — map central_1_defensa → central, keep the rest
ALTER TABLE session_blocks
  ALTER COLUMN block_type TYPE "SessionBlockType_new"
  USING CASE block_type::text
    WHEN 'central_1_defensa' THEN 'central'::"SessionBlockType_new"
    ELSE block_type::text::"SessionBlockType_new"
  END;

-- Step 5: Update durations to the new fixed values
UPDATE session_blocks SET duration_min = 10 WHERE block_type = 'calentamiento';
UPDATE session_blocks SET duration_min = 35 WHERE block_type = 'central';
UPDATE session_blocks SET duration_min = 15 WHERE block_type = 'vuelta_a_la_calma';

-- Step 6: Swap enum types
DROP TYPE "SessionBlockType";
ALTER TYPE "SessionBlockType_new" RENAME TO "SessionBlockType";
