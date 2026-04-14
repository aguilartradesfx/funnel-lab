import { createClient } from '@/lib/supabase/server'
import PricingClient from './PricingClient'

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
