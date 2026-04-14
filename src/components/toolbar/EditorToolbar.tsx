'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play, Undo2, Redo2, Trash2, LayoutTemplate, Sparkles,
  Download, Upload, ChevronDown, Loader2, Save, Check, HelpCircle,
  Package, ArrowLeft, Settings, LogOut, Plus, Pencil, ChevronRight,
  Cloud, CloudOff, Zap, AlertCircle, LayoutGrid,
} from 'lucide-react'
import { useFunnelStore, useCanUndo, useCanRedo } from '@/stores/funnelStore'
import { useEditorContext } from '@/contexts/EditorContext'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick, title, disabled = false, active = false, variant = 'default', children,
}: {
  onClick?: () => void; title: string; disabled?: boolean; active?: boolean
  variant?: 'default' | 'primary' | 'danger'; children: React.ReactNode
}) {
  const variants = {
    default: 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
    primary: 'text-white bg-orange-600 hover:bg-orange-500 shadow-sm shadow-orange-950/50',
    danger:  'text-slate-400 hover:text-red-400 hover:bg-red-500/10',
  }
  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active ? 'text-orange-400 bg-orange-500/10' : variants[variant]
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-[#2e2e2e]" />
}

// ─── Save indicator ───────────────────────────────────────────────────────────

function SaveIndicator() {
  const saveStatus = useFunnelStore(s => s.saveStatus)
  if (saveStatus === 'idle') return null
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-[11px] font-medium px-2',
      saveStatus === 'saving' && 'text-slate-500',
      saveStatus === 'saved'  && 'text-emerald-500',
      saveStatus === 'error'  && 'text-red-400',
    )}>
      {saveStatus === 'saving' && <><Loader2 size={11} className="animate-spin" /> Guardando…</>}
      {saveStatus === 'saved'  && <><Cloud size={11} /> Guardado</>}
      {saveStatus === 'error'  && <><CloudOff size={11} /> Error al guardar</>}
    </div>
  )
}

// ─── Nombre del proyecto ──────────────────────────────────────────────────────

function ProjectName() {
  const projectName = useFunnelStore(s => s.projectName)
  const setProjectName = useFunnelStore(s => s.setProjectName)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false) }}
          autoFocus
          className="bg-transparent border-b border-orange-500 text-[13px] font-semibold text-slate-100 outline-none w-[180px]"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-[13px] font-semibold text-slate-200 hover:text-white transition-colors max-w-[200px] truncate"
          title="Haz clic para renombrar"
        >
          {projectName}
        </button>
      )}
    </div>
  )
}

// ─── Scenario selector ────────────────────────────────────────────────────────

