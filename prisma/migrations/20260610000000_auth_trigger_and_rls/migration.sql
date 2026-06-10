-- ─── Migration: 20260610000000_auth_trigger_and_rls ────────────────────────────
--
-- 1. Trigger on_auth_user_created — crea el perfil automáticamente
--    cuando Supabase inserta una fila en auth.users.
--    Acepta metadata opcional: full_name, phone, document_id,
--    date_of_birth, address.
--    ON CONFLICT (id) DO NOTHING garantiza idempotencia.
--
-- 2. RLS global — habilitar Row Level Security en todas las tablas
--    principales y añadir políticas básicas (service role bypass).
--
-- ⚠  Aplicar manualmente vía:
--    psql $DIRECT_URL -f prisma/migrations/20260610000000_auth_trigger_and_rls/migration.sql
-- ────────────────────────────────────────────────────────────────────────────────

-- ==============================================================================
-- 1. TRIGGER on_auth_user_created
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    document_id,
    date_of_birth,
    address,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'document_id',
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
    NEW.raw_user_meta_data->>'address',
    'player'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe y volver a crear
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 2. RLS — Row Level Security
-- ==============================================================================
-- Estrategia: service_role bypassa RLS (usado por Prisma / Server Actions).
-- Las políticas permiten a los usuarios leer/modificar solo sus propios datos.
-- Los admins tienen acceso total via service_role.

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: service role bypass"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "profiles: user reads own row"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: user updates own row"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings: service role bypass"
  ON bookings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "bookings: player reads own"
  ON bookings FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "bookings: player inserts own"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "bookings: player updates own pending"
  ON bookings FOR UPDATE
  USING (auth.uid() = player_id AND status IN ('pending', 'payment_pending'));

-- wallet_balances
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_balances: service role bypass"
  ON wallet_balances FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "wallet_balances: player reads own"
  ON wallet_balances FOR SELECT
  USING (auth.uid() = player_id);

-- wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_transactions: service role bypass"
  ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "wallet_transactions: player reads own"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = player_id);

-- group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members: service role bypass"
  ON group_members FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "group_members: player reads own"
  ON group_members FOR SELECT
  USING (auth.uid() = player_id);

-- evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations: service role bypass"
  ON evaluations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "evaluations: player reads own"
  ON evaluations FOR SELECT
  USING (auth.uid() = player_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: service role bypass"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "notifications: user reads own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: user updates own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- financial_transactions (admin only via service_role)
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_transactions: service role bypass"
  ON financial_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- training_plans
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plans: service role bypass"
  ON training_plans FOR ALL
  USING (auth.role() = 'service_role');

-- exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises: service role bypass"
  ON exercises FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "exercises: authenticated read"
  ON exercises FOR SELECT
  USING (auth.role() = 'authenticated');

-- tournament_entries
ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_entries: service role bypass"
  ON tournament_entries FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "tournament_entries: authenticated read"
  ON tournament_entries FOR SELECT
  USING (auth.role() = 'authenticated');

-- tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments: service role bypass"
  ON tournaments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "tournaments: authenticated read"
  ON tournaments FOR SELECT
  USING (auth.role() = 'authenticated');

-- contact_messages (solo insert público, lectura solo service_role)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages: service role bypass"
  ON contact_messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "contact_messages: public insert"
  ON contact_messages FOR INSERT
  WITH CHECK (true);
