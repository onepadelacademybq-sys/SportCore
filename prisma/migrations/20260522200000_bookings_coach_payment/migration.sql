-- Add 'paid' state: player uploaded proof, waiting for admin verification
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'paid';

-- court_id becomes nullable — the player only chooses a coach;
-- the admin assigns the court when confirming the booking
ALTER TABLE "bookings" ALTER COLUMN "court_id" DROP NOT NULL;

-- coach_id: booking priority is coach availability, not court availability
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "coach_id" UUID REFERENCES "profiles"("id") ON DELETE SET NULL;

-- payment_proof_url: player uploads a link to their payment evidence
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "payment_proof_url" TEXT;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS "bookings_coach_id_idx"  ON "bookings"("coach_id");
CREATE INDEX IF NOT EXISTS "bookings_status_idx"    ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_player_id_idx" ON "bookings"("player_id");
