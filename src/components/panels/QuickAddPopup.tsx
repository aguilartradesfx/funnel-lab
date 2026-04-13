'use client'

import { useState, useEffect, useRef } from 'react'
import { useViewport } from '@xyflow/react'
import { Search, Zap } from 'lucide-react'
import {
  Megaphone, FileText, Monitor, CreditCard, TrendingUp, TrendingDown,
  ShoppingBag, Mail, MessageCircle, Video, RotateCcw, Calendar,
  GitBranch, BarChart3,
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
  StickyNote, Tag, Workflow,
} from 'lucide-react'
import type { FunnelNodeType } from '@/lib/types'
import { NODE_DEFINITIONS, getNodeColor } from '@/lib/nodeDefinitions'
import { useFunnelStore } from '@/stores/funnelStore'

// ─── Mapa de íconos ───────────────────────────────────────────────────────────

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
  StickyNote, Tag, Workflow,
}

// ─── Sugerencias por tipo de nodo ─────────────────────────────────────────────

const SUGGESTIONS: Partial<Record<FunnelNodeType, FunnelNodeType[]>> = {
  trafficSource:  ['landingPage', 'salesPage', 'webinarVsl', 'emailSequence', 'checkout'],
  reels:          ['landingPage', 'salesPage', 'webinarVsl'],
  organicPost:    ['landingPage', 'salesPage', 'webinarVsl'],
  podcast:        ['landingPage', 'salesPage', 'webinarVsl'],
  influencer:     ['landingPage', 'salesPage', 'checkout'],
  community:      ['landingPage', 'salesPage'],
  linkedinAds:    ['landingPage', 'salesPage', 'webinarVsl'],
  youtubeAds:     ['webinarVsl', 'landingPage', 'salesPage'],
  landingPage:    ['salesPage', 'emailSequence', 'webinarVsl', 'whatsappSms', 'checkout'],
  salesPage:      ['checkout', 'orderBump', 'result', 'retargeting'],
  checkout:       ['upsell', 'orderBump', 'result'],
  upsell:         ['downsell', 'result', 'emailSequence'],
  downsell:       ['result', 'emailSequence'],
  orderBump:      ['upsell', 'result'],
  emailSequence:  ['salesPage', 'webinarVsl', 'whatsappSms', 'checkout', 'result'],
  webinarVsl:     ['checkout', 'salesPage', 'result'],
  appointment:    ['result'],
  whatsappSms:    ['checkout', 'salesPage', 'result'],
  retargeting:    ['landingPage', 'salesPage', 'checkout'],
  split:          ['landingPage', 'salesPage', 'checkout', 'emailSequence'],
}

const DEFAULT_SUGGESTIONS: FunnelNodeType[] = [
  'landingPage', 'salesPage', 'checkout', 'emailSequence', 'result',
]

// Todos los nodos excepto utilidades no-interactivos
const ALL_CONNECTABLE: FunnelNodeType[] = (
  Object.keys(NODE_DEFINITIONS) as FunnelNodeType[]
).filter(t => t !== 'stickyNote' && t !== 'groupContainer')

// ─── Componente ───────────────────────────────────────────────────────────────

const NODE_W = 220
const NODE_H = 120

