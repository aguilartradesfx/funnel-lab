export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProjectEditorClient from './ProjectEditorClient'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, owner_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, name, is_default, canvas_state')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const scenarioList = scenarios ?? []
  const defaultScenario = scenarioList.find(s => s.is_default) ?? scenarioList[0]

  const planResult = await supabase
    .from('user_plans')
    .select('plan, monthly_credits_total, monthly_credits_used, pack_credits')
    .eq('user_id', user.id)
    .single()

  const profileResult = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <ProjectEditorClient
      projectId={project.id}
      projectTitle={project.title}
      scenarios={scenarioList}
      activeScenarioId={defaultScenario?.id ?? null}
      user={{
        id: user.id,
        email: user.email ?? '',
        name: profileResult.data?.full_name ?? user.email?.split('@')[0] ?? 'Usuario',
        avatarUrl: profileResult.data?.avatar_url ?? '',
      }}
      plan={planResult.data ?? { plan: 'pro', monthly_credits_total: 150, monthly_credits_used: 0, pack_credits: 0 }}
    />
  )
}
