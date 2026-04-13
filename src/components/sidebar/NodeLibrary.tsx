'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useReactFlow } from '@xyflow/react'
import {
  Megaphone, FileText, Monitor, CreditCard, TrendingUp, TrendingDown,
  ShoppingBag, Mail, MessageCircle, Video, RotateCcw, Calendar,
  GitBranch, BarChart3, Zap,
  Plus, Undo2, Redo2, Search, X, ChevronRight, ChevronDown,
  Film, Mic, Rss, Users, Newspaper, Globe, QrCode, Star,
  Bot, Phone, Brain, Cpu, Network,
  Activity, Target, Eye,
  BookOpen, Download, Info, Clock,
  Receipt, RefreshCw, Gift, Headphones, LayoutList, Calculator,
  Layers, Hash, MessageSquare, Share2, Bookmark, Trophy,
  Award, Bell, Briefcase, ClipboardList, Code, Database,
  DollarSign, FileCheck, FileDown, Flag, Handshake, Image,
  MapPin, Merge, PhoneIncoming, PhoneOutgoing, CirclePlay, Play,
  Repeat, Rocket, Server, Shuffle, Sparkles, Square,
  StickyNote, Tag, Workflow, Leaf,
} from 'lucide-react'
import type { FunnelNodeType } from '@/lib/types'
import { NODE_DEFINITIONS, NODE_CATEGORIES } from '@/lib/nodeDefinitions'
import { useFunnelStore, useCanUndo, useCanRedo } from '@/stores/funnelStore'

// ─── Mapa de íconos ────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Megaphone, FileText, Monitor, CreditCard, TrendingUp, TrendingDown,
  ShoppingBag, Mail, MessageCircle, Video, RotateCcw, Calendar,
  GitBranch, BarChart3, Zap,
  Film, Mic, Rss, Users, Newspaper, Globe, QrCode, Star,
  Bot, Phone, Brain, Cpu, Network,
  Activity, Target, Eye,
  BookOpen, Download, Info, Clock,
  Receipt, RefreshCw, Gift, Headphones, LayoutList, Calculator,
  Layers, Hash, MessageSquare, Share2, Bookmark, Trophy,
  Award, Bell, Briefcase, ClipboardList, Code, Database,
  DollarSign, FileCheck, FileDown, Flag, Handshake, Image,
  MapPin, Merge, PhoneIncoming, PhoneOutgoing, CirclePlay, Play,
  Repeat, Rocket, Server, Shuffle, Sparkles, Square,
  StickyNote, Tag, Workflow, Leaf,
}

// ─── Nodos anclados en la barra compacta ─────────────────────────────────

const PINNED_NODES: FunnelNodeType[] = [
  'trafficEntry',
  'landingPage',
  'salesPage',
  'checkout',
  'emailSequence',
  'upsell',
  'whatsappSms',
  'split',
]

// El nodo resultado se muestra separado como nodo terminal
const TERMINAL_NODE: FunnelNodeType = 'result'

// ─── Tooltip portal ───────────────────────────────────────────────────────

function Tooltip({ label, x, y }: { label: string; x: number; y: number }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: x + 10,
        top: y,
        transform: 'translateY(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="bg-[#1c1c1c] border border-[#3a3a3a] rounded-md px-2.5 py-1.5
                 text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-xl"
    >
      <span
        style={{
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: 4,
          borderStyle: 'solid',
          borderColor: 'transparent #3a3a3a transparent transparent',
        }}
      />
      {label}
    </div>,
    document.body
  )
}

// ─── Botón de nodo anclado (barra compacta) ───────────────────────────────

function PinnedNodeButton({
  nodeType,
  terminal = false,
}: {
  nodeType: FunnelNodeType
  terminal?: boolean
}) {
  const def = NODE_DEFINITIONS[nodeType]
  const Icon = ICON_MAP[def.icon] ?? Zap
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const onDragStart = (e: React.DragEvent) => {
    setTip(null)
    e.dataTransfer.setData('application/funnel-node-type', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const tooltipLabel = terminal ? `${def.label} — nodo final` : def.label

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setTip({ x: r.right, y: r.top + r.height / 2 })
        }}
        onMouseLeave={() => setTip(null)}
        className="w-10 h-10 flex items-center justify-center rounded-xl
                   cursor-grab active:cursor-grabbing
                   transition-all duration-100 active:scale-90 relative"
        style={terminal ? {
          backgroundColor: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.22)',
        } : {
          backgroundColor: '#1a1a1a',
          border: '1px solid #282828',
        }}
      >
        <Icon
          size={18}
          strokeWidth={1.7}
          style={{ color: terminal ? '#f97316' : undefined }}
          className={terminal ? undefined : 'text-slate-500'}
        />
        {/* Indicador de nodo terminal */}
        {terminal && (
          <span
            className="absolute -top-1 -right-1 text-[7px] font-bold uppercase tracking-wider
                       bg-orange-500 text-white rounded-full px-1 py-px leading-none"
            style={{ lineHeight: '1.3' }}
          >
            fin
          </span>
        )}
      </div>
      {mounted && tip && <Tooltip label={tooltipLabel} x={tip.x} y={tip.y} />}
    </>
  )
}

