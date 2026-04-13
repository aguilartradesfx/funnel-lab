import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  suggestions: 2,
  analyze: 3,
  summary: 3,
  generate_funnel: 5,
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { action, metadata } = await request.json()
  const cost = CREDIT_COSTS[action]
  if (!cost) {
    return Response.json({ error: 'Acción desconocida' }, { status: 400 })
  }

  // Usar service role para operaciones atómicas sin restricciones de RLS
  const admin = createServiceClient()

  const { data: plan, error: planErr } = await admin
    .from('user_plans')
    .select('id, monthly_credits_total, monthly_credits_used, pack_credits')
    .eq('user_id', user.id)
    .single()

  if (planErr || !plan) {
    return Response.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  const monthlyLeft = plan.monthly_credits_total - plan.monthly_credits_used
  const totalLeft = Math.max(0, monthlyLeft) + plan.pack_credits

  if (totalLeft < cost) {
    return Response.json({ error: 'Créditos insuficientes', credits_left: totalLeft }, { status: 402 })
  }

  // Consumir primero créditos mensuales, luego pack
  let newMonthlyUsed = plan.monthly_credits_used
  let newPackCredits = plan.pack_credits
  let source: 'monthly' | 'pack' = 'monthly'
  let remaining = cost

  if (monthlyLeft > 0) {
    const fromMonthly = Math.min(remaining, monthlyLeft)
    newMonthlyUsed += fromMonthly
    remaining -= fromMonthly
  }
  if (remaining > 0 && newPackCredits > 0) {
    const fromPack = Math.min(remaining, newPackCredits)
    newPackCredits -= fromPack
    remaining -= fromPack
    source = monthlyLeft > 0 ? 'monthly' : 'pack'
  }

  // Actualizar plan
  const { error: updateErr } = await admin
    .from('user_plans')
    .update({ monthly_credits_used: newMonthlyUsed, pack_credits: newPackCredits })
    .eq('user_id', user.id)

  if (updateErr) {
    return Response.json({ error: 'Error al consumir créditos' }, { status: 500 })
  }

  // Registrar en historial
  await admin.from('credit_usage_log').insert({
    user_id: user.id,
    action,
    credits_consumed: cost,
    source,
    metadata: metadata ?? {},
  })

  const newLeft = Math.max(0, plan.monthly_credits_total - newMonthlyUsed) + newPackCredits

  return Response.json({ success: true, credits_consumed: cost, credits_left: newLeft })
}
