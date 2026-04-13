'use client'

import { useState } from 'react'
import { Activity, Download, ChevronDown, ChevronRight, Clock, X } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent, formatRoas } from '@/lib/utils'
import type { GlobalSimResults, SimRun } from '@/lib/types'

// ─── Generación de PDF (HTML → print dialog) ─────────────────────────────

function generateReportHTML(run: SimRun): string {
  const r = run.results
  const isProfit = r.netProfit >= 0
  const date = new Date(run.timestamp).toLocaleString('es-CR')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte de Simulación — ${run.projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 40px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 32px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .metric { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 14px; }
    .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
    .metric-value { font-size: 18px; font-weight: 700; color: #111; font-variant-numeric: tabular-nums; }
    .metric-sub { font-size: 11px; color: #aaa; margin-top: 2px; }
    .profit-positive { color: #16a34a; }
    .profit-negative { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #eee; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
    td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${run.projectName}</h1>
  <p class="meta">Simulación ejecutada el ${date} · ${run.nodeCount} nodos</p>

  <div class="section">
    <div class="section-title">Resumen financiero</div>
    <div class="grid">
      <div class="metric">
        <div class="metric-label">Revenue Total</div>
        <div class="metric-value">${formatCurrency(r.totalRevenue)}</div>
        <div class="metric-sub">${formatCurrencyFull(r.totalRevenue)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Costo Total</div>
        <div class="metric-value">${formatCurrency(r.totalCost)}</div>
        <div class="metric-sub">${formatCurrencyFull(r.totalCost)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Profit Neto</div>
        <div class="metric-value ${isProfit ? 'profit-positive' : 'profit-negative'}">${isProfit ? '+' : ''}${formatCurrency(r.netProfit)}</div>
        <div class="metric-sub">ROI: ${formatPercent(r.roi)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">ROAS</div>
        <div class="metric-value">${formatRoas(r.roas)}</div>
        <div class="metric-sub">Return on Ad Spend</div>
      </div>
      <div class="metric">
        <div class="metric-label">CPA</div>
        <div class="metric-value">${r.totalCustomers > 0 ? formatCurrency(r.cpa) : '—'}</div>
        <div class="metric-sub">Costo por Adquisición</div>
      </div>
      <div class="metric">
        <div class="metric-label">CPL</div>
        <div class="metric-value">${r.totalLeads > 0 ? formatCurrency(r.cpl) : '—'}</div>
        <div class="metric-sub">Costo por Lead</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Audiencia</div>
    <div class="grid">
      <div class="metric">
        <div class="metric-label">Visitantes</div>
        <div class="metric-value">${formatNumber(r.totalVisitors)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Leads</div>
        <div class="metric-value">${formatNumber(r.totalLeads)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Clientes</div>
        <div class="metric-value">${formatNumber(r.totalCustomers)}</div>
      </div>
    </div>
  </div>

  ${r.breakEvenVisitors > 0 ? `
  <div class="section">
    <div class="section-title">Break-even</div>
    <div class="metric" style="display:inline-block; min-width:200px">
      <div class="metric-label">Visitas para cubrir costos</div>
      <div class="metric-value">${formatNumber(r.breakEvenVisitors)}</div>
      <div class="metric-sub">${Math.round((r.totalVisitors / r.breakEvenVisitors) * 100)}% alcanzado</div>
    </div>
  </div>` : ''}

  <script>window.onload=()=>{window.print()}</script>
</body>
</html>`
}

function openPDF(run: SimRun) {
  const html = generateReportHTML(run)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) return
  // Cleanup blob URL after print
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Fila de métrica ──────────────────────────────────────────────────────

function MetricRow({ label, value, accent }: {
  label: string
  value: string
  accent?: 'green' | 'red' | 'none'
}) {
  const valueClass =
    accent === 'green' ? 'text-emerald-400 font-bold' :
    accent === 'red'   ? 'text-red-400 font-bold' :
    'text-slate-300 font-semibold'

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-slate-600 truncate pr-2">{label}</span>
      <span className={`text-[12px] tabular-nums font-mono flex-shrink-0 ${valueClass}`}>{value}</span>
    </div>
  )
}

// ─── Vista de resultados ──────────────────────────────────────────────────

function ResultsView({ results, run }: { results: GlobalSimResults; run: SimRun }) {
  const isProfit = results.netProfit >= 0
  const date = new Date(run.timestamp)
  const timeStr = date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Timestamp */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#1e1e1e]">
        <Clock size={10} className="text-slate-700" />
        <span className="text-[10px] text-slate-700">{dateStr}, {timeStr} · {run.nodeCount} nodos</span>
      </div>

      {/* Resultado principal */}
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1"
          style={{ color: isProfit ? '#4ade80' : '#f87171' }}>
          {isProfit ? 'Profit' : 'Pérdida'}
        </p>
        <p className="text-[28px] font-bold font-mono tabular-nums leading-none"
          style={{ color: isProfit ? '#22c55e' : '#ef4444' }}>
          {isProfit ? '+' : ''}{formatCurrency(results.netProfit)}
        </p>
        <p className="text-[11px] text-slate-600 mt-1 font-mono">{formatCurrencyFull(results.netProfit)}</p>
      </div>

      {/* Métricas */}
      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">Financiero</p>
        <div className="divide-y divide-[#1a1a1a]">
          <MetricRow label="Revenue total" value={formatCurrency(results.totalRevenue)} />
          <MetricRow label="Costo total" value={formatCurrency(results.totalCost)} />
          <MetricRow label="ROI" value={formatPercent(results.roi)} />
          <MetricRow label="ROAS" value={formatRoas(results.roas)} />
          {results.totalCost > 0 && <MetricRow label="CPA" value={formatCurrency(results.cpa)} />}
          {results.totalLeads > 0 && <MetricRow label="CPL" value={formatCurrency(results.cpl)} />}
          {results.aov > 0 && <MetricRow label="AOV" value={formatCurrency(results.aov)} />}
          <MetricRow label="EPC" value={formatCurrency(results.epc, 2)} />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">Audiencia</p>
        <div className="divide-y divide-[#1a1a1a]">
          <MetricRow label="Visitantes" value={formatNumber(results.totalVisitors)} />
          <MetricRow label="Leads" value={formatNumber(results.totalLeads)} />
          <MetricRow label="Clientes" value={formatNumber(results.totalCustomers)} />
        </div>
      </div>

      {results.breakEvenVisitors > 0 && (
        <div className="px-4 py-2 border-b border-[#1e1e1e]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-1">Break-even</p>
          <MetricRow label="Visitas necesarias" value={formatNumber(results.breakEvenVisitors)} />
          <div className="mt-1.5 h-1 rounded-full bg-[#222]">
            <div
              className="h-full rounded-full bg-[#3a3a3a] transition-all"
              style={{ width: `${Math.min(100, (results.totalVisitors / results.breakEvenVisitors) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-700 mt-1">
            {Math.round((results.totalVisitors / results.breakEvenVisitors) * 100)}% alcanzado
          </p>
        </div>
      )}

      {/* PDF */}
      <div className="px-4 py-3">
        <button
          onClick={() => openPDF(run)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                     bg-[#1a1a1a] border border-[#2a2a2a] text-slate-400
                     hover:bg-[#222] hover:text-slate-200 hover:border-[#3a3a3a]
                     text-[11px] font-semibold transition-all"
        >
          <Download size={12} strokeWidth={1.8} />
          Descargar PDF
        </button>
      </div>
    </div>
  )
}

// ─── Historial de ejecuciones ─────────────────────────────────────────────

function HistorySection({ history, onSelect }: {
  history: SimRun[]
  onSelect: (run: SimRun) => void
}) {
  const [open, setOpen] = useState(true)
  if (history.length === 0) return null

  return (
    <div className="flex-shrink-0 border-t border-[#1e1e1e]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5
                   text-[10px] font-bold uppercase tracking-widest text-slate-700
                   hover:text-slate-500 transition-colors"
      >
        <span>Historial ({history.length})</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="overflow-y-auto max-h-48">
          {history.map((run) => {
            const d = new Date(run.timestamp)
            const label = d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) +
              ' · ' + d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
            const isProfit = run.results.netProfit >= 0
            return (
              <div
                key={run.id}
                className="group flex items-center gap-3 px-4 py-2 hover:bg-[#141414] cursor-pointer transition-colors"
                onClick={() => onSelect(run)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">{label}</p>
                </div>
                <span
                  className="text-[11px] font-mono font-semibold flex-shrink-0"
                  style={{ color: isProfit ? '#22c55e' : '#ef4444' }}
                >
                  {isProfit ? '+' : ''}{formatCurrency(run.results.netProfit)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openPDF(run) }}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 transition-all"
                  title="Descargar PDF"
                >
                  <Download size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────

export default function ResultsPanel() {
  const simResults = useFunnelStore(s => s.simResults)
  const hasSimulated = useFunnelStore(s => s.hasSimulated)
  const simHistory = useFunnelStore(s => s.simHistory)
  const isSimulating = useFunnelStore(s => s.isSimulating)
  const [viewingRun, setViewingRun] = useState<SimRun | null>(null)

  // El run a mostrar: uno del historial seleccionado, o el más reciente
  const displayRun = viewingRun ?? simHistory[0] ?? null

  return (
    <aside className="w-[252px] flex-shrink-0 h-full bg-[#0c0c0c] border-r border-[#1e1e1e] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-slate-600" />
          <span className="text-[12px] font-semibold text-slate-400">Resultados</span>
        </div>
        {viewingRun && (
          <button
            onClick={() => setViewingRun(null)}
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Último
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isSimulating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-600">
            <div className="w-4 h-4 border-2 border-[#2a2a2a] border-t-orange-500 rounded-full animate-spin" />
            <span className="text-[11px]">Simulando…</span>
          </div>
        )}

        {!isSimulating && !hasSimulated && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <Activity size={20} className="text-slate-700" />
            <p className="text-[12px] text-slate-600">
              Ejecutá la simulación para ver resultados
            </p>
            <p className="text-[10px] text-slate-700">
              Ctrl+Enter
            </p>
          </div>
        )}

        {!isSimulating && hasSimulated && displayRun && (
          <>
            <ResultsView results={displayRun.results} run={displayRun} />
            <HistorySection
              history={simHistory.slice(1)}
              onSelect={(run) => setViewingRun(run)}
            />
          </>
        )}
      </div>
    </aside>
  )
}
