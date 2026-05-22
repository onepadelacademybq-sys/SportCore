-- Trigger function: keeps updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add DEFAULT NOW() so Supabase client inserts work without providing the value
ALTER TABLE "profiles"                  ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "courts"                    ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "equipment"                 ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "bookings"                  ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "exercises"                 ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "mesocycles"                ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "microcycles"               ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "training_sessions"         ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "session_blocks"            ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "training_groups"           ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "evaluation_templates"      ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "evaluations"               ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "tournaments"               ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "tournament_matches"        ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "payments"                  ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "subscriptions"             ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "notification_preferences"  ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "academy_settings"          ALTER COLUMN "updated_at" SET DEFAULT NOW();
ALTER TABLE "coach_profiles"            ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Attach trigger to each table
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "profiles"                 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "courts"                   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "equipment"                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "bookings"                 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "exercises"                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "mesocycles"               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "microcycles"              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "training_sessions"        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "session_blocks"           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "training_groups"          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "evaluation_templates"     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "evaluations"              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "tournaments"              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "tournament_matches"       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "payments"                 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "subscriptions"            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "notification_preferences" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "academy_settings"         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON "coach_profiles"           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
