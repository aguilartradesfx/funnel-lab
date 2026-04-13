export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [projectsResult, planResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, description, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('user_plans')
      .select('plan, monthly_credits_total, monthly_credits_used, pack_credits')
      .eq('user_id', user.id)
      .single(),
  ])

  const profileResult = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email ?? '',
        name: profileResult.data?.full_name ?? user.email?.split('@')[0] ?? 'Usuario',
        avatarUrl: profileResult.data?.avatar_url ?? '',
      }}
      initialProjects={projectsResult.data ?? []}
      plan={planResult.data ?? { plan: 'pro', monthly_credits_total: 150, monthly_credits_used: 0, pack_credits: 0 }}
    />
  )
}
