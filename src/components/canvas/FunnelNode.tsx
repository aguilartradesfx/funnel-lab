'use client'

import { memo, useCallback, useState, useRef } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import {
  Plus,
  Megaphone, FileText, Monitor, CreditCard, TrendingUp, TrendingDown,
  ShoppingBag, Mail, MessageCircle, Video, RotateCcw, Calendar,
  GitBranch, BarChart3, Zap,
  // New icons for expanded node types
  Film, Mic, Rss, Users, Newspaper, Globe, QrCode, Star,
  Bot, Phone, Brain, Cpu, Network,
  Activity, Target, Eye,
  BookOpen, Download, Info, Clock,
  Receipt, RefreshCw, Gift, Headphones, LayoutList, Calculator,
  Layers, Hash, MessageSquare, Share2, Bookmark, Trophy,
  // Additional icons used by node definitions
  Award, Bell, Briefcase, ClipboardList, Code, Database,
  DollarSign, FileCheck, FileDown, Flag, Handshake, Image,
  MapPin, Merge, PhoneIncoming, PhoneOutgoing, CirclePlay, Play,
  Repeat, Rocket, Server, Shuffle, Sparkles, Square,
  StickyNote, Tag, Workflow,
  Leaf,
} from 'lucide-react'
import type { FunnelNodeData, FunnelNodeType, SplitConfig, NodeSimResult, TrafficEntryConfig, PaidTrafficConfig, OrganicChannelConfig } from '@/lib/types'
import { NODE_DEFINITIONS, getNodeColor } from '@/lib/nodeDefinitions'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { useFunnelStore } from '@/stores/funnelStore'

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
  StickyNote, Tag, Workflow,
  Leaf,
}

// ─── Pill de métricas sobre el nodo ──────────────────────────────────────

const SOURCE_NODE_TYPES = new Set<FunnelNodeType>([
  'trafficSource', 'paidTraffic', 'organicTraffic', 'trafficEntry',
  'reels', 'organicPost', 'podcast', 'influencer', 'community', 'pr',
  'marketplace', 'qrOffline', 'linkedinAds', 'twitterAds', 'pinterestAds',
  'youtubeAds',
])

function SimPill({ result, nodeType }: { result: NodeSimResult; nodeType: FunnelNodeType }) {
  const isSource = SOURCE_NODE_TYPES.has(nodeType)
  const showFlow = !isSource && result.visitorsConverted !== result.visitorsIn

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap">
      {result.visitorsIn > 0 && (
        <span className="bg-slate-700/90 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-600/50 backdrop-blur-sm">
          {showFlow
            ? `${formatNumber(result.visitorsIn)} → ${formatNumber(result.visitorsConverted)}`
            : `${formatNumber(result.visitorsIn)} visitas`}
        </span>
      )}
      {result.revenue > 0 && (
        <span className="bg-emerald-900/90 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-700/50 backdrop-blur-sm">
          {formatCurrency(result.revenue)}
        </span>
      )}
    </div>
  )
}

// ─── Componente principal de nodo ─────────────────────────────────────────

type FunnelRFNode = Node<FunnelNodeData, 'funnelNode'>

