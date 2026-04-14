-- ============================================================
-- FunnelLab — Migración 003: Integración Stripe
-- Ejecutar DESPUÉS de 002_auth_plans.sql
-- ============================================================

-- ── Agregar columnas de Stripe a user_plans ───────────────────
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_customer_id      text;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_subscription_id  text;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS subscription_status     text DEFAULT 'inactive';
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS has_had_trial           boolean DEFAULT false;

-- ── Actualizar constraint para incluir plan 'max' ─────────────
ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_check;
ALTER TABLE user_plans ADD CONSTRAINT user_plans_plan_check
  CHECK (plan IN ('starter', 'pro', 'max'));

-- ── Migrar usuarios existentes con plan 'agency' → 'max' ──────
UPDATE user_plans SET plan = 'max' WHERE plan = 'agency';

-- ── Índice para búsqueda por stripe_customer_id ───────────────
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_customer
  ON user_plans (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── Cambiar usuarios de testing (pro) a starter ───────────────
-- Descomenta si querés resetear los usuarios actuales:
-- UPDATE user_plans SET plan = 'starter', monthly_credits_total = 0 WHERE plan = 'pro';

-- ── Actualizar trigger: nuevos usuarios arrancan con 'starter' ─
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Crear perfil
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Crear plan inicial: Starter con 0 créditos
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