function ScenarioSelector() {
  const { scenarios, activeScenarioId, onSwitchScenario, onCreateScenario, onRenameScenario, onDeleteScenario, plan } = useEditorContext()
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)

  if (scenarios.length === 0) return null

  const active = scenarios.find(s => s.id === activeScenarioId)
  const maxScenarios = plan?.plan === 'max' ? Infinity : plan?.plan === 'pro' ? 4 : 1
  const canAdd = scenarios.length < maxScenarios

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
          'text-slate-300 hover:text-slate-100 hover:bg-slate-700/60 border border-[#2e2e2e]'
        )}
      >
        <span className="max-w-[120px] truncate">{active?.name ?? 'Escenario'}</span>
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setShowNew(false) }} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl shadow-2xl z-40 overflow-hidden">
            {scenarios.map(s => (
              <div key={s.id} className="flex items-center group">
                {renaming === s.id ? (
                  <form
                    className="flex-1 px-3 py-1.5"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await onRenameScenario(s.id, renameValue)
                      setRenaming(null)
                    }}
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => setRenaming(null)}
                      className="w-full bg-[#0f0f0f] border border-orange-500 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => { onSwitchScenario(s.id); setOpen(false) }}
                    className={cn(
                      'flex-1 text-left px-3 py-2 text-xs transition-colors',
                      s.id === activeScenarioId
                        ? 'text-orange-400 bg-orange-500/10 font-semibold'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    )}
                  >
                    {s.name}
                  </button>
                )}
                {renaming !== s.id && (
                  <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setRenaming(s.id); setRenameValue(s.name) }}
                      className="p-1 rounded text-slate-500 hover:text-slate-300"
                    >
                      <Pencil size={10} />
                    </button>
                    {scenarios.length > 1 && (
                      <button
                        onClick={async () => { await onDeleteScenario(s.id); setOpen(false) }}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-[#2e2e2e]">
              {showNew ? (
                <form
                  className="px-3 py-2 flex items-center gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (newName.trim()) {
                      await onCreateScenario(newName.trim())
                      setNewName('')
                      setShowNew(false)
                      setOpen(false)
                    }
                  }}
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Nombre..."
                    className="flex-1 bg-[#0f0f0f] border border-orange-500 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none"
                  />
                  <button type="submit" className="text-xs text-orange-400 font-semibold">
                    <Check size={12} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => canAdd ? setShowNew(true) : undefined}
                  disabled={!canAdd}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={11} />
                  {canAdd ? 'Nuevo escenario' : `Límite del plan (${maxScenarios})`}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Credits badge ────────────────────────────────────────────────────────────

function CreditsBadge() {
  const { plan } = useEditorContext()
  if (!plan) return null

  const creditsLeft = Math.max(0, plan.monthly_credits_total - plan.monthly_credits_used) + plan.pack_credits
  const isLow = creditsLeft <= 10

  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium',
      isLow
        ? 'text-red-400 bg-red-500/10 border border-red-500/20'
        : 'text-slate-400'
    )}>
      <Zap size={11} className={isLow ? 'text-red-400' : 'text-orange-400'} />
      <span>{creditsLeft}</span>
    </div>
  )
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, plan } = useEditorContext()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (!user) return null

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'
  const planLabel = { starter: 'Starter', pro: 'Pro', max: 'Max' }[plan?.plan ?? 'starter'] ?? 'Starter'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-slate-700/60 transition-colors"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-[9px]">
            {initials}
          </div>
        )}
        <ChevronDown size={10} className="text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 w-52 bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl shadow-2xl z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2e2e2e]">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <span className="text-[11px] font-medium text-orange-400 mt-0.5 block">Plan {planLabel}</span>
            </div>
            <button
              onClick={() => { router.push('/dashboard'); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft size={13} /> Dashboard
            </button>
            <button
              onClick={() => { router.push('/settings'); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <Settings size={13} /> Configuración
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#2e2e2e]"
            >
              <LogOut size={13} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Export / Import ──────────────────────────────────────────────────────────

function ExportImportMenu() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const exportProject = useFunnelStore(s => s.exportProject)
  const loadProject = useFunnelStore(s => s.loadProject)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const project = exportProject()
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOpen(false)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const project = JSON.parse(ev.target?.result as string)
        loadProject(project)
      } catch {
        alert('Error al cargar el archivo. Asegurate de que sea un funnel válido.')
      }
    }
    reader.readAsText(file)
    setOpen(false)
    e.target.value = ''
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Exportar / Importar"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
          'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
        )}
      >
        {saved ? <Check size={13} className="text-emerald-400" /> : <Save size={13} />}
        <span className="hidden sm:inline">Guardar</span>
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-44 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl shadow-xl z-40 overflow-hidden">
            <button onClick={handleExport} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-300 hover:bg-slate-700/50 transition-colors">
              <Download size={13} /> Exportar JSON
            </button>
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-slate-300 hover:bg-slate-700/50 transition-colors">
              <Upload size={13} /> Importar JSON
            </button>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  )
}

// ─── Dashboard button ────────────────────────────────────────────────────────

function DashboardButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push('/dashboard')}
      title="Mis proyectos"
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
    >
      <LayoutGrid size={13} />
      <span className="hidden md:inline">Proyectos</span>
    </button>
  )
}

// ─── Toolbar principal ────────────────────────────────────────────────────────

