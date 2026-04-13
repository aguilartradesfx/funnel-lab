import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: plan, error } = await supabase
    .from('user_plans')
    .select('plan, monthly_credits_total, monthly_credits_used, pack_credits, current_period_end')
    .eq('user_id', user.id)
    .single()

  if (error || !plan) {
    return Response.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  const creditsLeft = Math.max(0, plan.monthly_credits_total - plan.monthly_credits_used) + plan.pack_credits

  return Response.json({
    plan: plan.plan,
    monthly_credits_total: plan.monthly_credits_total,
    monthly_credits_used: plan.monthly_credits_used,
    pack_credits: plan.pack_credits,
    credits_left: creditsLeft,
    period_end: plan.current_period_end,
  })
}
