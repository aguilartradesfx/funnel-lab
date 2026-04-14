-- ============================================================
-- FunnelLab — Migración 006: Trigger handle_new_user robusto
-- ============================================================
-- Razón: la migración 005 reemplazó el trigger de la 003 y:
--   1. Eliminó el INSERT en user_plans (nuevos usuarios no tienen plan)
--   2. Insertaba en columnas que podrían no existir (last_name, auth_provider)
--      si la ALTER TABLE no corrió limpiamente → "Database error saving new user"
--   3. No tenía manejo de errores → cualquier falla bloqueaba la creación del usuario
--
-- Esta migración:
--   - Asegura que las columnas existan
--   - Reescribe el trigger con EXCEPTION WHEN OTHERS → nunca bloquea el alta
--   - Restaura el INSERT en user_plans
-- ============================================================

-- 1. Columnas de profiles (idempotente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone               text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_size           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry            text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider       text    DEFAULT 'email';

-- 2. Trigger robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  text;
  v_first_name text;
  v_last_name  text;
  v_provider   text;
  v_space_pos  int;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  v_space_pos := POSITION(' ' IN TRIM(v_full_name));
  IF v_space_pos > 0 THEN
    v_first_name := TRIM(SUBSTRING(v_full_name FROM 1 FOR v_space_pos));
    v_last_name  := TRIM(SUBSTRING(v_full_name FROM v_space_pos + 1));
  ELSE
    v_first_name := TRIM(v_full_name);
    v_last_name  := '';
  END IF;

  -- Perfil
  INSERT INTO public.profiles (id, full_name, last_name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    v_provider
  )
  ON CONFLICT (id) DO NOTHING;

  -- Plan inicial (starter, 0 créditos)
  INSERT INTO public.user_plans (
    user_id,
    plan,
    monthly_credits_total,
    monthly_credits_used,
    pack_credits,
    subscription_status,
    has_had_trial,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    'starter',
    0,
    0,
    0,
    'inactive',
    false,
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Nunca bloquear la creación del usuario por un error en el trigger.
    -- El perfil se puede completar en el onboarding.
    RAISE WARNING 'handle_new_user: error para usuario % → %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
