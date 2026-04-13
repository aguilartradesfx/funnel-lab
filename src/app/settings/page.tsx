export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, planResult, creditLogResult] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    supabase.from('user_plans').select('*').eq('user_id', user.id).single(),
    supabase
      .from('credit_usage_log')
      .select('action, credits_consumed, source, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email ?? '',
        name: profileResult.data?.full_name ?? '',
        avatarUrl: profileResult.data?.avatar_url ?? '',
      }}
      plan={planResult.data ?? { plan: 'pro', monthly_credits_total: 150, monthly_credits_used: 0, pack_credits: 0 }}
      creditLog={creditLogResult.data ?? []}
    />
  )
}
