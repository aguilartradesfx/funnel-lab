'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BarChart3, Sparkles, Columns2, ArrowUpDown, GripHorizontal } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { ResultsPanelContent } from './ResultsPanel'
import { AIPanelContent } from '../ai/AIPanel'
import { cn } from '@/lib/utils'

type PanelMode = 'results' | 'chat' | 'split'

const MIN_WIDTH = 260
const MAX_WIDTH = 720
const DEFAULT_WIDTH = 320
const STORAGE_WIDTH = 'right-panel-width'
const STORAGE_RATIO = 'right-panel-split-ratio'
const STORAGE_MODE  = 'right-panel-mode'
const STORAGE_SWAP  = 'right-panel-swapped'

export default function RightPanel() {
  const isAIPanelOpen = useFunnelStore(s => s.isAIPanelOpen)
  const toggleAIPanel = useFunnelStore(s => s.toggleAIPanel)

  const [mode, setMode]                     = useState<PanelMode>('results')
  const [splitRatio, setSplitRatio]         = useState(50)
  const [swapped, setSwapped]               = useState(false)
  const [panelWidth, setPanelWidth]         = useState(DEFAULT_WIDTH)
  const [isResizingWidth, setIsResizingWidth]       = useState(false)
  const [isResizingDivider, setIsResizingDivider]   = useState(false)

  const dragWidthStartX      = useRef(0)
  const dragWidthStartW      = useRef(0)
  const dragDividerStartY    = useRef(0)
  const dragDividerStartRatio = useRef(50)
  const prevIsOpen           = useRef(false)

  // ── Init from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_WIDTH)
    if (savedWidth) {
      const n = parseInt(savedWidth, 10)
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) setPanelWidth(n)
    }

    const savedRatio = localStorage.getItem(STORAGE_RATIO)
    if (savedRatio) {
      const n = parseInt(savedRatio, 10)
      if (n >= 20 && n <= 80) setSplitRatio(n)
    }

    const savedMode = localStorage.getItem(STORAGE_MODE)
    if (savedMode === 'results' || savedMode === 'chat' || savedMode === 'split') {
      setMode(savedMode)
      if (savedMode === 'chat' || savedMode === 'split') {
        prevIsOpen.current = true
        toggleAIPanel(true)
      }
    }

    const savedSwap = localStorage.getItem(STORAGE_SWAP)
    if (savedSwap === 'true') setSwapped(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Store → mode (cuando alguien llama toggleAIPanel desde toolbar u otro lugar) ──
  useEffect(() => {
    if (isAIPanelOpen === prevIsOpen.current) return
    prevIsOpen.current = isAIPanelOpen
    if (isAIPanelOpen) {
      setMode(prev => prev === 'results' ? 'split' : prev)
    } else {
      setMode('results')
    }
  }, [isAIPanelOpen])

  // ── changeMode: sync con store ─────────────────────────────────────────────
  const changeMode = useCallback((newMode: PanelMode) => {
    setMode(newMode)
    localStorage.setItem(STORAGE_MODE, newMode)
    const chatVisible = newMode === 'chat' || newMode === 'split'
    if (chatVisible !== isAIPanelOpen) {
      prevIsOpen.current = chatVisible
      toggleAIPanel(chatVisible)
    }
  }, [isAIPanelOpen, toggleAIPanel])

  // ── Resize width (drag izquierdo) ──────────────────────────────────────────
  const handleResizeWidth = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragWidthStartX.current = e.clientX
    dragWidthStartW.current = panelWidth
    setIsResizingWidth(true)

    const onMouseMove = (ev: MouseEvent) => {
      const delta = dragWidthStartX.current - ev.clientX
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragWidthStartW.current + delta))
      setPanelWidth(next)
    }

    const onMouseUp = (ev: MouseEvent) => {
      const delta = dragWidthStartX.current - ev.clientX
      const final = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragWidthStartW.current + delta))
      localStorage.setItem(STORAGE_WIDTH, String(final))
      setIsResizingWidth(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [panelWidth])

  // ── Resize divider (split ratio) ───────────────────────────────────────────
  const handleResizeDivider = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragDividerStartY.current     = e.clientY
    dragDividerStartRatio.current = splitRatio

    // Need to know the panel element height at drag start
    const panelEl = (e.currentTarget as HTMLElement).closest('aside')
    const panelHeight = panelEl ? panelEl.getBoundingClientRect().height : 600
    // Subtract tab bar height (36px)
    const contentHeight = panelHeight - 36

    setIsResizingDivider(true)

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - dragDividerStartY.current
      const deltaPct = (delta / contentHeight) * 100
      const next = Math.max(20, Math.min(80, dragDividerStartRatio.current + deltaPct))
      setSplitRatio(next)
    }

    const onMouseUp = (ev: MouseEvent) => {
      const delta = ev.clientY - dragDividerStartY.current
      const deltaPct = (delta / contentHeight) * 100
      const final = Math.max(20, Math.min(80, dragDividerStartRatio.current + deltaPct))
      localStorage.setItem(STORAGE_RATIO, String(Math.round(final)))
      setIsResizingDivider(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [splitRatio])

  return (
    <aside
      className="flex-shrink-0 h-full flex flex-col relative"
      style={{
        width: panelWidth,
        backgroundColor: '#0c0c0c',
        borderLeft: '1px solid #1e1e1e'
      }}
    >
      {/* Resize handle izquierdo (ancho del panel) */}
      <div
        onMouseDown={handleResizeWidth}
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center group"
        style={{ width: 8, cursor: 'ew-resize' }}
      >
        <div className={cn(
          'h-12 rounded-full transition-all duration-150',
          isResizingWidth
            ? 'w-[3px] bg-orange-500'
            : 'w-[2px] bg-[#2e2e2e] group-hover:bg-orange-500/60 group-hover:w-[3px]'
        )} />
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          borderBottom: '1px solid #1e1e1e',
          backgroundColor: '#0a0a0a',
          height: 36
        }}
      >
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5">
          {[
            { id: 'results', icon: BarChart3, label: 'Solo resultados' },
            { id: 'split',   icon: Columns2,  label: 'Dividido' },
            { id: 'chat',    icon: Sparkles,  label: 'Solo chat' },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => changeMode(tab.id as PanelMode)}
                title={tab.label}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  mode === tab.id
                    ? 'text-orange-400 bg-orange-500/10'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                )}
              >
                <Icon size={13} />
              </button>
            )
          })}
        </div>

        {/* Swap button (solo en split mode) */}
        {mode === 'split' && (
          <button
            onClick={() => {
              setSwapped(s => !s)
              localStorage.setItem(STORAGE_SWAP, String(!swapped))
            }}
            title="Intercambiar posición"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          >
            <ArrowUpDown size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {mode === 'results' && <ResultsPanelContent />}
        {mode === 'chat'    && <AIPanelContent />}
        {mode === 'split'   && (
          <>
            {/* Top panel */}
            <div
              className="overflow-hidden flex flex-col flex-shrink-0"
              style={{ height: `${splitRatio}%` }}
            >
              {swapped ? <AIPanelContent /> : <ResultsPanelContent />}
            </div>

            {/* Divider */}
            <div
              onMouseDown={handleResizeDivider}
              className={cn(
                'flex-shrink-0 flex items-center justify-center group cursor-ns-resize select-none',
                isResizingDivider ? 'bg-orange-500/10' : ''
              )}
              style={{
                height: 8,
                backgroundColor: isResizingDivider ? undefined : '#111',
                borderTop: '1px solid #1e1e1e',
                borderBottom: '1px solid #1e1e1e'
              }}
            >
              <GripHorizontal
                size={12}
                className={cn(
                  'transition-colors',
                  isResizingDivider ? 'text-orange-400' : 'text-[#2a2a2a] group-hover:text-[#444]'
                )}
              />
            </div>

            {/* Bottom panel */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {swapped ? <ResultsPanelContent /> : <AIPanelContent />}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
