'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ─── Funnel data ───────────────────────────────────────────────────────────────

interface DemoNode {
  id: string
  icon: string
  name: string
  config: string
  borderColor: string
  iconBg: string
  iconColor: string
  outLabel: string
  outValue: number
  outFormat?: 'number' | 'currency'
}

interface DemoFunnel {
  title: string
  nodes: DemoNode[]
  results: { label: string; value: string }[]
}

const FUNNELS: DemoFunnel[] = [
  {
    title: 'E-commerce con Facebook Ads',
    nodes: [
      {
        id: 'traffic', icon: '◈', name: 'Facebook Ads', config: '$1,000/mes · CPC $0.80',
        borderColor: 'border-orange-500/40', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400',
        outLabel: 'visitas', outValue: 1250,
      },
      {
        id: 'landing', icon: '▣', name: 'Landing Page', config: 'Conversión 25%',
        borderColor: 'border-emerald-500/40', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400',
        outLabel: 'leads', outValue: 312,
      },
      {
        id: 'checkout', icon: '◎', name: 'Checkout', config: 'Producto $97',
        borderColor: 'border-purple-500/40', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400',
        outLabel: 'compradores', outValue: 109,
      },
    ],
    results: [
      { label: 'Revenue', value: '$10,573' },
      { label: 'ROAS', value: '10.6x' },
      { label: 'Profit', value: '$9,573' },
    ],
  },
  {
    title: 'Agencia con Webinar',
    nodes: [
      {
        id: 'traffic', icon: '◈', name: 'Google Ads + IG', config: '$2,000/mes · CPC $3.50',
        borderColor: 'border-orange-500/40', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400',
        outLabel: 'visitas', outValue: 2840,
      },
      {
        id: 'landing', icon: '▣', name: 'Registro Webinar', config: 'Conversión 30%',
        borderColor: 'border-emerald-500/40', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400',
        outLabel: 'registros', outValue: 852,
      },
      {
        id: 'webinar', icon: '▶', name: 'Webinar Live', config: 'Asistencia 40% · Conv. 8%',
        borderColor: 'border-blue-500/40', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400',
        outLabel: 'consultas', outValue: 27,
      },
      {
        id: 'checkout', icon: '◎', name: 'Propuesta', config: 'Servicio $3,500',
        borderColor: 'border-purple-500/40', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400',
        outLabel: 'clientes', outValue: 8,
      },
    ],
    results: [
      { label: 'Revenue', value: '$29,400' },
      { label: 'ROAS', value: '14.7x' },
      { label: 'CPA', value: '$238' },
    ],
  },
  {
    title: 'SaaS con IA y SEO',
    nodes: [
      {
        id: 'traffic', icon: '◈', name: 'SEO + LinkedIn', config: '11,000 visitas/mes',
        borderColor: 'border-orange-500/40', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400',
        outLabel: 'visitas', outValue: 11000,
      },
      {
        id: 'magnet', icon: '◆', name: 'Lead Magnet', config: 'Opt-in 35%',
        borderColor: 'border-yellow-500/40', iconBg: 'bg-yellow-500/15', iconColor: 'text-yellow-400',
        outLabel: 'leads', outValue: 3850,
      },
      {
        id: 'chat', icon: '◉', name: 'AI Web Chat', config: 'Conv. a trial 15%',
        borderColor: 'border-cyan-500/40', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400',
        outLabel: 'trials', outValue: 577,
      },
      {
        id: 'trial', icon: '◎', name: 'Trial → Pago', config: 'Conv. 12% · $29/mes',
        borderColor: 'border-purple-500/40', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400',
        outLabel: 'clientes', outValue: 69,
      },
    ],
    results: [
      { label: 'MRR', value: '$2,001' },
      { label: 'ARR', value: '$24,012' },
      { label: 'CAC', value: '$0' },
    ],
  },
]

// ─── Animation phases ─────────────────────────────────────────────────────────
// 0: idle / transitioning out
// 1..N: nodes appearing one by one
// N+1: simulating (counting up metrics)
// N+2: results panel visible
// N+3: pause, then reset

// ─── Node card ────────────────────────────────────────────────────────────────

function DemoNodeCard({
  node, visible, metricValue, isSimulating,
}: {
  node: DemoNode
  visible: boolean
  metricValue: number
  isSimulating: boolean
}) {
  return (
    <div className={cn(
      'w-[118px] flex-shrink-0 rounded-xl border bg-[#111111] p-2.5 transition-all duration-500',
      node.borderColor,
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn('w-5 h-5 rounded-md flex items-center justify-center text-[11px] flex-shrink-0', node.iconBg)}>
          <span className={cn('font-bold', node.iconColor)}>{node.icon}</span>
        </div>
        <span className="text-[11px] font-semibold text-white leading-tight truncate">{node.name}</span>
      </div>
      <p className="text-[9px] text-slate-500 leading-tight mb-1.5">{node.config}</p>
      <div className={cn(
        'rounded-lg py-1 px-1.5 text-center transition-all duration-300',
        isSimulating ? 'bg-orange-500/10' : 'bg-[#1a1a1a]',
      )}>
        <span className={cn('text-[11px] font-bold transition-colors duration-300', isSimulating ? 'text-orange-400' : 'text-slate-600')}>
          {isSimulating ? metricValue.toLocaleString('es') : '—'}
        </span>
        <span className="text-[9px] text-slate-600 ml-1">{node.outLabel}</span>
      </div>
    </div>
  )
}

// ─── Connector arrow ─────────────────────────────────────────────────────────

function Arrow({ visible }: { visible: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-0 flex-shrink-0 transition-all duration-400',
      visible ? 'opacity-100' : 'opacity-0',
    )}>
      <div className="w-5 h-px bg-[#3e3e3e]" />
      <svg width="8" height="10" viewBox="0 0 8 10" className="text-[#3e3e3e]" fill="none">
        <path d="M0 0L8 5L0 10" fill="currentColor" />
      </svg>
    </div>
  )
}