export default function QuickAddPopup() {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const sourceNodeId = useFunnelStore(s => s.quickAddSourceNodeId)
  const quickAddEdgeId = useFunnelStore(s => s.quickAddEdgeId)
  const quickAddFlowPos = useFunnelStore(s => s.quickAddFlowPos)
  const nodes = useFunnelStore(s => s.nodes)
  const setQuickAddSource = useFunnelStore(s => s.setQuickAddSource)
  const addNodeConnected = useFunnelStore(s => s.addNodeConnected)
  const insertNodeOnEdge = useFunnelStore(s => s.insertNodeOnEdge)
  const { x: vpX, y: vpY, zoom } = useViewport()

  const sourceNode = nodes.find(n => n.id === sourceNodeId)
  const isOpen = !!(sourceNodeId && (sourceNode || quickAddEdgeId))

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickAddSource(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, setQuickAddSource])

  if (!isOpen) return null

  // ── Calcular posición en pantalla ───────────────────────────────────────
  const wW = typeof window !== 'undefined' ? window.innerWidth : 1440
  const wH = typeof window !== 'undefined' ? window.innerHeight : 900
  const POPUP_W = 272
  const POPUP_MAX_H = 400

  // Si viene de una línea usamos su punto medio; si viene de un nodo, el borde derecho
  const handleX = quickAddFlowPos
    ? vpX + quickAddFlowPos.x * zoom
    : vpX + ((sourceNode?.position.x ?? 0) + NODE_W) * zoom
  const handleY = quickAddFlowPos
    ? vpY + quickAddFlowPos.y * zoom
    : vpY + ((sourceNode?.position.y ?? 0) + NODE_H / 2) * zoom

  // Aparece a la derecha del handle; si se sale de pantalla, a la izquierda
  const fitsRight = handleX + 24 + POPUP_W < wW - 8
  const popupLeft = fitsRight ? handleX + 24 : handleX - POPUP_W - 24
  let popupTop = handleY - 60
  popupTop = Math.max(16, Math.min(popupTop, wH - POPUP_MAX_H - 16))

  // ── Lista de nodos a mostrar ────────────────────────────────────────────
  const suggestions = SUGGESTIONS[sourceNode?.data.nodeType ?? 'trafficSource'] ?? DEFAULT_SUGGESTIONS

  const displayList: FunnelNodeType[] = search.trim()
    ? ALL_CONNECTABLE.filter(t =>
        NODE_DEFINITIONS[t].label.toLowerCase().includes(search.toLowerCase().trim())
      )
    : suggestions

  const handleSelect = (nodeType: FunnelNodeType) => {
    if (quickAddEdgeId) {
      insertNodeOnEdge(quickAddEdgeId, nodeType)
    } else if (sourceNodeId) {
      addNodeConnected(sourceNodeId, nodeType)
    }
    setSearch('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[58]"
        onClick={() => setQuickAddSource(null)}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className="fixed z-[59] animate-fade-in flex flex-col"
        style={{
          left: popupLeft,
          top: popupTop,
          width: POPUP_W,
          maxHeight: POPUP_MAX_H,
          backgroundColor: '#141414',
          border: '1px solid #2e2e2e',
          borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">
            Agregar nodo siguiente
          </p>
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nodo..."
              className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[12px] text-slate-300 placeholder-slate-700
                         focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {displayList.length === 0 ? (
            <p className="text-[11px] text-slate-600 text-center py-4">Sin resultados</p>
          ) : (
            <>
              {!search.trim() && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 px-1 mb-1.5">
                  Sugeridos
                </p>
              )}
              {displayList.map(nodeType => {
                const def = NODE_DEFINITIONS[nodeType]
                const color = getNodeColor(nodeType)
                const Icon = ICON_MAP[def.icon] ?? Zap
                const isTerminal = nodeType === 'result'
                return (
                  <button
                    key={nodeType}
                    onClick={() => handleSelect(nodeType)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg
                               text-left transition-colors duration-100 group"
                    style={{ marginBottom: '1px' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1c1c1c')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isTerminal ? 'rgba(249,115,22,0.1)' : '#1e1e1e',
                        border: `1px solid ${isTerminal ? 'rgba(249,115,22,0.25)' : '#2a2a2a'}`,
                      }}
                    >
                      <Icon size={12} strokeWidth={1.8} style={{ color: color.icon }} />
                    </div>
                    <span className="text-[12px] text-slate-400 group-hover:text-slate-200 transition-colors truncate flex-1">
                      {def.label}
                    </span>
                    {isTerminal && (
                      <span className="text-[9px] font-bold text-orange-500/60 uppercase tracking-wide flex-shrink-0">
                        final
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-3 py-2 border-t flex-shrink-0"
          style={{ borderColor: '#1e1e1e' }}
        >
          <p className="text-[10px] text-slate-700">
            Click para agregar y conectar · Esc para cerrar
          </p>
        </div>
      </div>
    </>
  )
}
