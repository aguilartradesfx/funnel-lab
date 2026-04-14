import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

  const { newPriceId } = await request.json()
  if (!newPriceId) return Response.json({ error: 'Falta newPriceId' }, { status: 400 })

  const admin = createServiceClient()

  const { data: plan } = await admin
    .from('user_plans')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!plan?.stripe_subscription_id) {
    return Response.json({ error: 'No hay suscripción activa' }, { status: 400 })
  }

  // Obtener el item actual de la suscripción
  const subscription = await stripe.subscriptions.retrieve(plan.stripe_subscription_id)
  const itemId = subscription.items.data[0]?.id

  if (!itemId) {
    return Response.json({ error: 'No se encontró el ítem de suscripción' }, { status: 400 })
  }

  // Actualizar con proration
  await stripe.subscriptions.update(plan.stripe_subscription_id, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
  })

  return Response.json({ success: true })
}
