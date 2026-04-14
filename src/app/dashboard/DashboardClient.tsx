'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Copy,
  FolderOpen, LogOut, Settings, Zap, ChevronRight, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
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

const PLAN_LIMITS: Record<string, { projects: number; scenarios: number; label: string; color: string }> = {
  starter: { projects: 3, scenarios: 1, label: 'Starter', color: 'text-slate-400' },
  pro:     { projects: 10, scenarios: 4, label: 'Pro', color: 'text-orange-400' },
  max:     { projects: Infinity, scenarios: Infinity, label: 'Max', color: 'text-purple-400' },
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size = 8 }: { name: string; avatarUrl: string; size?: number }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={cn(`w-${size} h-${size} rounded-full object-cover`)} />
  }
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={cn(`w-${size} h-${size} rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0`)}>
      {initials || 'U'}
    </div>
  )
}

// ─── NewProjectModal ──────────────────────────────────────────────────────────

function NewProjectModal({
  onClose,
  onCreated,
  userId,
  canCreate,
}: {
  onClose: () => void
  onCreated: (p: Project) => void
  userId: string
  canCreate: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const { data: project, error: pErr } = await supabase
        .from('projects')
        .insert({ owner_id: userId, title: title.trim(), description: description.trim() || null })
        .select()
        .single()
      if (pErr || !project) throw pErr

      // Crear escenario principal
      await supabase.from('scenarios').insert({
        project_id: project.id,
        name: 'Escenario principal',
        is_default: true,
        canvas_state: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      })

      onCreated(project as Project)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111111] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Nuevo proyecto</h2>
        <p className="text-slate-400 text-sm mb-5">Creá un funnel para un cliente o negocio.</p>

        {!canCreate && (
          <div className="mb-4 px-3.5 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm">
            Llegaste al límite de proyectos de tu plan. Hacé upgrade para crear más.
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">Nombre del proyecto *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              disabled={!canCreate}
              placeholder="Ej: Funnel de producto digital"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
                'text-slate-100 text-sm placeholder:text-slate-600',
                'focus:outline-none focus:border-orange-500 transition-colors',
                'disabled:opacity-50'
              )}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canCreate}
              placeholder="Para qué sirve este funnel..."
              rows={2}
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e] resize-none',
                'text-slate-100 text-sm placeholder:text-slate-600',
                'focus:outline-none focus:border-orange-500 transition-colors',
                'disabled:opacity-50'
              )}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2e2e2e] text-slate-400 text-sm hover:border-slate-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !canCreate || !title.trim()}
              className={cn(
                'flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500',
                'text-white text-sm font-semibold transition-all',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onOpen,
  onRename,
  onDelete,
}: {
  project: Project
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    if (days < 7) return `Hace ${days} días`
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      onClick={onOpen}
      className={cn(
        'group relative bg-[#111111] border border-[#2e2e2e] rounded-2xl p-5',
        'hover:border-[#3e3e4e] hover:bg-[#141414] transition-all cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-white">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{project.description}</p>
          )}
          <p className="text-xs text-slate-600 mt-1.5">{formatDate(project.updated_at)}</p>
        </div>

        {/* Menu */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 w-36 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => { onRename(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  <Pencil size={12} /> Renombrar
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        size={14}
        className="absolute bottom-4 right-4 text-slate-600 group-hover:text-orange-400 transition-colors"
      />
    </div>
  )
}

// ─── RenameModal ──────────────────────────────────────────────────────────────

function RenameModal({
  project,
  onClose,
  onRenamed,
}: {
  project: Project
  onClose: () => void
  onRenamed: (title: string) => void
}) {
  const [title, setTitle] = useState(project.title)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await supabase.from('projects').update({ title: title.trim() }).eq('id', project.id)
    onRenamed(title.trim())
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111111] border border-[#2e2e2e] rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white mb-4">Renombrar proyecto</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
              'text-slate-100 text-sm focus:outline-none focus:border-orange-500 transition-colors'
            )}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#2e2e2e] text-slate-400 text-sm hover:border-slate-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all disabled:opacity-40">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DashboardClient ──────────────────────────────────────────────────────────

export default function DashboardClient({
  user,
  initialProjects,
  plan,
}: {
  user: UserInfo
  initialProjects: Project[]
  plan: PlanInfo
}) {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [renaming, setRenaming] = useState<Project | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const planInfo = PLAN_LIMITS[plan.plan] ?? PLAN_LIMITS.starter
  const creditsLeft = (plan.monthly_credits_total - plan.monthly_credits_used) + plan.pack_credits
  const canCreate = plan.plan === 'max' || projects.length < planInfo.projects

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDelete = async (project: Project) => {
    if (!confirm(`¿Eliminar "${project.title}"? Se perderán todos sus escenarios.`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    setProjects(prev => prev.filter(p => p.id !== project.id))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* Header */}
      <header className="h-14 bg-[#0f0f0f] border-b border-[#2e2e2e] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="FunnelLab"
            className="h-7 w-auto"
          />
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={7} />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
              <p className={cn('text-[10px] font-medium', planInfo.color)}>Plan {planInfo.label}</p>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-12 w-52 bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl shadow-2xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2e2e2e]">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <span className={cn('text-[11px] font-medium mt-0.5 block', planInfo.color)}>
                    Plan {planInfo.label} · {creditsLeft} créditos
                  </span>
                </div>
                <button
                  onClick={() => { router.push('/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  <Settings size={14} /> Configuración
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Mis proyectos</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {projects.length} de {plan.plan === 'agency' ? '∞' : planInfo.projects} proyectos
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className={cn(
                  'pl-8 pr-3.5 py-2 rounded-xl bg-[#111111] border border-[#2e2e2e]',
                  'text-slate-200 text-sm placeholder:text-slate-600',
                  'focus:outline-none focus:border-slate-500 transition-colors w-44'
                )}
              />
            </div>

            {/* New project */}
            <button
              onClick={() => setShowNew(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl',
                'bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold',
                'transition-all shadow-sm shadow-orange-950/50'
              )}
            >
              <Plus size={15} />
              Nuevo proyecto
            </button>
          </div>
        </div>

        {/* Credits banner */}
        {creditsLeft <= 10 && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-sm text-orange-300">
            <Zap size={15} className="flex-shrink-0" />
            <span>
              Te quedan <strong>{creditsLeft} créditos</strong> de IA.{' '}
              <button onClick={() => router.push('/pricing')} className="underline hover:text-orange-200">Comprar más</button>
            </span>
          </div>
        )}

        {/* Projects grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#2e2e2e] flex items-center justify-center mb-4">
              <FolderOpen size={24} className="text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-300 mb-1">
              {search ? 'Sin resultados' : 'Aún no tenés proyectos'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {search ? 'Probá con otro nombre.' : 'Creá tu primer funnel y empezá a simular.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all"
              >
                <Plus size={14} />
                Crear mi primer proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => router.push(`/project/${project.id}`)}
                onRename={() => setRenaming(project)}
                onDelete={() => handleDelete(project)}
              />
            ))}
          </div>
        )}
      </main>

      {showNew && (
        <NewProjectModal
          userId={user.id}
          canCreate={canCreate}
          onClose={() => setShowNew(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}

      {renaming && (
        <RenameModal
          project={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={title => setProjects(prev =>
            prev.map(p => p.id === renaming.id ? { ...p, title } : p)
          )}
        />
      )}
    </div>
  )
}