// ─── Fila de nodo en el panel expandido ──────────────────────────────────

function PanelNodeRow({
  nodeType,
  onAdd,
}: {
  nodeType: FunnelNodeType
  onAdd: () => void
}) {
  const def = NODE_DEFINITIONS[nodeType]
  const Icon = ICON_MAP[def.icon] ?? Zap
  const isTerminal = nodeType === 'result'

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/funnel-node-type', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onAdd}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg mx-1
                 cursor-grab active:cursor-grabbing
                 hover:bg-[#1c1c1c] transition-colors duration-100 group"
    >
      <div
        className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 transition-colors"
        style={isTerminal ? {
          backgroundColor: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.2)',
        } : {
          backgroundColor: '#1e1e1e',
          border: '1px solid #2a2a2a',
        }}
      >
        <Icon
          size={12}
          strokeWidth={1.8}
          style={{ color: isTerminal ? '#f97316' : undefined }}
          className={isTerminal ? undefined : 'text-slate-500 group-hover:text-slate-300 transition-colors'}
        />
      </div>
      <span className="text-[12px] text-slate-500 group-hover:text-slate-200 transition-colors truncate flex-1">
        {def.label}
      </span>
      {isTerminal && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500/70 flex-shrink-0 mr-1">
          Final
        </span>
      )}
    </div>
  )
}

// ─── Sección de categoría en panel expandido ─────────────────────────────