// ─── Results panel ────────────────────────────────────────────────────────────

function ResultsPanel({ results, visible }: { results: DemoFunnel['results']; visible: boolean }) {
  return (
    <div className={cn(
      'flex-shrink-0 w-[120px] rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 transition-all duration-600',
      visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
    )}>
      <p className="text-[9px] font-semibold text-orange-400 uppercase tracking-wider mb-2">Resultados</p>
      {results.map(r => (
        <div key={r.label} className="mb-1.5 last:mb-0">
          <p className="text-[9px] text-slate-500">{r.label}</p>
          <p className="text-sm font-bold text-white">{r.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FunnelDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [funnelIdx, setFunnelIdx] = useState(0)
  const [visibleNodes, setVisibleNodes] = useState(0)   // how many nodes are shown
  const [isSimulating, setIsSimulating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [metricValues, setMetricValues] = useState<number[]>([])

  const funnel = FUNNELS[funnelIdx]

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const resetState = useCallback(() => {
    setVisibleNodes(0)
    setIsSimulating(false)
    setShowResults(false)
    setFadeOut(false)
    setMetricValues([])
  }, [])

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }, [])

  const runFunnel = useCallback((idx: number) => {
    const f = FUNNELS[idx]
    const nodeCount = f.nodes.length

    let t = 0

    // Appear nodes one by one
    for (let i = 1; i <= nodeCount; i++) {
      const ni = i
      t += 600
      addTimeout(() => setVisibleNodes(ni), t)
    }

    // Start simulating
    t += 600
    addTimeout(() => {
      setIsSimulating(true)
      setMetricValues(new Array(nodeCount).fill(0))
    }, t)

    // Count up metrics over 1.2s
    const steps = 20
    const stepMs = 1200 / steps
    for (let s = 1; s <= steps; s++) {
      const progress = s / steps
      const si = s
      addTimeout(() => {
        setMetricValues(f.nodes.map(n => Math.round(n.outValue * easeOut(progress))))
      }, t + si * stepMs)
    }

    // Show results panel
    t += 1400
    addTimeout(() => setShowResults(true), t)

    // Pause, then fade out and switch
    t += 3200
    addTimeout(() => setFadeOut(true), t)

    t += 600
    addTimeout(() => {
      resetState()
      const nextIdx = (idx + 1) % FUNNELS.length
      setFunnelIdx(nextIdx)
    }, t)
  }, [addTimeout, resetState])

  // Restart when funnelIdx changes (after reset)
  useEffect(() => {
    if (!isVisible) return
    // small delay before starting next funnel
    const id = setTimeout(() => runFunnel(funnelIdx), 400)
    timeoutsRef.current.push(id)
    return () => clearTimeout(id)
  }, [funnelIdx, isVisible, runFunnel])

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Pause when not visible
  useEffect(() => {
    if (!isVisible) {
      clearAll()
    }
  }, [isVisible, clearAll])

  return (
    <div ref={containerRef} className="w-full">
      {/* Funnel title */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-400">{funnel.title}</span>
        </div>
        <div className="flex gap-1">
          {FUNNELS.map((_, i) => (
            <div key={i} className={cn(
              'w-4 h-0.5 rounded-full transition-colors duration-300',
              i === funnelIdx ? 'bg-orange-500' : 'bg-[#2e2e2e]'
            )} />
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className={cn(
        'relative rounded-2xl border border-[#2e2e2e] bg-[#0d0d0d] p-5 transition-opacity duration-500',
        fadeOut ? 'opacity-0' : 'opacity-100',
      )}>
        {/* Grid background */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #2e2e2e 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative flex items-center gap-2 flex-wrap justify-center md:justify-start">
          {funnel.nodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2">
              <DemoNodeCard
                node={node}
                visible={visibleNodes > i}
                metricValue={metricValues[i] ?? 0}
                isSimulating={isSimulating}
              />
              {i < funnel.nodes.length - 1 && (
                <Arrow visible={visibleNodes > i + 1} />
              )}
            </div>
          ))}

          {/* Separator */}
          {showResults && (
            <div className="hidden md:flex items-center gap-2">
              <div className="w-px h-12 bg-[#2e2e2e] mx-1" />
              <ResultsPanel results={funnel.results} visible={showResults} />
            </div>
          )}
        </div>

        {/* Mobile results */}
        {showResults && (
          <div className="md:hidden mt-3 flex gap-3 justify-center">
            {funnel.results.map(r => (
              <div key={r.label} className="text-center">
                <p className="text-[9px] text-slate-500">{r.label}</p>
                <p className="text-sm font-bold text-orange-400">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Simulating badge */}
        {isSimulating && !showResults && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-medium text-orange-400">Simulando…</span>
          </div>
        )}
      </div>
    </div>
  )
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
