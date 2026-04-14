import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, APP_URL } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createServiceClient()

  const { data: plan } = await admin
    .from('user_plans')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!plan?.stripe_customer_id) {
    return Response.json({ error: 'No tenés una suscripción activa para administrar' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: plan.stripe_customer_id,
    return_url: `${APP_URL}/dashboard`,
  })

  return Response.json({ url: session.url })
}
