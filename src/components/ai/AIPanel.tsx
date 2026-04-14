'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Send, Loader2, BarChart3, Wand2, FileText, Lightbulb, ChevronRight, Trash2, Download, ChevronDown } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { FunnelRFNode, FunnelRFEdge, GlobalSimResults } from '@/lib/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  funnelData?: FunnelJSONData | null
  credits_used?: number
  action_type?: string
  created_at?: string
}

// ─── Extrae y procesa un bloque JSON de funnel en la respuesta de la IA ───────

interface FunnelJSONData {
  funnel_name?: string
  nodes: Array<{ type: string; label: string; config?: Record<string, unknown> }>
  connections?: Array<{ from_index: number; to_index: number; path_type?: string }>
  edges?: Array<{ from_index: number; to_index: number; path_type?: string }>
}

function extractFunnelJSON(content: string): {
  funnelData: FunnelJSONData | null
  preText: string
} {
  const jsonMatch = content.match(/```json\n?([\s\S]*?)```/)
  if (!jsonMatch) return { funnelData: null, preText: content }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(jsonMatch[1]) as any
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      return { funnelData: null, preText: content }
    }

    const funnelData: FunnelJSONData = {
      funnel_name: parsed.funnel_name,
      nodes: normalizeAINodes(parsed.nodes),
      connections: parsed.connections ?? parsed.edges,
    }

    // Solo conservar el texto antes del bloque JSON; la tarjeta de importación reemplaza al bloque
    const jsonStart = content.indexOf('```json')
    const preText = jsonStart > 0 ? content.slice(0, jsonStart).trim() : ''

    return { funnelData, preText }
  } catch {
    return { funnelData: null, preText: content }
  }
}

// ─── Normaliza nodos del formato IA (soporta formato simplificado Y formato RF completo) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAINodes(raw: any[]): FunnelJSONData['nodes'] {
  return raw.map(n => {
    // Formato React Flow completo: { id, type, position, data: { label, config, nodeType } }
    const d = n?.data as Record<string, unknown> | undefined
    const type = String((d?.nodeType ?? n?.type) ?? 'landingPage')
    const label = String((n?.label ?? d?.label ?? n?.type) ?? type)
    const config = (n?.config ?? d?.config ?? {}) as Record<string, unknown>
    return { type, label, config }
  })
}

// ─── Construye la cadena de nodos del funnel ──────────────────────────────────

function buildNodeChain(data: FunnelJSONData): string {
  const connections = data.connections ?? data.edges ?? []

  // Mapa de índice → siguiente (solo paths principales: default o yes)
  const next = new Map<number, number>()
  for (const c of connections) {
    const pt = c.path_type ?? 'default'
    if ((pt === 'default' || pt === 'yes') && !next.has(c.from_index)) {
      next.set(c.from_index, c.to_index)
    }
  }

  // Nodo inicial = el que no es target de ninguna conexión
  const targets = new Set(connections.map(c => c.to_index))
  let current: number | undefined = data.nodes.findIndex((_, i) => !targets.has(i))
  if (current < 0) current = 0

  const chain: string[] = []
  const visited = new Set<number>()
  while (current !== undefined && !visited.has(current) && chain.length < 10) {
    visited.add(current)
    const node = data.nodes[current]
    if (node?.label) chain.push(node.label)
    current = next.get(current)
  }

  const remaining = data.nodes.length - visited.size
  if (remaining > 0) chain.push(`+${remaining} más`)

  return chain.join(' → ')
}

// ─── Tarjeta de importación de funnel ────────────────────────────────────────

