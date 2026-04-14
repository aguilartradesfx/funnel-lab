import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Planes y precios — FunnelLab',
  description: 'Elegí el plan ideal para tu negocio. Desde $6.99/mes. Simulá funnels, usá IA para optimizar, y colaborá con tu equipo. 7 días de prueba gratis.',
  alternates: {
    canonical: 'https://funnellabs.bralto.io/pricing',
  },
  openGraph: {
    url: 'https://funnellabs.bralto.io/pricing',
    title: 'Planes y precios — FunnelLab',
    description: 'Elegí el plan ideal para tu negocio. Desde $6.99/mes. Simulá funnels, usá IA para optimizar, y colaborá con tu equipo. 7 días de prueba gratis.',
  },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan: string | null = null
  let hasSubscription = false

  if (user) {
    const { data: plan } = await supabase
      .from('user_plans')
      .select('plan, stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    currentPlan = plan?.plan ?? null
    hasSubscription = !!plan?.stripe_subscription_id
  }

  return (
    <PricingClient
      userId={user?.id ?? null}
      currentPlan={currentPlan}
      hasSubscription={hasSubscription}
    />
  )
}