function FunnelNodeComponent({ id, data, selected }: NodeProps<FunnelRFNode>) {
  const { nodeType, label, config, simResult } = data
  const def = NODE_DEFINITIONS[nodeType]
  const color = getNodeColor(nodeType)
  const IconComponent = ICON_MAP[def.icon] ?? Zap

  const setSelectedNode = useFunnelStore(s => s.setSelectedNode)
  const simulatingNodeId = useFunnelStore(s => s.simulatingNodeId)
  const hasSimulated = useFunnelStore(s => s.hasSimulated)
  const isSimulating = simulatingNodeId === id

  const isSourceNode = !def.hasInput
  // Solo considera "en cadena" los nodos alcanzables desde una fuente conectada
  const inChain = simResult?.isInChain ?? false
  const simSuccess  = hasSimulated && inChain && simResult !== undefined && simResult.visitorsIn > 0
  const simNoTraffic = hasSimulated && inChain && simResult !== undefined && simResult.visitorsIn === 0 && !isSourceNode

  const handleClick = useCallback(() => {
    setSelectedNode(id)
  }, [id, setSelectedNode])

  const setQuickAddSource = useFunnelStore(s => s.setQuickAddSource)
  const quickAddSourceNodeId = useFunnelStore(s => s.quickAddSourceNodeId)
  const isQuickAddOpen = quickAddSourceNodeId === id
  const [hovered, setHovered] = useState(false)
  const [handleHovered, setHandleHovered] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startHover = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(true)
  }, [])
  const stopHover = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHovered(false), 80)
  }, [])

  const hasOutput = def.hasSingleOutput || def.hasYesNoOutput || def.hasBranchOutput

  // ── Renderizado especial para sticky note ─────────────────────────────────
  if (nodeType === 'stickyNote') {
    const c = config as { title?: string; text?: string; color?: string; size?: string }
    const bg = c.color || '#fef08a'
    const isDark = bg === '#1e293b'
    const sizeMap: Record<string, { w: number; h: number }> = {
      small:  { w: 160, h: 110 },
      medium: { w: 220, h: 160 },
      large:  { w: 300, h: 210 },
    }
    const { w, h } = sizeMap[c.size ?? 'medium'] ?? sizeMap.medium
    return (
      <div
        onClick={handleClick}
        className="relative select-none"
        style={{ width: w, height: h }}
      >
        <div
          className="w-full h-full rounded-lg overflow-hidden flex flex-col"
          style={{
            backgroundColor: bg,
            border: selected ? '2px solid rgba(249,115,22,0.7)' : '2px solid transparent',
            boxShadow: selected
              ? '0 0 0 1px rgba(249,115,22,0.2), 0 4px 16px rgba(0,0,0,0.4)'
              : '2px 3px 10px rgba(0,0,0,0.25)',
          }}
        >
          {/* Fold effect top-right */}
          <div
            className="absolute top-0 right-0 w-6 h-6"
            style={{
              backgroundImage: `linear-gradient(135deg, ${bg} 50%, rgba(0,0,0,0.15) 50%)`,
              borderRadius: '0 6px 0 0',
            }}
          />
          {/* Title */}
          {c.title ? (
            <div
              className="px-3 pt-2.5 pb-1 flex-shrink-0"
              style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
            >
              <p
                className="text-[12px] font-bold leading-tight truncate"
                style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
              >
                {c.title}
              </p>
            </div>
          ) : null}
          {/* Body */}
          <div className="flex-1 px-3 py-2 overflow-hidden">
            <p
              className="text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-6"
              style={{ color: isDark ? '#94a3b8' : '#334155' }}
            >
              {c.text || (c.title ? '' : 'Nota vacía…')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Posiciones de handles alineadas al grid de 20px.
  // Nodo fijo en 120px = 6×20:  50%=60px, 33%=40px, 67%=80px, 17%=20px, 83%=100px
  const BRANCH_TOPS: Record<number, string[]> = {
    1: ['50%'],
    2: ['33.33%', '66.67%'],
    3: ['16.67%', '50%', '83.33%'],
    4: ['16.67%', '33.33%', '66.67%', '83.33%'],
  }
  const branchColors = ['#f97316', '#6b7280', '#4b5563', '#374151']

  return (
    <div
      onClick={handleClick}
      onMouseEnter={startHover}
      onMouseLeave={stopHover}
      className="relative select-none"
      style={{ width: 220, height: 120 }}
    >
      {/* Resultados flotantes encima — solo si el nodo es parte de la cadena y hay sim vigente */}
      {hasSimulated && simResult && inChain && simResult.visitorsIn > 0 && <SimPill result={simResult} nodeType={nodeType} />}

      {/* Tarjeta del nodo — ocupa los 120px exactos */}
      <div
        style={{
          backgroundColor: color.bg,
          borderColor: isSimulating
            ? 'rgba(249,115,22,0.6)'
            : simSuccess
              ? 'rgba(34,197,94,0.4)'
              : simNoTraffic
                ? 'rgba(239,68,68,0.3)'
                : selected
                  ? 'rgba(249,115,22,0.5)'
                  : color.border,
          borderWidth: 1,
          boxShadow: isSimulating
            ? '0 2px 8px rgba(0,0,0,0.35)'
            : simSuccess
              ? '0 0 0 1px rgba(34,197,94,0.1), 0 0 14px rgba(34,197,94,0.12), 0 4px 16px rgba(0,0,0,0.5)'
              : simNoTraffic
                ? '0 0 0 1px rgba(239,68,68,0.07), 0 4px 16px rgba(0,0,0,0.5)'
                : selected
                  ? '0 0 0 1px rgba(249,115,22,0.15), 0 0 18px rgba(249,115,22,0.08), 0 4px 16px rgba(0,0,0,0.5)'
                  : '0 2px 8px rgba(0,0,0,0.35)',
          transition: isSimulating ? 'none' : 'border-color 0.35s ease, box-shadow 0.35s ease',
          animation: isSimulating ? 'nodeSimPulse 0.75s ease infinite' : undefined,
        }}
        className="rounded-xl overflow-hidden border h-full flex flex-col"
      >
        {/* Header */}
        <div
          style={{ backgroundColor: '#252525', borderBottomColor: '#333' }}
          className="flex items-center gap-2.5 px-3 py-2 border-b flex-shrink-0"
        >
          <div
            style={{ backgroundColor: '#2e2e2e', color: color.icon }}
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          >
            <IconComponent size={13} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider leading-none truncate text-[#555] mb-0.5">
              {def.label}
            </p>
            <p className="text-[12px] font-semibold text-slate-200 truncate leading-tight">
              {label}
            </p>
          </div>
        </div>

        {/* Body — ocupa el espacio restante, contenido centrado */}
        <div className="px-3 py-1.5 flex-1 flex flex-col justify-center overflow-hidden">
          <NodeMetrics nodeType={nodeType} config={config} />
        </div>
      </div>

      {/* ── Handles — posiciones exactas múltiplo de 20px ── */}

      {/* Input izquierdo @ 50% = 60px
          20×20 con borde de 5px que coincide con el fondo → área clickeable 2× sin cambiar visual */}
      {def.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input-left"
          style={{
            background: '#505050',
            left: -10,
            top: '50%',
            border: '5px solid #191919',
            width: 20,
            height: 20,
          }}
        />
      )}

      {/* Output único derecho @ 50% = 60px */}
      {def.hasSingleOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="output-right"
          onMouseEnter={() => setHandleHovered(true)}
          onMouseLeave={() => setHandleHovered(false)}
          style={{
            background: '#505050',
            right: -10,
            top: '50%',
            border: '5px solid #191919',
            width: 20,
            height: 20,
          }}
        />
      )}

      {/* Output único centrado para nodos con conversión @ 50% = 60px */}
      {def.hasYesNoOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="output-right"
          onMouseEnter={() => setHandleHovered(true)}
          onMouseLeave={() => setHandleHovered(false)}
          style={{
            background: '#505050',
            right: -10,
            top: '50%',
            border: '5px solid #191919',
            width: 20,
            height: 20,
          }}
        />
      )}

      {/* Punto de salida de no-conversión (rojo) @ 83.33% ≈ 100px — cerca de la esquina inferior derecha */}
      {def.hasYesNoOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="output-rejection"
          style={{
            background: '#ef4444',
            right: -10,
            top: '83.33%',
            border: '5px solid #191919',
            width: 16,
            height: 16,
          }}
        />
      )}

      {/* Badge de no-convertidos junto al punto rojo */}
      {hasSimulated && simResult && inChain && simResult.visitorsNotConverted > 0 && def.hasYesNoOutput && (
        <div
          style={{
            position: 'absolute',
            right: -14,
            top: '83.33%',
            transform: 'translateX(100%) translateY(-50%)',
            fontSize: 9,
            fontWeight: 700,
            color: '#ef4444',
            backgroundColor: 'rgba(15,15,15,0.9)',
            border: '1px solid rgba(239,68,68,0.4)',
            padding: '1px 5px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {formatNumber(simResult.visitorsNotConverted)}
        </div>
      )}

      {/* Branches @ posiciones múltiplo de 20px */}
      {def.hasBranchOutput && (config as SplitConfig).branches && (
        (config as SplitConfig).branches.map((branch, i) => {
          const tops = BRANCH_TOPS[(config as SplitConfig).branches.length] ?? BRANCH_TOPS[4]
          return (
            <Handle
              key={branch.id}
              type="source"
              position={Position.Right}
              id={branch.id}
              style={{
                background: branchColors[i] ?? '#f97316',
                right: -10,
                top: tops[i] ?? '50%',
                border: '5px solid #191919',
                width: 20,
                height: 20,
              }}
            />
          )
        })
      )}

      {/* ── Botón + para agregar nodo siguiente ─────────────────────────
           Siempre en el DOM (sin condicional) para que el mouse pueda
           encontrarlo incluso cuando el nodo no está en hover.
           La visibilidad se controla solo con opacity. ─────────────── */}
      {hasOutput && (
        <button
          onMouseEnter={startHover}
          onMouseLeave={stopHover}
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setQuickAddSource(isQuickAddOpen ? null : id)
          }}
          className="absolute flex items-center justify-center rounded-full nodrag nopan"
          style={{
            right: handleHovered ? -58 : -46,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            zIndex: 20,
            transition: 'right 0.15s ease, opacity 0.12s ease',
            opacity: (hovered || isQuickAddOpen) ? 1 : 0,
            backgroundColor: isQuickAddOpen ? '#f97316' : '#242424',
            border: `1.5px solid ${isQuickAddOpen ? '#f97316' : '#3e3e3e'}`,
            color: isQuickAddOpen ? '#fff' : '#888',
            boxShadow: isQuickAddOpen ? '0 0 12px rgba(249,115,22,0.45)' : undefined,
          }}
        >
          <Plus size={10} strokeWidth={2.5} />
        </button>
      )}

    </div>
  )
}