function FunnelImportCard({ funnelData }: { funnelData: FunnelJSONData }) {
  const importNodesFromAI = useFunnelStore(s => s.importNodesFromAI)
  const [imported, setImported] = useState(false)
  const [showJSON, setShowJSON] = useState(false)

  const chain = buildNodeChain(funnelData)
  const nodeCount = funnelData.nodes.length

  const handleImport = () => {
    importNodesFromAI(funnelData.nodes, funnelData.connections ?? funnelData.edges ?? [])
    setImported(true)
  }

  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #222' }}>
        <Wand2 size={11} className="text-orange-400 flex-shrink-0" />
        <span className="text-[12px] font-semibold text-slate-200 truncate flex-1">
          {funnelData.funnel_name ?? 'Funnel generado'}
        </span>
        <span className="text-[10px] text-slate-600 flex-shrink-0">{nodeCount} nodos</span>
      </div>

      {/* Cadena de nodos */}
      <div className="px-3 py-2.5" style={{ backgroundColor: '#111' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#7a7a7a' }}>{chain}</p>
      </div>

      {/* Botones */}
      <div className="flex gap-2 px-3 py-2.5" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #222' }}>
        {imported ? (
          <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 flex-1">
            <span style={{ color: '#22c55e' }}>✓</span>
            ¡Listo! Funnel importado con {nodeCount} nodos. Revisalo y ajustá las métricas.
          </p>
        ) : (
          <button
            onClick={handleImport}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
            style={{ backgroundColor: '#ea580c' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f97316')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ea580c')}
          >
            <Download size={11} />
            Importar al canvas
          </button>
        )}
        <button
          onClick={() => setShowJSON(s => !s)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition-colors"
          style={{ border: '1px solid #2e2e2e', color: '#666' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
          onMouseLeave={e => (e.currentTarget.style.color = '#666')}
        >
          <ChevronDown size={11} style={{ transform: showJSON ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          Ver JSON
        </button>
      </div>

      {/* JSON colapsable */}
      {showJSON && (
        <pre
          className="px-3 py-2.5 text-[10px] font-mono overflow-x-auto overflow-y-auto"
          style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #1e1e1e', color: '#555', maxHeight: 200 }}
        >
          {JSON.stringify(funnelData, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownLine({ line }: { line: string }) {
  // Bold (**text**), italic (*text*), inline code (`text`)
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i} className="text-slate-300 italic">{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 rounded bg-[#2a2a2a] text-orange-300 text-[11px] font-mono">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// Tarjetas de métricas: "valor | label && valor | label && ..."
function MetricCards({ raw }: { raw: string }) {
  const cards = raw.split('&&').map(s => s.trim()).filter(Boolean).map(card => {
    const [value, label] = card.split('|').map(s => s.trim())
    return { value: value ?? card, label: label ?? '' }
  })
  return (
    <div className="flex gap-2 mt-2 mb-1 flex-wrap">
      {cards.map((card, i) => (
        <div
          key={i}
          className="flex-1 min-w-[70px] rounded-xl px-3 py-2 text-center"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
        >
          <div className="text-[15px] font-bold text-white leading-tight">{card.value}</div>
          {card.label && <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{card.label}</div>}
        </div>
      ))}
    </div>
  )
}

function renderMarkdown(text: string): React.ReactNode {
  const blocks: React.ReactNode[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Tarjetas de métricas: líneas que empiezan con "> " y contienen "|"
    if (line.startsWith('> ') && line.includes('|')) {
      blocks.push(<MetricCards key={i} raw={line.slice(2)} />)
      i++; continue
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }

      // Interceptar bloques JSON que contengan un funnel (campo "nodes")
      if (lang === 'json') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed = JSON.parse(codeLines.join('\n')) as any
          if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            const funnelData: FunnelJSONData = {
              funnel_name: parsed.funnel_name,
              nodes: normalizeAINodes(parsed.nodes),
              connections: parsed.connections ?? parsed.edges,
            }
            blocks.push(<FunnelImportCard key={i} funnelData={funnelData} />)
            i++; continue
          }
        } catch {
          // Si no es JSON válido, caer al render normal de <pre>
        }
      }

      blocks.push(
        <pre key={i} className="mt-2 mb-2 bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 overflow-x-auto text-[11px] text-slate-300 font-mono leading-relaxed">
          {lang && <div className="text-[10px] text-slate-600 mb-1.5 uppercase tracking-wider">{lang}</div>}
          {codeLines.join('\n')}
        </pre>
      )
      i++; continue
    }

    // Headers
    if (line.startsWith('### ')) {
      blocks.push(<h4 key={i} className="text-[13px] font-bold text-slate-100 mt-3 mb-1">{line.slice(4)}</h4>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      blocks.push(<h3 key={i} className="text-[13px] font-bold text-white mt-3 mb-1.5 border-b border-[#2a2a2a] pb-1">{line.slice(3)}</h3>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      blocks.push(<h2 key={i} className="text-sm font-bold text-white mt-3 mb-2">{line.slice(2)}</h2>)
      i++; continue
    }

    // Bullet list — también captura indentados con 2+ espacios
    if (line.match(/^(\s{0,4})[-*] /)) {
      const items: Array<{ text: string; indent: number }> = []
      while (i < lines.length && lines[i].match(/^(\s{0,4})[-*] /)) {
        const m = lines[i].match(/^(\s*)[-*] (.*)/)
        items.push({ text: m?.[2] ?? lines[i], indent: (m?.[1]?.length ?? 0) > 0 ? 1 : 0 })
        i++
      }
      blocks.push(
        <ul key={i} className="space-y-1 my-1.5">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-1.5" style={{ paddingLeft: item.indent * 14 }}>
              <span className="text-orange-500 mt-[3px] flex-shrink-0 text-[10px]">◆</span>
              <span className="text-slate-300"><MarkdownLine line={item.text} /></span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push(
        <ol key={i} className="space-y-1.5 my-1.5">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="text-orange-500 font-bold text-[11px] flex-shrink-0 mt-0.5 w-4 text-right">{j + 1}.</span>
              <span className="text-slate-300"><MarkdownLine line={item} /></span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Separador ---
    if (line.match(/^---+$/)) {
      blocks.push(<hr key={i} className="border-[#2a2a2a] my-2" />)
      i++; continue
    }

    // Línea vacía
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-1.5" />)
      i++; continue
    }

    // Párrafo normal
    blocks.push(<p key={i} className="leading-relaxed text-slate-300"><MarkdownLine line={line} /></p>)
    i++
  }

  return <>{blocks}</>
}

// ─── Construye el contexto del funnel para el API ─────────────────────────────

function buildFunnelContext(
  nodes: FunnelRFNode[],
  edges: FunnelRFEdge[],
  simResults: GlobalSimResults | null,
  projectName: string,
) {
  const nodeMap = new Map(nodes.map(n => [n.id, n.data.label ?? n.id]))
  return {
    projectName,
    scenarioName: 'Principal',
    nodes: nodes.map(n => ({
      type: n.data.nodeType,   // FIX: era n.data.type (undefined); nodeType es el campo correcto
      label: n.data.label,
      config: n.data.config ?? {},
      simResult: n.data.simResult
        ? {
            entran: n.data.simResult.visitorsIn,
            convierten: n.data.simResult.visitorsConverted,
            noConvierten: n.data.simResult.visitorsNotConverted,
            revenue: n.data.simResult.revenue,
            tasaConversion: n.data.simResult.conversionRate,
          }
        : undefined,
    })),
    edges: edges.map(e => ({
      sourceLabel: nodeMap.get(e.source) ?? e.source,
      targetLabel: nodeMap.get(e.target) ?? e.target,
      pathType: e.data?.pathType ?? 'default',
    })),
    simResults: simResults
      ? {
          revenue: simResults.totalRevenue,
          cost: simResults.totalCost,
          profit: simResults.netProfit,
          roas: simResults.roas,
          roi: simResults.roi,
          visitors: simResults.totalVisitors,
          leads: simResults.totalLeads,
          clients: simResults.totalCustomers,
        }
      : null,
  }
}

// ─── Formatea la hora ─────────────────────────────────────────────────────────

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// ─── Chips de acciones rápidas ────────────────────────────────────────────────

const ACTION_CHIPS = [
  { id: 'analyze',         label: 'Analizar',      credits: 3, icon: BarChart3 },
  { id: 'suggestions',     label: 'Sugerencias',   credits: 2, icon: Lightbulb },
  { id: 'generate_funnel', label: 'Generar funnel',credits: 5, icon: Wand2 },
  { id: 'summary',         label: 'Resumen',        credits: 3, icon: FileText },
] as const

const ACTION_MESSAGES: Record<string, string> = {
  analyze:     'Analizá mi funnel actual y dame un diagnóstico completo: cuellos de botella, métricas irrealistas, oportunidades de mejora, y nodos que debería agregar.',
  suggestions: 'Dame las 3-5 mejoras más impactantes para mejorar el ROI de este funnel, con números específicos.',
  summary:     'Generá un resumen ejecutivo de este funnel para presentar a un cliente. Incluí: estrategia del funnel, métricas clave, resultados proyectados, y próximos pasos recomendados.',
}

// ─── Componente principal (contenido sin wrapper fixed) ───────────────────────

export function AIPanelContent() {
  const router = useRouter()
  const supabase = createClient()

  const isOpen        = useFunnelStore(s => s.isAIPanelOpen)
  const toggleAIPanel = useFunnelStore(s => s.toggleAIPanel)
  const nodes         = useFunnelStore(s => s.nodes)
  const edges         = useFunnelStore(s => s.edges)
  const simResults    = useFunnelStore(s => s.simResults)
  const projectName   = useFunnelStore(s => s.projectName)
  const projectId     = useFunnelStore(s => s.supabaseProjectId)

  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [creditsLeft, setCreditsLeft]   = useState<number | null>(null)
  const [isPlanStarter, setIsPlanStarter] = useState(false)
  const [error, setError]               = useState('')

  // Generar funnel: modo de ingreso de descripción
  const [genFunnelMode, setGenFunnelMode]   = useState(false)
  const [genFunnelInput, setGenFunnelInput] = useState('')

  // Limpiar historial
  const [clearConfirm, setClearConfirm] = useState(false)

  const clearHistory = useCallback(async () => {
    if (!clearConfirm) { setClearConfirm(true); return }
    setClearConfirm(false)
    setMessages([])
    setError('')
    if (projectId) {
      await Promise.all([
        supabase.from('ai_chat_messages').delete().eq('project_id', projectId),
        supabase.from('ai_chat_summaries').delete().eq('project_id', projectId),
      ])
    }
  }, [clearConfirm, projectId, supabase])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // ── Auto-scroll al último mensaje ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Cargar créditos e historial al abrir ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    // Créditos
    fetch('/api/credits/status')
      .then(r => r.json())
      .then(data => {
        setCreditsLeft(data.credits_left ?? 0)
        setIsPlanStarter(data.plan === 'starter' && data.monthly_credits_total === 0)
      })
      .catch(() => {})

    // Historial desde Supabase
    if (!projectId) return
    setHistoryLoading(true)
    supabase
      .from('ai_chat_messages')
      .select('role, content, credits_used, action_type, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(60)
      .then(({ data }) => {
        if (data) {
          // Procesar mensajes históricos: extraer funnelData para mostrar la tarjeta de importación
          const processed = data.map(msg => {
            if (msg.role === 'assistant') {
              const { funnelData, preText } = extractFunnelJSON(msg.content)
              return { ...msg, content: funnelData ? preText : msg.content, funnelData }
            }
            return msg
          })
          setMessages(processed as ChatMessage[])
        }
        setHistoryLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId])

  // ── Focus al input cuando abre ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isPlanStarter) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isPlanStarter])

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (messageText: string, actionType: string = 'chat') => {
    if (!messageText.trim() || loading) return
    setError('')

    const userMsg: ChatMessage = { role: 'user', content: messageText, action_type: actionType, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const funnelContext = buildFunnelContext(nodes, edges, simResults, projectName)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: messageText,
          actionType,
          funnelContext,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'sin_creditos') {
          setCreditsLeft(0)
          setError(data.message ?? 'Sin créditos disponibles.')
        } else {
          setError(data.error ?? 'Error al enviar el mensaje.')
        }
        setMessages(prev => prev.slice(0, -1))
        return
      }

      // Detectar JSON de funnel — mostrar tarjeta en lugar de auto-importar
      const { funnelData, preText } = extractFunnelJSON(data.content)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: funnelData ? preText : data.content,
        funnelData: funnelData ?? null,
        credits_used: data.credits_used,
        action_type: actionType,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      if (data.credits_left != null) setCreditsLeft(data.credits_left)
    } catch {
      setError('Error de red. Verificá tu conexión.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [loading, nodes, edges, simResults, projectName, projectId])

  // ── Acción rápida ──────────────────────────────────────────────────────────
  const handleAction = (actionId: string) => {
    if (actionId === 'generate_funnel') {
      setGenFunnelMode(true)
      return
    }
    sendMessage(ACTION_MESSAGES[actionId], actionId)
  }

  // ── Enviar "Generar funnel" ────────────────────────────────────────────────
  const handleGenFunnel = () => {
    if (!genFunnelInput.trim()) return
    const msg = `Generá un funnel completo para este negocio: ${genFunnelInput}. Respondé SOLO con un bloque JSON dentro de \`\`\`json con esta estructura: { funnel_name, nodes: [{ type, label, config }], connections: [{ from_index, to_index, path_type }] }`
    sendMessage(msg, 'generate_funnel')
    setGenFunnelMode(false)
    setGenFunnelInput('')
  }

  // ── Enter en textarea ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const noCredits = creditsLeft !== null && creditsLeft <= 0

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#111111' }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1e1e1e' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
              <Sparkles size={13} className="text-orange-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-100">FunnelLab AI</span>
          </div>
          <div className="flex items-center gap-2">
            {creditsLeft !== null && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                noCredits
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              )}>
                <Sparkles size={9} />
                <span>{creditsLeft} créditos</span>
              </div>
            )}
            {/* Limpiar historial */}
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                onBlur={() => setClearConfirm(false)}
                title={clearConfirm ? 'Clic para confirmar' : 'Limpiar historial'}
                className={cn(
                  'flex items-center gap-1 p-1.5 rounded-lg text-[11px] transition-colors',
                  clearConfirm
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                )}
              >
                <Trash2 size={13} />
                {clearConfirm && <span className="pr-0.5">¿Borrar?</span>}
              </button>
            )}
            <button
              onClick={() => toggleAIPanel(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Plan Starter sin créditos: modal de upgrade ──────────────────── */}
        {isPlanStarter ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-5 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Sparkles size={22} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1.5">Activá la IA</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                El plan Starter no incluye créditos de IA. Hacé upgrade a Pro o Max para usar el asistente.
              </p>
            </div>
            <button
              onClick={() => { toggleAIPanel(false); router.push('/pricing') }}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all"
            >
              Ver planes
            </button>
          </div>
        ) : (
          <>
            {/* ── Mensajes ──────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {historyLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-slate-600" />
                </div>
              )}

              {!historyLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <Sparkles size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-300 mb-1">¿En qué puedo ayudarte?</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Preguntame sobre tu funnel o usá las acciones rápidas de abajo.</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  {/* Burbuja de texto — no mostrar si es un mensaje de funnel sin pre-texto */}
                  {(msg.role === 'user' || msg.content.trim()) && (
                    <div
                      className={cn(
                        'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-[#1e1e1e] text-slate-200 rounded-br-sm'
                          : 'bg-[#141414] text-slate-300 rounded-bl-sm border border-[#242424]'
                      )}
                    >
                      {msg.role === 'assistant'
                        ? renderMarkdown(msg.content)
                        : <p className="whitespace-pre-wrap">{msg.content}</p>
                      }
                    </div>
                  )}
                  {/* Tarjeta de importación de funnel */}
                  {msg.role === 'assistant' && msg.funnelData && (
                    <div className="w-full max-w-[92%]">
                      <FunnelImportCard funnelData={msg.funnelData} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    {msg.role === 'assistant' && msg.credits_used ? (
                      <span className="text-[10px] text-slate-700">−{msg.credits_used} crédito{msg.credits_used !== 1 ? 's' : ''}</span>
                    ) : null}
                    {msg.created_at && (
                      <span className="text-[10px] text-slate-700">{formatTime(msg.created_at)}</span>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-[#181818] border border-[#242424]">
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin text-slate-600" />
                      <span className="text-[12px] text-slate-600">FunnelLab AI está pensando…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {error && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] leading-relaxed flex items-start gap-2">
                <span className="flex-1">{error}</span>
                {noCredits && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => { toggleAIPanel(false); router.push('/settings') }} className="text-[11px] text-red-300 underline whitespace-nowrap">Comprar más</button>
                    <span className="text-red-600">·</span>
                    <button onClick={() => { toggleAIPanel(false); router.push('/pricing') }} className="text-[11px] text-red-300 underline whitespace-nowrap">Upgrade</button>
                  </div>
                )}
              </div>
            )}

            {/* ── Modo "Generar funnel": input de descripción ──────────────── */}
            {genFunnelMode && (
              <div className="mx-4 mb-2 p-3 rounded-xl bg-[#181818] border border-[#2e2e2e] space-y-2">
                <p className="text-[11px] text-slate-400">Describí tu negocio y lo genero:</p>
                <textarea
                  autoFocus
                  value={genFunnelInput}
                  onChange={e => setGenFunnelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenFunnel() } }}
                  placeholder="Ej: Vendo cursos online de finanzas personales, tráfico de Facebook, landing page + email sequence..."
                  rows={3}
                  className="w-full bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg px-2.5 py-2 text-[12px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-orange-500/40 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setGenFunnelMode(false); setGenFunnelInput('') }}
                    className="flex-1 py-1.5 rounded-lg text-[12px] text-slate-500 hover:text-slate-300 transition-colors border border-[#2e2e2e]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenFunnel}
                    disabled={!genFunnelInput.trim()}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                  >
                    <ChevronRight size={13} />
                    Generar
                  </button>
                </div>
              </div>
            )}

            {/* ── Chips de acciones rápidas ────────────────────────────────── */}
            <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
              {ACTION_CHIPS.map(chip => {
                const Icon = chip.icon
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleAction(chip.id)}
                    disabled={loading || noCredits || (creditsLeft !== null && creditsLeft < chip.credits)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                      'border border-[#2e2e2e] text-slate-400 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/5',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#2e2e2e] disabled:hover:text-slate-400 disabled:hover:bg-transparent'
                    )}
                  >
                    <Icon size={10} />
                    {chip.label}
                    <span className="text-[10px] text-slate-600">({chip.credits})</span>
                  </button>
                )
              })}
            </div>

            {/* ── Input ────────────────────────────────────────────────────── */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className={cn(
                'flex items-end gap-2 bg-[#181818] border rounded-2xl px-3 py-2.5 transition-colors',
                noCredits ? 'border-[#2e2e2e] opacity-60' : 'border-[#2e2e2e] focus-within:border-orange-500/30'
              )}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || noCredits}
                  placeholder={noCredits ? 'Sin créditos disponibles' : 'Preguntale algo al asistente…'}
                  rows={1}
                  className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder:text-slate-700 focus:outline-none resize-none leading-relaxed"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || noCredits}
                  className="flex-shrink-0 w-7 h-7 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                >
                  <Send size={12} className="text-white" />
                </button>
              </div>
              {noCredits && !isPlanStarter && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button onClick={() => { toggleAIPanel(false); router.push('/settings') }} className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors">Comprar créditos</button>
                  <span className="text-slate-700">·</span>
                  <button onClick={() => { toggleAIPanel(false); router.push('/pricing') }} className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors">Hacer upgrade</button>
                </div>
              )}
            </div>
          </>
        )}
    </div>
  )
}

// ─── Wrapper con aside fixed (backwards compat) ───────────────────────────────

export default function AIPanel() {
  const isOpen        = useFunnelStore(s => s.isAIPanelOpen)
  const toggleAIPanel = useFunnelStore(s => s.toggleAIPanel)

  if (!isOpen) return null

  return (
    <>
      {/* Overlay mobile */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={() => toggleAIPanel(false)}
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-[360px] border-l z-50 flex flex-col shadow-2xl"
        style={{ backgroundColor: '#111111', borderColor: '#222' }}
      >
        <AIPanelContent />
      </aside>
    </>
  )
}
