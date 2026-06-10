-- ================================================================
-- Trigger: on_auth_user_created
-- Crea un perfil en `profiles` automáticamente cada vez que
-- un nuevo usuario se registra en auth.users.
--
-- Aplica en: Supabase → SQL Editor (o psql $DIRECT_URL)
--
-- Nota: el role por defecto es 'player'. El admin debe cambiar
-- el rol manualmente desde el panel si corresponde.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _full_name text;
  _avatar    text;
BEGIN
  -- Extraer metadatos del usuario si vienen de OAuth o del formulario
  _full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  _avatar := NEW.raw_user_meta_data ->> 'avatar_url';

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar,
    'player',      -- rol por defecto
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotente si el perfil ya existe

  RETURN NEW;
END;
$$;

-- Eliminar el trigger si ya existía para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
