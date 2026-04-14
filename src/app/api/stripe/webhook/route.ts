import { NextRequest } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/** Extrae el subscription ID de un Invoice (API 2026-03-25.dahlia) */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

/** Extrae las fechas de período de una suscripción (ahora están en el item) */
function getSubPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0]
  return {
    start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
    end:   item ? new Date(item.current_period_end   * 1000).toISOString() : null,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return Response.json({ error: 'Sin firma' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const admin = createServiceClient()

  try {
    switch (event.type) {

      // ── Checkout completado ────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        if (session.mode === 'payment') {
          // Pack de créditos
          const credits = parseInt(session.metadata?.credits ?? '250', 10)
          const { data: plan } = await admin
            .from('user_plans')
            .select('pack_credits')
            .eq('user_id', userId)
            .single()

          await admin.from('user_plans')
            .update({ pack_credits: (plan?.pack_credits ?? 0) + credits })
            .eq('user_id', userId)

          await admin.from('credit_pack_purchases').insert({
            user_id: userId,
            pack_size: credits,
            price: (session.amount_total ?? 0) / 100,
            credits_granted: credits,
            payment_id: session.payment_intent as string,
          })

        } else if (session.mode === 'subscription' && session.subscription) {
          // Guardar stripe_customer_id y marcar trial si aplica
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const hadTrial = subscription.status === 'trialing'

          await admin.from('user_plans')
            .update({
              stripe_customer_id: session.customer as string,
              ...(hadTrial ? { has_had_trial: true } : {}),
            })
            .eq('user_id', userId)
        }
        break
      }

      // ── Suscripción creada ─────────────────────────────────────────────────
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id
        const planInfo = PRICE_TO_PLAN[priceId]
        if (!planInfo) break

        const { data: userPlan } = await admin
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userPlan) break

        const period = getSubPeriod(sub)
        await admin.from('user_plans').update({
          plan: planInfo.plan,
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          monthly_credits_total: planInfo.credits,
          monthly_credits_used: 0,
          ...(period.start ? { current_period_start: period.start } : {}),
          ...(period.end   ? { current_period_end:   period.end   } : {}),
        }).eq('user_id', userPlan.user_id)
        break
      }

      // ── Suscripción actualizada (upgrade/downgrade) ────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id
        const planInfo = PRICE_TO_PLAN[priceId]
        if (!planInfo) break

        const { data: userPlan } = await admin
          .from('user_plans')
          .select('user_id, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userPlan) break

        const planChanged = userPlan.plan !== planInfo.plan
        const isUpgrade = planInfo.credits > 0
        const period = getSubPeriod(sub)

        await admin.from('user_plans').update({
          plan: planInfo.plan,
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          monthly_credits_total: planInfo.credits,
          ...(planChanged && isUpgrade ? { monthly_credits_used: 0 } : {}),
          ...(period.start ? { current_period_start: period.start } : {}),
          ...(period.end   ? { current_period_end:   period.end   } : {}),
        }).eq('user_id', userPlan.user_id)
        break
      }

      // ── Suscripción cancelada ──────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: userPlan } = await admin
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userPlan) break

        await admin.from('user_plans').update({
          plan: 'starter',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          monthly_credits_total: 0,
          monthly_credits_used: 0,
        }).eq('user_id', userPlan.user_id)
        break
      }

      // ── Pago de factura exitoso (renovación mensual) ───────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break

        const subscriptionId = getInvoiceSubscriptionId(invoice)
        const customerId = invoice.customer as string
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const period = getSubPeriod(sub)

        const { data: userPlan } = await admin
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userPlan) break

        await admin.from('user_plans').update({
          monthly_credits_used: 0,
          subscription_status: 'active',
          ...(period.start ? { current_period_start: period.start } : {}),
          ...(period.end   ? { current_period_end:   period.end   } : {}),
        }).eq('user_id', userPlan.user_id)
        break
      }

      // ── Pago fallido ───────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: userPlan } = await admin
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userPlan) break

        await admin.from('user_plans').update({
          subscription_status: 'past_due',
        }).eq('user_id', userPlan.user_id)
        break
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Error procesando evento:', event.type, err)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }

  return Response.json({ received: true })
}