function PanelCategory({
  cat,
  onAdd,
  search,
}: {
  cat: { id: string; label: string; nodes: FunnelNodeType[] }
  onAdd: (type: FunnelNodeType) => void
  search: string
}) {
  const [open, setOpen] = useState(true)

  const filtered = search
    ? cat.nodes.filter(n =>
        NODE_DEFINITIONS[n].label.toLowerCase().includes(search.toLowerCase())
      )
    : cat.nodes

  if (filtered.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5
                   text-[9px] font-bold uppercase tracking-widest
                   text-slate-700 hover:text-slate-500 transition-colors"
      >
        <span>{cat.label}</span>
        {open ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
      </button>
      {open && (
        <div>
          {filtered.map(nodeType => (
            <PanelNodeRow
              key={nodeType}
              nodeType={nodeType}
              onAdd={() => onAdd(nodeType)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Panel expandido ─────────────────────────────────────────────────────

function NodePanel({
  onClose,
  barRef,
}: {
  onClose: () => void
  barRef: React.RefObject<HTMLDivElement | null>
}) {
  const [search, setSearch] = useState('')
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useFunnelStore(s => s.addNode)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleAdd = useCallback(
    (nodeType: FunnelNodeType) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const pos = screenToFlowPosition({ x: centerX, y: centerY })
      addNode(nodeType, { x: pos.x - 110, y: pos.y - 60 })
      onClose()
    },
    [screenToFlowPosition, addNode, onClose]
  )

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Cerrar al click fuera (del panel y la barra)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      const inPanel = panelRef.current?.contains(t)
      const inBar = barRef.current?.contains(t)
      if (!inPanel && !inBar) onClose()
    }
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handler)
    }, 80)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose, barRef])

  return (
    <div
      ref={panelRef}
      className="absolute left-[72px] top-1/2 -translate-y-1/2 w-[228px] max-h-[calc(100vh-4rem)]
                 bg-[#141414]/96 border border-[#2a2a2a] rounded-2xl
                 shadow-2xl backdrop-blur-sm z-30 flex flex-col
                 animate-fade-in overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Todos los nodos
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[#1e1e1e] transition-colors"
          >
            <X size={13} />
          </button>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nodo..."
            className="w-full pl-7 pr-3 py-1.5 bg-[#191919] border border-[#2a2a2a] rounded-lg
                       text-[12px] text-slate-300 placeholder-slate-700
                       focus:outline-none focus:border-[#383838]
                       transition-colors"
          />
        </div>
      </div>

      {/* Lista de nodos */}
      <div className="flex-1 overflow-y-auto py-1">
        {NODE_CATEGORIES.map(cat => (
          <PanelCategory
            key={cat.id}
            cat={cat}
            onAdd={handleAdd}
            search={search}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#1e1e1e] flex-shrink-0">
        <p className="text-[10px] text-slate-700">
          Click para agregar · Arrastrá al canvas
        </p>
      </div>
    </div>
  )
}

// ─── Count-up hook ────────────────────────────────────────────────────────

function useCountUp(target: number, trigger: boolean, duration = 900): number {
  const [value, setValue] = useState(target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!trigger) {
      setValue(target)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, trigger, duration])

  return value
}

// ─── Resultados mini ──────────────────────────────────────────────────────

function SimResultsMini() {
  const simResults = useFunnelStore(s => s.simResults)
  const simJustCompleted = useFunnelStore(s => s.simJustCompleted)
  const hasSimulated = useFunnelStore(s => s.hasSimulated)

  const netProfit = simResults ? simResults.netProfit : 0
  const roas = simResults ? simResults.roas : 0

  const animatedProfit = useCountUp(Math.abs(Math.round(netProfit)), simJustCompleted)
  const animatedRoas = useCountUp(Math.round(roas * 100), simJustCompleted)

  if (!hasSimulated || !simResults) return null

  const isProfit = netProfit >= 0

  return (
    <div
      className="flex flex-col items-center gap-1 p-2 rounded-2xl backdrop-blur-sm shadow-lg border"
      style={{
        backgroundColor: isProfit ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
        borderColor: isProfit ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
      }}
    >
      <span
        className="text-[9px] font-bold uppercase tracking-widest"
        style={{ color: isProfit ? '#4ade80' : '#f87171' }}
      >
        {isProfit ? 'Profit' : 'Pérdida'}
      </span>
      <span
        className="text-[13px] font-bold font-mono tabular-nums leading-none"
        style={{ color: isProfit ? '#22c55e' : '#ef4444' }}
      >
        {isProfit ? '+' : '-'}${animatedProfit.toLocaleString()}
      </span>
      {roas > 0 && (
        <span className="text-[10px] font-mono text-slate-600">
          {(animatedRoas / 100).toFixed(2)}x
        </span>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function NodeLibrary() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const undo = useFunnelStore(s => s.undo)
  const redo = useFunnelStore(s => s.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      {/* Barra flotante compacta */}
      <div
        ref={barRef}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none"
      >
        {/* Píldora principal con nodos anclados */}
        <div className="flex flex-col items-center gap-1.5 p-1.5
                        bg-[#0f0f0f]/92 border border-[#262626] rounded-2xl
                        backdrop-blur-md shadow-xl pointer-events-auto">
          {PINNED_NODES.map(nodeType => (
            <PinnedNodeButton key={nodeType} nodeType={nodeType} />
          ))}

          {/* Separador con label "Nodo final" */}
          <div className="flex flex-col items-center gap-0.5 w-full my-0.5">
            <div className="w-6 h-px bg-[#2e2e2e]" />
            <span className="text-[7px] font-bold uppercase tracking-widest text-[#3a3a3a]">fin</span>
            <div className="w-6 h-px bg-[#2e2e2e]" />
          </div>

          {/* Nodo de resultado (terminal) */}
          <PinnedNodeButton nodeType={TERMINAL_NODE} terminal />

          {/* Separador */}
          <div className="w-6 h-px bg-[#2a2a2a] mt-0.5" />

          {/* Botón "+" */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            title="Ver todos los nodos"
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-150
              ${panelOpen
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-[#1a1a1a] border-[#282828] text-slate-500 hover:bg-[#242424] hover:text-slate-300 hover:border-[#3a3a3a]'
              }`}
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Píldora de undo/redo */}
        <div className="flex flex-col items-center gap-1 p-1.5
                        bg-[#0f0f0f]/92 border border-[#262626] rounded-2xl
                        backdrop-blur-md shadow-lg pointer-events-auto">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all
                       disabled:opacity-20 disabled:cursor-not-allowed
                       text-slate-500 hover:bg-[#1e1e1e] hover:text-slate-300
                       disabled:hover:bg-transparent disabled:hover:text-slate-500"
          >
            <Undo2 size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all
                       disabled:opacity-20 disabled:cursor-not-allowed
                       text-slate-500 hover:bg-[#1e1e1e] hover:text-slate-300
                       disabled:hover:bg-transparent disabled:hover:text-slate-500"
          >
            <Redo2 size={14} strokeWidth={1.8} />
          </button>
        </div>

      </div>

      {/* Panel expandido */}
      {panelOpen && (
        <NodePanel
          onClose={() => setPanelOpen(false)}
          barRef={barRef}
        />
      )}
    </>
  )
}
