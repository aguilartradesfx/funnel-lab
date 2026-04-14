import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getStripe, PRICES, PRICE_TO_PLAN, APP_URL } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return Response.json({ error: 'Falta priceId' }, { status: 400 })

  const admin = createServiceClient()

  // Obtener email y plan actual del usuario
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: plan } = await admin
    .from('user_plans')
    .select('stripe_customer_id, has_had_trial, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  // Obtener o crear Stripe Customer
  let stripeCustomerId: string = plan?.stripe_customer_id ?? ''

  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: user.email!,
      name: profile?.full_name ?? undefined,
      metadata: { userId: user.id },
    })
    stripeCustomerId = customer.id
    await admin.from('user_plans').update({ stripe_customer_id: stripeCustomerId }).eq('user_id', user.id)
  }

  const isCreditPack = priceId === PRICES.credit_pack
  const planInfo = PRICE_TO_PLAN[priceId]

  if (isCreditPack) {
    // Pack de créditos — pago único
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
      metadata: { userId: user.id, type: 'credit_pack', credits: '250' },
    })
    return Response.json({ url: session.url })
  }

  // Suscripción — dar trial solo si nunca tuvo uno
  const givesTrial = !plan?.has_had_trial && !plan?.stripe_subscription_id

  const session = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    ...(givesTrial && {
      subscription_data: { trial_period_days: 7 },
    }),
    success_url: `${APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: {
      userId: user.id,
      plan: planInfo?.plan ?? 'starter',
    },
  })

  return Response.json({ url: session.url })
}