export default function EditorToolbar() {
  const simulate = useFunnelStore(s => s.simulate)
  const isSimulating = useFunnelStore(s => s.isSimulating)
  const undo = useFunnelStore(s => s.undo)
  const redo = useFunnelStore(s => s.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const resetCanvas = useFunnelStore(s => s.resetCanvas)
  const toggleTemplateLibrary = useFunnelStore(s => s.toggleTemplateLibrary)
  const isTemplateLibraryOpen = useFunnelStore(s => s.isTemplateLibraryOpen)
  const toggleAIPanel = useFunnelStore(s => s.toggleAIPanel)
  const isAIPanelOpen = useFunnelStore(s => s.isAIPanelOpen)
  const toggleHelp = useFunnelStore(s => s.toggleHelp)
  const isHelpOpen = useFunnelStore(s => s.isHelpOpen)
  const toggleProducts = useFunnelStore(s => s.toggleProducts)
  const isProductsOpen = useFunnelStore(s => s.isProductsOpen)
  const nodeCount = useFunnelStore(s => s.nodes.length)
  const { scenarios } = useEditorContext()

  return (
    <header className="h-11 bg-[#0f0f0f] border-b border-[#2e2e2e] flex items-center justify-between px-3 flex-shrink-0">
      {/* Izquierda: back + logo + nombre + escenario */}
      <div className="flex items-center gap-2">
        <DashboardButton />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="FunnelLab" className="h-6 w-auto flex-shrink-0" />
        <div className="w-px h-4 bg-[#2e2e2e]" />
        <ProjectName />
        {scenarios.length > 0 && (
          <>
            <ChevronRight size={12} className="text-slate-600" />
            <ScenarioSelector />
          </>
        )}
      </div>

      {/* Centro: acciones */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={undo} title="Deshacer (Ctrl+Z)" disabled={!canUndo}><Undo2 size={13} /></ToolbarButton>
        <ToolbarButton onClick={redo} title="Rehacer (Ctrl+Shift+Z)" disabled={!canRedo}><Redo2 size={13} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => toggleTemplateLibrary()} title="Blueprints" active={isTemplateLibraryOpen}>
          <LayoutTemplate size={13} />
          <span className="hidden md:inline">Blueprints</span>
        </ToolbarButton>
        <Divider />
        <button
          onClick={simulate}
          disabled={isSimulating || nodeCount === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all',
            'bg-orange-600 text-white hover:bg-orange-500',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'shadow-sm shadow-orange-950/60',
            isSimulating && 'animate-pulse-glow',
          )}
        >
          {isSimulating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
          {isSimulating ? 'Simulando…' : 'Simular'}
        </button>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-1">
        <SaveIndicator />

        <ToolbarButton onClick={() => toggleProducts()} title="Mis productos" active={isProductsOpen}>
          <Package size={13} className={isProductsOpen ? 'text-orange-400' : ''} />
          <span className="hidden md:inline">Productos</span>
        </ToolbarButton>

        <Divider />

        <CreditsBadge />

        <ToolbarButton onClick={() => toggleAIPanel()} title="Asistente de IA" active={isAIPanelOpen}>
          <Sparkles size={13} className={isAIPanelOpen ? 'text-orange-400' : ''} />
          <span className="hidden md:inline">IA</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => toggleHelp()} title="Ayuda (F1)" active={isHelpOpen}>
          <HelpCircle size={13} />
          <span className="hidden md:inline">Ayuda</span>
        </ToolbarButton>

        <Divider />
        <ExportImportMenu />
        <Divider />

        <ToolbarButton
          onClick={() => {
            if (nodeCount === 0 || confirm('¿Limpiar el canvas? Esta acción no se puede deshacer fácilmente.')) {
              resetCanvas()
            }
          }}
          title="Limpiar canvas"
          variant="danger"
        >
          <Trash2 size={13} />
        </ToolbarButton>

        {/* User menu */}
        <Divider />
        <UserMenu />
      </div>
    </header>
  )
}