// ─── Métricas resumidas por tipo de nodo ──────────────────────────────────

function NodeMetrics({
  nodeType,
  config,
}: {
  nodeType: FunnelNodeType
  config: FunnelNodeData['config']
}) {
  const c = config as Record<string, unknown>

  switch (nodeType) {
    case 'trafficSource': {
      const platform = PLATFORM_LABELS[c.platform as string] ?? String(c.platform)
      if (c.costModel === 'organic') {
        return <MetricRow label={platform} value={`${formatNumber(c.monthlyVisitors as number)} visitas`} />
      }
      return (
        <div className="space-y-1">
          <MetricRow label={platform} value={`$${c.budget as number}/mes`} />
          <MetricRow
            label={c.costModel === 'cpc' ? 'CPC' : 'CPM'}
            value={`$${c.costModel === 'cpc' ? c.cpc : c.cpm}`}
          />
        </div>
      )
    }
    case 'landingPage':
      return <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
    case 'salesPage':
      return (
        <div className="space-y-1">
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
        </div>
      )
    case 'checkout':
      return (
        <div className="space-y-1">
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
          <MetricRow label="Abandono" value={formatPercent(c.abandonmentRate as number)} />
        </div>
      )
    case 'upsell':
    case 'downsell':
      return (
        <div className="space-y-1">
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
          <MetricRow label="Aceptación" value={formatPercent(c.acceptanceRate as number)} highlight />
        </div>
      )
    case 'orderBump':
      return (
        <div className="space-y-1">
          <MetricRow label="+Precio" value={formatCurrency(c.price as number)} />
          <MetricRow label="Aceptación" value={formatPercent(c.acceptanceRate as number)} highlight />
        </div>
      )
    case 'emailSequence': {
      const isSingleMode = (c.mode as string) === 'single'
      return (
        <div className="space-y-1">
          {isSingleMode
            ? <MetricRow label={(c.subject as string) || 'Email individual'} value={formatPercent(c.openRate as number)} highlight />
            : <>
                <MetricRow label={`${c.emails} emails`} value={formatPercent(c.openRate as number)} highlight />
                <MetricRow label="CTR" value={formatPercent(c.ctr as number)} />
              </>
          }
        </div>
      )
    }
    case 'whatsappSms':
      return <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
    case 'webinarVsl':
      return (
        <div className="space-y-1">
          <MetricRow label="Asistencia" value={formatPercent(c.attendanceRate as number)} />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
        </div>
      )
    case 'retargeting':
      return (
        <div className="space-y-1">
          <MetricRow label="CPC" value={`$${c.cpc}`} />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
        </div>
      )
    case 'appointment':
      return (
        <div className="space-y-1">
          <MetricRow label="Cierre" value={formatPercent(c.closeRate as number)} highlight />
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
        </div>
      )
    case 'split': {
      const branches = (c.branches as SplitConfig['branches']) ?? []
      return (
        <div className="space-y-0.5">
          {branches.map(b => (
            <MetricRow key={b.id} label={b.label} value={formatPercent(b.percentage)} />
          ))}
        </div>
      )
    }
    case 'trafficEntry': {
      const tec = c as unknown as TrafficEntryConfig
      const count = tec.sources?.length ?? 0
      const paid = tec.totalPaidVisitors ?? 0
      const organic = tec.totalOrganicVisitors ?? 0
      const total = tec.totalVisitors ?? 0
      if (count === 0) {
        return <p className="text-[11px] text-slate-500 italic">Sin fuentes agregadas</p>
      }
      return (
        <div className="space-y-1">
          <MetricRow
            label={`${count} fuente${count !== 1 ? 's' : ''}`}
            value={`${formatNumber(total)} visitas`}
          />
          {paid > 0 && organic > 0 && (
            <MetricRow label="Pagadas / Orgánicas" value={`${formatNumber(paid)} / ${formatNumber(organic)}`} />
          )}
          {(tec.totalBudget ?? 0) > 0 && (
            <MetricRow label="Budget" value={formatCurrency(tec.totalBudget ?? 0)} />
          )}
        </div>
      )
    }
    case 'paidTraffic': {
      const ptc = c as unknown as PaidTrafficConfig
      const model = ptc.costModel ?? 'cpc'
      const costLabel = model === 'cpc' ? 'CPC' : model === 'cpm' ? 'CPM' : 'CPV'
      const costValue = model === 'cpc' ? ptc.cpc : model === 'cpm' ? ptc.cpm : ptc.cpv
      return (
        <div className="space-y-1">
          <MetricRow label="Budget" value={formatCurrency(ptc.budget ?? 0)} />
          <MetricRow label={costLabel} value={`$${costValue ?? 0}`} />
        </div>
      )
    }
    case 'organicTraffic': {
      const otc = c as unknown as OrganicChannelConfig
      const ch = otc.channel ?? 'other'
      if (ch === 'emailList') {
        return (
          <div className="space-y-1">
            <MetricRow label="Lista" value={`${formatNumber(otc.listSize ?? 0)}`} />
            <MetricRow label="CTR" value={formatPercent(otc.ctr ?? 0)} highlight />
          </div>
        )
      }
      if (ch === 'referrals') {
        return (
          <div className="space-y-1">
            <MetricRow label="Referidores" value={`${formatNumber(otc.activeReferrers ?? 0)}`} />
            <MetricRow label="Conv." value={formatPercent(otc.referralConversionRate ?? 0)} highlight />
          </div>
        )
      }
      return (
        <div className="space-y-1">
          <MetricRow label="Alcance" value={`${formatNumber(otc.reach ?? 0)}`} />
          <MetricRow label="CTR" value={formatPercent(otc.ctr ?? 0)} highlight />
        </div>
      )
    }
    // ─── Páginas de conversión ───
    case 'applicationPage':
      return (
        <div className="space-y-1">
          <MetricRow label="Completado" value={formatPercent(c.completionRate as number)} />
          <MetricRow label="Calificados" value={formatPercent(c.qualificationRate as number)} highlight />
        </div>
      )
    case 'tripwire':
      return (
        <div className="space-y-1">
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
        </div>
      )
    case 'catalogStore':
      return (
        <div className="space-y-1">
          <MetricRow label="Add to cart" value={formatPercent(c.addToCartRate as number)} highlight />
          <MetricRow label="AOV" value={formatCurrency(c.aov as number)} />
        </div>
      )
    case 'pricingPage': {
      const planLabels: Record<string, string> = { basic: 'Básico', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }
      return (
        <div className="space-y-1">
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
          <MetricRow label="Plan popular" value={planLabels[c.popularPlan as string] ?? String(c.popularPlan)} />
        </div>
      )
    }
    case 'freeTrialSignup':
      return (
        <div className="space-y-1">
          <MetricRow label="Signup" value={formatPercent(c.signupRate as number)} highlight />
          <MetricRow label="Activación" value={formatPercent(c.activationRate as number)} />
        </div>
      )
    case 'thankYouOffer':
      return (
        <div className="space-y-1">
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
        </div>
      )
    // ─── Ventas y cierre ───
    case 'outboundCall':
      return (
        <div className="space-y-1">
          <MetricRow label="Contacto" value={formatPercent(c.contactRate as number)} />
          <MetricRow label="Cierre" value={formatPercent(c.closeRate as number)} highlight />
        </div>
      )
    case 'inboundCall':
      return (
        <div className="space-y-1">
          <MetricRow label="Atendidas" value={formatPercent(c.answeredRate as number)} />
          <MetricRow label="Cierre" value={formatPercent(c.closeRate as number)} highlight />
        </div>
      )
    case 'salesProposal':
      return (
        <div className="space-y-1">
          <MetricRow label="Apertura" value={formatPercent(c.openRate as number)} />
          <MetricRow label="Aceptación" value={formatPercent(c.acceptanceRate as number)} highlight />
        </div>
      )
    case 'productDemo':
      return (
        <div className="space-y-1">
          <MetricRow label="Show rate" value={formatPercent(c.showRate as number)} />
          <MetricRow label="Cierre" value={formatPercent(c.closeRate as number)} highlight />
        </div>
      )
    case 'trialToPaid':
      return (
        <div className="space-y-1">
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
        </div>
      )
    case 'physicalPos':
      return (
        <div className="space-y-1">
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
          <MetricRow label="Ticket" value={formatCurrency(c.avgTicket as number)} />
        </div>
      )
    case 'digitalContract':
      return (
        <div className="space-y-1">
          <MetricRow label="Firmados" value={formatPercent(c.signedRate as number)} highlight />
          <MetricRow label="Valor" value={formatCurrency(c.contractValue as number)} />
        </div>
      )
    case 'salesNegotiation':
      return (
        <div className="space-y-1">
          <MetricRow label="Win rate" value={formatPercent(c.winRate as number)} highlight />
          <MetricRow label="Ciclo" value={`${c.salesCycleDays} días`} />
        </div>
      )
    case 'eventSales':
      return (
        <div className="space-y-1">
          <MetricRow label="Leads" value={formatPercent(c.leadsContactedRate as number)} />
          <MetricRow label="Cierre" value={formatPercent(c.closeRate as number)} highlight />
        </div>
      )
    // ─── Follow-up y nurturing ───
    case 'pushNotifications':
      return (
        <div className="space-y-1">
          <MetricRow label="Opt-in" value={formatPercent(c.optInRate as number)} highlight />
          <MetricRow label="CTR" value={formatPercent(c.ctr as number)} />
        </div>
      )
    case 'dynamicRetargeting':
      return (
        <div className="space-y-1">
          <MetricRow label="Budget" value={formatCurrency(c.budget as number)} />
          <MetricRow label="CTR" value={formatPercent(c.ctr as number)} highlight />
        </div>
      )
    case 'multichannelNurturing': {
      const channels = (c.activeChannels as string[]) ?? []
      return (
        <div className="space-y-1">
          <MetricRow label="Canales" value={channels.length > 0 ? channels.map(ch => ch === 'email' ? 'Email' : ch === 'whatsapp' ? 'WA' : 'SMS').join('+') : '—'} />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} highlight />
        </div>
      )
    }
    case 'cartAbandonmentSeq':
      return (
        <div className="space-y-1">
          <MetricRow label="Recuperación" value={formatPercent(c.recoveryRate as number)} highlight />
          <MetricRow label="Carrito" value={formatCurrency(c.avgCartValue as number)} />
        </div>
      )
    case 'reEngagement':
      return (
        <div className="space-y-1">
          <MetricRow label="Reactivación" value={formatPercent(c.reactivationRate as number)} highlight />
          <MetricRow label="Costo" value={formatCurrency(c.costPerReactivation as number)} />
        </div>
      )
    case 'dripCampaign':
      return (
        <div className="space-y-1">
          <MetricRow label="Emails" value={`${c.emailCount}`} />
          <MetricRow label="Conversión" value={formatPercent(c.eventualConversion as number)} highlight />
        </div>
      )
    // ─── Post-venta y retención ───
    case 'onboardingSeq':
      return (
        <div className="space-y-1">
          <MetricRow label="Completado" value={formatPercent(c.completionRate as number)} />
          <MetricRow label="Activación" value={formatPercent(c.activationRate as number)} highlight />
        </div>
      )
    case 'reviewRequest':
      return (
        <div className="space-y-1">
          <MetricRow label="Reviews" value={formatPercent(c.responseRate as number)} highlight />
          <MetricRow label="Rating" value={`${(c.avgRating as number).toFixed(1)} ★`} />
        </div>
      )
    case 'referralProgram':
      return (
        <div className="space-y-1">
          <MetricRow label="Invitaciones" value={`${c.invitationsPerCustomer}x`} />
          <MetricRow label="Conversión" value={formatPercent(c.referralConversionRate as number)} highlight />
        </div>
      )
    case 'renewalUpsell':
      return (
        <div className="space-y-1">
          <MetricRow label="Churn" value={formatPercent(c.churnRate as number)} />
          <MetricRow label="Upgrade" value={formatPercent(c.upgradeRate as number)} highlight />
        </div>
      )
    case 'postSaleSupport':
      return (
        <div className="space-y-1">
          <MetricRow label="Tickets" value={`${c.ticketsPerMonth}/mes`} />
          <MetricRow label="Resolución" value={formatPercent(c.resolutionRate as number)} highlight />
        </div>
      )
    case 'customerCommunity':
      return (
        <div className="space-y-1">
          <MetricRow label="Activos" value={formatPercent(c.activeMembersRate as number)} highlight />
          <MetricRow label="Engagement" value={formatPercent(c.monthlyEngagement as number)} />
        </div>
      )
    case 'crossSell':
      return (
        <div className="space-y-1">
          <MetricRow label="Aceptación" value={formatPercent(c.acceptanceRate as number)} highlight />
          <MetricRow label="Precio" value={formatCurrency(c.price as number)} />
        </div>
      )
    case 'winBack':
      return (
        <div className="space-y-1">
          <MetricRow label="Reactivación" value={formatPercent(c.reactivationRate as number)} highlight />
          <MetricRow label="Costo" value={formatCurrency(c.reactivationCost as number)} />
        </div>
      )
    case 'loyaltyProgram':
      return (
        <div className="space-y-1">
          <MetricRow label="Participación" value={formatPercent(c.participationRate as number)} highlight />
          <MetricRow label="Frecuencia+" value={formatPercent(c.purchaseFrequencyLift as number)} />
        </div>
      )
    case 'npsSurvey':
      return (
        <div className="space-y-1">
          <MetricRow label="Respuesta" value={formatPercent(c.responseRate as number)} highlight />
          <MetricRow label="NPS" value={`${c.npsScore}`} />
        </div>
      )
    // ─── Contenido y engagement ───
    case 'blogSeo':
      return (
        <div className="space-y-1">
          <MetricRow label="Visitas/mes" value={formatNumber(c.monthlyVisits as number)} />
          <MetricRow label="CTR a CTA" value={formatPercent(c.ctrToCta as number)} highlight />
        </div>
      )
    case 'videoContent':
      return (
        <div className="space-y-1">
          <MetricRow label="Views/mes" value={formatNumber(c.monthlyViews as number)} />
          <MetricRow label="Watch time" value={formatPercent(c.watchTimePct as number)} highlight />
        </div>
      )
    case 'leadMagnet':
      return (
        <div className="space-y-1">
          <MetricRow label="Opt-in" value={formatPercent(c.optInRate as number)} highlight />
          <MetricRow label="Calidad lead" value={`${c.leadQualityScore}/10`} />
        </div>
      )
    case 'quizInteractive':
      return (
        <div className="space-y-1">
          <MetricRow label="Completado" value={formatPercent(c.completionRate as number)} highlight />
          <MetricRow label="Opt-in final" value={formatPercent(c.optInAtEnd as number)} />
        </div>
      )
    case 'calculatorTool':
      return (
        <div className="space-y-1">
          <MetricRow label="Usos/mes" value={formatNumber(c.monthlyUses as number)} />
          <MetricRow label="Conversión" value={formatPercent(c.nextStepConversion as number)} highlight />
        </div>
      )
    case 'educationalCarousel':
      return (
        <div className="space-y-1">
          <MetricRow label="Saves" value={formatPercent(c.saveRate as number)} highlight />
          <MetricRow label="CTR" value={formatPercent(c.ctrToLink as number)} />
        </div>
      )
    case 'ebookGuide':
      return (
        <div className="space-y-1">
          <MetricRow label="Páginas leídas" value={formatPercent(c.avgPagesPct as number)} />
          <MetricRow label="CTR a oferta" value={formatPercent(c.ctrToOffer as number)} highlight />
        </div>
      )
    case 'resourceTemplate':
      return (
        <div className="space-y-1">
          <MetricRow label="Descarga" value={formatPercent(c.downloadRate as number)} highlight />
          <MetricRow label="Post-uso" value={formatPercent(c.postUseConversion as number)} />
        </div>
      )
    case 'webinarReplay':
      return (
        <div className="space-y-1">
          <MetricRow label="Views" value={formatPercent(c.viewsPct as number)} highlight />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} />
        </div>
      )
    case 'caseStudy':
      return (
        <div className="space-y-1">
          <MetricRow label="CTR a CTA" value={formatPercent(c.ctrToCta as number)} highlight />
          <MetricRow label="Lectura" value={`${Math.round((c.avgReadTimeSec as number) / 60)} min`} />
        </div>
      )
    // ─── Agentes de IA ───
    case 'aiAgent': {
      const CHANNEL_LABEL: Record<string, string> = {
        whatsapp: 'WhatsApp', webchat: 'Web Chat', voice: 'Voz',
        instagram: 'Instagram', facebook: 'Facebook', email: 'Email',
      }
      return (
        <div className="space-y-1">
          <div className="text-[10px] text-slate-500 mb-0.5">{CHANNEL_LABEL[c.channel as string] ?? c.channel}</div>
          <MetricRow label="Auto-respuesta" value={formatPercent(c.autoResponseRate as number)} highlight />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} />
        </div>
      )
    }
    case 'aiWhatsapp':
      return (
        <div className="space-y-1">
          <MetricRow label="Auto-respuesta" value={formatPercent(c.autoResponseRate as number)} highlight />
          <MetricRow label="Conversión" value={formatPercent(c.conversionRate as number)} />
        </div>
      )
    case 'aiWebChat':
      return (
        <div className="space-y-1">
          <MetricRow label="Resolución" value={formatPercent(c.autoResolutionRate as number)} highlight />
          <MetricRow label="Leads" value={formatPercent(c.leadsGeneratedRate as number)} />
        </div>
      )
    case 'aiVoice':
      return (
        <div className="space-y-1">
          <MetricRow label="Resolución" value={formatPercent(c.resolutionRate as number)} highlight />
          <MetricRow label="Booking" value={formatPercent(c.bookingRate as number)} />
        </div>
      )
    case 'aiInstagramDm':
      return (
        <div className="space-y-1">
          <MetricRow label="Auto-respuesta" value={formatPercent(c.autoResponseRate as number)} highlight />
          <MetricRow label="CTR a link" value={formatPercent(c.linkConversionRate as number)} />
        </div>
      )
    case 'aiEmail':
      return (
        <div className="space-y-1">
          <MetricRow label="Auto-respuesta" value={formatPercent(c.autoResponseRate as number)} highlight />
          <MetricRow label="Follow-up" value={formatPercent(c.autoFollowUpRate as number)} />
        </div>
      )
    case 'chatbotRules':
      return (
        <div className="space-y-1">
          <MetricRow label="Completado" value={formatPercent(c.flowCompletionRate as number)} highlight />
          <MetricRow label="Leads" value={formatPercent(c.leadsCapturedRate as number)} />
        </div>
      )
    case 'automationWorkflow':
      return (
        <div className="space-y-1">
          <MetricRow label="Éxito" value={formatPercent(c.successRate as number)} highlight />
          <MetricRow label="Costo" value={formatCurrency(c.operatingCostPerMonth as number)} />
        </div>
      )
    case 'aiLeadScoring':
      return (
        <div className="space-y-1">
          <MetricRow label="MQL" value={formatPercent(c.mqlRate as number)} highlight />
          <MetricRow label="Precisión" value={formatPercent(c.scoringPrecision as number)} />
        </div>
      )
    case 'aiContentPersonalization':
      return (
        <div className="space-y-1">
          <MetricRow label="CTR lift" value={formatPercent(c.ctrLift as number)} highlight />
          <MetricRow label="Conv. lift" value={formatPercent(c.conversionLift as number)} />
        </div>
      )
    case 'aiSegmentation':
      return (
        <div className="space-y-1">
          <MetricRow label="Segmentos" value={`${c.segmentsCreated}`} highlight />
          <MetricRow label="Precisión" value={formatPercent(c.segmentationPrecision as number)} />
        </div>
      )
    // ─── Tracking (badges informativos) ───
    case 'metaPixel':
      return <MetricRow label="Match quality" value={formatPercent(c.matchQualityScore as number)} highlight />
    case 'googleTagManager':
      return <MetricRow label="Tags activos" value={`${c.activeTags}`} highlight />
    case 'googleAnalytics':
      return <MetricRow label="Eventos" value={`${c.gaConfiguredEvents}`} highlight />
    case 'metaOfflineData':
      return <MetricRow label="Match rate" value={formatPercent(c.offlineMatchRate as number)} highlight />
    case 'utmTracking':
      return (
        <p className="text-[11px] text-slate-500 truncate">
          {(c.utmSource as string) || (c.utmCampaign as string) || 'Sin UTMs configurados'}
        </p>
      )
    case 'serverPostback':
      return <MetricRow label="Precisión" value={formatPercent(c.precisionVsCookie as number)} highlight />
    case 'crmAttribution':
      return <MetricRow label="Modelo" value={String(c.crmAttributionModel ?? '').replace('Touch', ' touch')} />
    case 'heatmaps':
      return <MetricRow label="Sesiones" value={formatNumber(c.heatmapSessionsPerMonth as number)} highlight />
    case 'callTracking':
      return <MetricRow label="Atribución" value={formatPercent(c.callSourceAttribution as number)} highlight />
    case 'conversionApi':
      return <MetricRow label="Deduplicación" value={formatPercent(c.deduplicationRate as number)} highlight />
    // ─── Utilidades ───
    case 'delayWait': {
      const unitLabels: Record<string, string> = { hours: 'h', days: 'd', weeks: 'sem' }
      const unit = (c.unit as string) ?? 'days'
      return <MetricRow label="Espera" value={`${c.days} ${unitLabels[unit] ?? unit}`} highlight />
    }
    case 'conditionalBranch': {
      const yes = c.yesPercent as number
      return (
        <div className="space-y-1">
          <MetricRow label="Sí" value={formatPercent(yes)} highlight />
          <MetricRow label="No" value={formatPercent(100 - yes)} />
        </div>
      )
    }
    case 'mergeNode':
      return <p className="text-[11px] text-slate-500 italic">Une múltiples flujos</p>
    case 'kpiCheckpoint':
      return (
        <div className="space-y-1">
          <MetricRow label={(c.kpiName as string) || 'KPI'} value={`$${c.kpiAlertThreshold}`} highlight />
        </div>
      )
    case 'loopRecurrence':
      return (
        <div className="space-y-1">
          <MetricRow label="Ciclos" value={`${c.iterations}x`} highlight />
          <MetricRow label="Retención" value={formatPercent(c.retentionPerCycle as number)} />
        </div>
      )
    case 'milestoneNode': {
      const stageLabels: Record<string, string> = {
        awareness: 'Awareness', interest: 'Interés', consideration: 'Consideración',
        decision: 'Decisión', purchase: 'Compra', retention: 'Retención', referral: 'Referencia',
      }
      return <MetricRow label="Etapa" value={stageLabels[c.milestoneStage as string] ?? String(c.milestoneStage)} highlight />
    }
    case 'fixedCostNode':
      return (
        <div className="space-y-1">
          <MetricRow label={(c.costConcept as string) || 'Costo'} value={formatCurrency(c.monthlyCost as number)} highlight />
        </div>
      )
    case 'recurringRevenueNode':
      return (
        <div className="space-y-1">
          <MetricRow label="MRR/cliente" value={formatCurrency(c.mrr as number)} highlight />
          <MetricRow label="Churn" value={formatPercent(c.churnRate as number)} />
        </div>
      )
    // ─── Fuentes orgánicas ───
    case 'reels':
    case 'organicPost':
    case 'podcast':
    case 'influencer':
    case 'community':
    case 'pr':
    case 'marketplace':
    case 'qrOffline':
      return (
        <div className="space-y-1">
          <MetricRow label="Alcance" value={formatNumber(c.reach as number)} />
          <MetricRow label="CTR" value={formatPercent(c.ctr as number)} highlight />
        </div>
      )
    // ─── Ads sociales ───
    case 'linkedinAds':
    case 'twitterAds':
    case 'pinterestAds':
    case 'youtubeAds':
      return (
        <div className="space-y-1">
          <MetricRow label="Budget" value={formatCurrency(c.budget as number)} />
          <MetricRow label="CTR" value={formatPercent(c.ctr as number)} highlight />
        </div>
      )
    // ─── Utilidades restantes ───
    case 'stickyNote':
      return (
        <p className="text-[11px] text-slate-400 italic line-clamp-2">
          {(c.text as string) || 'Nota vacía'}
        </p>
      )
    case 'abSplitTest': {
      const branches = (c.branches as SplitConfig['branches']) ?? []
      return (
        <div className="space-y-0.5">
          {branches.map(b => (
            <MetricRow key={b.id} label={b.label} value={formatPercent(b.percentage)} />
          ))}
        </div>
      )
    }
    case 'groupContainer':
      return (
        <p className="text-[11px] text-slate-400 truncate">
          {(c.text as string) || 'Grupo'}
        </p>
      )
    case 'result':
      return (
        <p className="text-[11px] text-slate-500 italic">Nodo terminal</p>
      )
    default:
      return null
  }
}

function MetricRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-500 truncate">{label}</span>
      <span className={`text-[12px] font-semibold ${highlight ? 'text-orange-300' : 'text-slate-300'} tabular-nums`}>
        {value}
      </span>
    </div>
  )
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
  organic: 'Orgánico',
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  referral: 'Referidos',
  other: 'Otro',
}

export default memo(FunnelNodeComponent)
