'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useFunnelStore } from '@/stores/funnelStore'
import { createClient } from '@/lib/supabase/client'
import FunnelEditor from '@/components/FunnelEditor'
import { Monitor } from 'lucide-react'

interface Scenario {
  id: string
  name: string
  is_default: boolean
  canvas_state: Record<string, unknown> | null
}

interface UserInfo {
  id: string
  email: string
  name: string
  avatarUrl: string
}

interface PlanInfo {
  plan: string
  monthly_credits_total: number
  monthly_credits_used: number
  pack_credits: number
}

interface Props {
  projectId: string
  projectTitle: string
  scenarios: Scenario[]
  activeScenarioId: string | null
  user: UserInfo
  plan: PlanInfo
}

const AUTOSAVE_DELAY = 2500

export default function ProjectEditorClient({
  projectId,
  projectTitle,
  scenarios,
  activeScenarioId,
  user,
  plan,
}: Props) {
  const supabase = createClient()
  const loadProject = useFunnelStore(s => s.loadProject)
  const setProjectName = useFunnelStore(s => s.setProjectName)
  const setSupabaseContext = useFunnelStore(s => s.setSupabaseContext)
  const setSaveStatus = useFunnelStore(s => s.setSaveStatus)
  const exportProject = useFunnelStore(s => s.exportProject)
  const nodes = useFunnelStore(s => s.nodes)
  const edges = useFunnelStore(s => s.edges)
  const products = useFunnelStore(s => s.products)

  const [scenarioList, setScenarioList] = useState<Scenario[]>(scenarios)
  const [activeScenario, setActiveScenario] = useState<string | null>(activeScenarioId)
  const [isMobile, setIsMobile] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstLoad = useRef(true)

  // Detectar mobile (< 1024px) y bloquear acceso al editor
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Cargar escenario activo en el store
  const loadScenario = useCallback((scenario: Scenario | undefined) => {
    if (!scenario) return
    const cs = scenario.canvas_state as {
      nodes?: unknown[]
      edges?: unknown[]
      products?: unknown[]
    } | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadProject({
      id: projectId,
      name: projectTitle,
      description: '',
      createdAt: '',
      updatedAt: '',
      nodes: (cs?.nodes ?? []) as any,
      edges: (cs?.edges ?? []) as any,
      products: (cs?.products ?? []) as any,
    })
  }, [loadProject, projectId, projectTitle])

  // Inicialización
  useEffect(() => {
    const scenario = scenarioList.find(s => s.id === activeScenario)
    loadScenario(scenario)
    setProjectName(projectTitle)
    if (activeScenario) {
      setSupabaseContext(projectId, activeScenario)
    }
    isFirstLoad.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save: disparar después de cambios en nodes/edges/products
  useEffect(() => {
    if (isFirstLoad.current || !activeScenario) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')

    saveTimerRef.current = setTimeout(async () => {
      const project = exportProject()
      const canvasState = {
        nodes: project.nodes,
        edges: project.edges,
        products: project.products ?? [],
      }

      const { error } = await supabase
        .from('scenarios')
        .update({ canvas_state: canvasState })
        .eq('id', activeScenario)

      setSaveStatus(error ? 'error' : 'saved')

      // Actualizar updated_at del proyecto
      if (!error) {
        await supabase
          .from('projects')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', projectId)
      }
    }, AUTOSAVE_DELAY)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, products])

  // Cambiar de escenario
  const switchScenario = useCallback(async (scenarioId: string) => {
    if (scenarioId === activeScenario) return

    // Guardar escenario actual antes de cambiar
    if (activeScenario) {
      const project = exportProject()
      await supabase.from('scenarios').update({
        canvas_state: {
          nodes: project.nodes,
          edges: project.edges,
          products: project.products ?? [],
        },
      }).eq('id', activeScenario)
    }

    setActiveScenario(scenarioId)
    setSupabaseContext(projectId, scenarioId)

    const scenario = scenarioList.find(s => s.id === scenarioId)
    if (scenario) {
      isFirstLoad.current = true
      loadScenario(scenario)
      // Pequeño delay para que el flag se resetee después del useEffect
      setTimeout(() => { isFirstLoad.current = false }, 100)
    }
  }, [activeScenario, exportProject, loadScenario, projectId, scenarioList, setSupabaseContext, supabase])

  // Crear escenario
  const createScenario = useCallback(async (name: string) => {
    const { data } = await supabase.from('scenarios').insert({
      project_id: projectId,
      name,
      is_default: false,
      canvas_state: { nodes: [], edges: [], products: [] },
    }).select().single()
    if (data) {
      setScenarioList(prev => [...prev, data as Scenario])
      await switchScenario(data.id)
    }
  }, [projectId, supabase, switchScenario])

  // Renombrar escenario
  const renameScenario = useCallback(async (scenarioId: string, name: string) => {
    await supabase.from('scenarios').update({ name }).eq('id', scenarioId)
    setScenarioList(prev => prev.map(s => s.id === scenarioId ? { ...s, name } : s))
  }, [supabase])

  // Eliminar escenario
  const deleteScenario = useCallback(async (scenarioId: string) => {
    if (scenarioList.length <= 1) return
    await supabase.from('scenarios').delete().eq('id', scenarioId)
    const remaining = scenarioList.filter(s => s.id !== scenarioId)
    setScenarioList(remaining)
    if (activeScenario === scenarioId) {
      await switchScenario(remaining[0].id)
    }
  }, [activeScenario, scenarioList, supabase, switchScenario])

  if (isMobile) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6"
        style={{ backgroundColor: '#111111' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.15)' }}
        >
          <Monitor size={30} className="text-orange-400" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="text-white font-bold text-xl leading-tight">
            Solo disponible en computadora
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            El editor de funnels requiere una pantalla más grande para funcionar correctamente.
            Abrilo desde tu laptop o PC para acceder a todas las funciones.
          </p>
        </div>

        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
        >
          ← Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <FunnelEditor
      projectId={projectId}
      scenarios={scenarioList}
      activeScenarioId={activeScenario}
      onSwitchScenario={switchScenario}
      onCreateScenario={createScenario}
      onRenameScenario={renameScenario}
      onDeleteScenario={deleteScenario}
      user={user}
      plan={plan}
    />
  )
}
