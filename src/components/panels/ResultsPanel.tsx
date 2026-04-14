'use client'

import { useState } from 'react'
import { Activity, Download, ChevronDown, ChevronRight, Clock, X } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent, formatRoas } from '@/lib/utils'
import type { GlobalSimResults, SimRun } from '@/lib/types'

// ─── Generación de PDF (HTML → print dialog) ─────────────────────────────

function generateReportHTML(run: SimRun, logoUrl: string): string {
  const r = run.results
  const isProfit = r.netProfit >= 0
  const date = new Date(run.timestamp).toLocaleString('es-CR')

  // ── SVG helpers ──────────────────────────────────────────────────────────

  // Donut / arc chart
  const donut = (val: string, pct: number, color: string): string => {
    const radius = 32
    const circ = 2 * Math.PI * radius
    const dash = Math.min(Math.max(pct, 0), 1) * circ
    const gap = circ - dash
    return `<svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="45" r="${radius}" fill="none" stroke="#222" stroke-width="7"/>
      <circle cx="45" cy="45" r="${radius}" fill="none" stroke="${color}" stroke-width="7"
        stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}"
        stroke-linecap="round"
        transform="rotate(-90 45 45)"/>
      <text x="45" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#fff"
        font-family="-apple-system,BlinkMacSystemFont,sans-serif">${val}</text>
    </svg>`
  }

  // Horizontal bar row
  const bar = (label: string, val: number, max: number, color: string, formatted: string): string => {
    const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
        <span style="font-size:11px;color:#666;font-weight:500">${label}</span>
        <span style="font-size:13px;font-weight:700;color:#fff">${formatted}</span>
      </div>
      <div style="background:#1f1f1f;border-radius:6px;height:10px;overflow:hidden">
        <div style="width:${pct.toFixed(1)}%;background:${color};height:100%;border-radius:6px"></div>
      </div>
    </div>`
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const roasPct   = Math.min(r.roas / 15, 1)
  const profitPct = r.totalRevenue > 0 ? Math.min(Math.max(r.netProfit / r.totalRevenue, 0), 1) : 0
  const bePct     = r.breakEvenVisitors > 0 ? Math.min(r.totalVisitors / r.breakEvenVisitors, 1) : 0
  const beCirc    = 2 * Math.PI * 26
  const beDash    = bePct * beCirc

  const convLeads = r.totalVisitors > 0 ? formatPercent((r.totalLeads    / r.totalVisitors) * 100) : '—'
  const convCust  = r.totalVisitors > 0 ? formatPercent((r.totalCustomers / r.totalVisitors) * 100) : '—'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte — ${run.projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e7eb; background: #0a0a0a; }
    .page { max-width: 800px; margin: 0 auto; background: #0a0a0a; }

    /* Header */
    .hdr { background: #000; padding: 26px 36px 22px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1f1f1f; }
    .hdr-logo { height: 26px; width: auto; }
    .hdr-right { text-align: right; }
    .hdr-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 3px; }
    .hdr-meta { font-size: 11px; color: #555; }
    .hdr-bar { height: 3px; background: linear-gradient(90deg, #f97316 0%, #ea580c 100%); }

    /* Body */
    .body { padding: 28px 36px; }
    .section { margin-bottom: 28px; }
    .s-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #f97316; margin-bottom: 14px; }

    /* Donut cards row */
    .donuts { display: flex; border: 1px solid #1f1f1f; border-radius: 12px; overflow: hidden; }
    .d-card { flex: 1; padding: 18px 12px 14px; text-align: center; border-right: 1px solid #1f1f1f; background: #111; }
    .d-card:last-child { border-right: none; }
    .d-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 8px; }
    .d-sub { font-size: 10px; font-weight: 600; margin-top: 5px; }
    .green { color: #4ade80; } .red { color: #f87171; } .orange { color: #f97316; } .indigo { color: #818cf8; }

    /* Metric cards grid */
    .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .mc { background: #111; border: 1px solid #1f1f1f; border-radius: 10px; padding: 14px 16px; }
    .mc-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; font-weight: 600; margin-bottom: 6px; }
    .mc-val { font-size: 22px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; }
    .mc-sub { font-size: 10px; color: #555; margin-top: 4px; }

    /* Bars */
    .bars-box { border: 1px solid #1f1f1f; border-radius: 12px; padding: 20px 24px; background: #111; }
    .bars-footer { display: flex; gap: 24px; margin-top: 6px; padding-top: 12px; border-top: 1px solid #1a1a1a; }
    .bars-footer span { font-size: 10px; color: #555; }

    /* Break-even */
    .be-box { display: flex; align-items: center; gap: 20px; border: 1px solid #1f1f1f; border-radius: 12px; padding: 16px 22px; background: #111; }
    .be-text-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .be-text-sub { font-size: 11px; color: #777; }

    /* Footer */
    .ftr { border-top: 1px solid #1a1a1a; padding: 12px 36px; display: flex; align-items: center; justify-content: space-between; background: #000; }
    .ftr-brand { font-size: 10px; color: #444; }
    .ftr-logo { height: 16px; opacity: 0.3; }

    @media print {
      body { background: #0a0a0a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: 100%; }
      .body { padding: 18px 24px; }
      .hdr { padding: 18px 24px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <img src="${logoUrl}" class="hdr-logo" alt="FunnelLab" onerror="this.style.display='none'"/>
    <div class="hdr-right">
      <div class="hdr-title">${run.projectName}</div>
      <div class="hdr-meta">${date} · ${run.nodeCount} nodos simulados</div>
    </div>
  </div>
  <div class="hdr-bar"></div>

  <div class="body">

    <!-- Donut KPIs -->
    <div class="section">
      <div class="s-title">Métricas clave</div>
      <div class="donuts">
        <div class="d-card">
          <div class="d-lbl">Revenue Total</div>
          ${donut(formatCurrency(r.totalRevenue), r.totalRevenue > 0 ? 1 : 0, '#f97316')}
          <div class="d-sub orange">${formatCurrencyFull(r.totalRevenue)}</div>
        </div>
        <div class="d-card">
          <div class="d-lbl">Profit Neto</div>
          ${donut((isProfit ? '+' : '') + formatCurrency(r.netProfit), profitPct, isProfit ? '#16a34a' : '#dc2626')}
          <div class="d-sub ${isProfit ? 'green' : 'red'}">ROI ${formatPercent(r.roi)}</div>
        </div>
        <div class="d-card">
          <div class="d-lbl">ROAS</div>
          ${donut(formatRoas(r.roas), roasPct, '#6366f1')}
          <div class="d-sub indigo">Return on Ad Spend</div>
        </div>
      </div>
    </div>

    <!-- Metric cards -->
    <div class="section">
      <div class="s-title">Desglose financiero</div>
      <div class="metrics">
        <div class="mc">
          <div class="mc-lbl">Costo Total</div>
          <div class="mc-val">${formatCurrency(r.totalCost)}</div>
          <div class="mc-sub">${formatCurrencyFull(r.totalCost)}</div>
        </div>
        <div class="mc">
          <div class="mc-lbl">CPA</div>
          <div class="mc-val orange">${r.totalCustomers > 0 ? formatCurrency(r.cpa) : '—'}</div>
          <div class="mc-sub">Costo por adquisición</div>
        </div>
        <div class="mc">
          <div class="mc-lbl">CPL</div>
          <div class="mc-val">${r.totalLeads > 0 ? formatCurrency(r.cpl) : '—'}</div>
          <div class="mc-sub">Costo por lead</div>
        </div>
      </div>
    </div>

    <!-- Audience funnel bars -->
    <div class="section">
      <div class="s-title">Embudo de audiencia</div>
      <div class="bars-box">
        ${bar('Visitantes', r.totalVisitors, r.totalVisitors, '#d1d5db', formatNumber(r.totalVisitors))}
        ${bar('Leads', r.totalLeads, r.totalVisitors, '#f97316', formatNumber(r.totalLeads))}
        ${bar('Clientes', r.totalCustomers, r.totalVisitors, '#16a34a', formatNumber(r.totalCustomers))}
        <div class="bars-footer">
          <span>Conv. a leads: <strong style="color:#f97316">${convLeads}</strong></span>
          <span>Conv. a clientes: <strong style="color:#16a34a">${convCust}</strong></span>
        </div>
      </div>
    </div>

    ${r.breakEvenVisitors > 0 ? `
    <!-- Break-even -->
    <div class="section">
      <div class="s-title">Punto de equilibrio</div>
      <div class="be-box">
        <svg width="68" height="68" viewBox="0 0 68 68" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
          <circle cx="34" cy="34" r="26" fill="none" stroke="#222" stroke-width="6"/>
          <circle cx="34" cy="34" r="26" fill="none" stroke="#f97316" stroke-width="6"
            stroke-dasharray="${beDash.toFixed(1)} ${(beCirc - beDash).toFixed(1)}"
            stroke-linecap="round"
            transform="rotate(-90 34 34)"/>
          <text x="34" y="38" text-anchor="middle" font-size="11" font-weight="700" fill="#fff"
            font-family="-apple-system,sans-serif">${Math.round(bePct * 100)}%</text>
        </svg>
        <div>
          <div class="be-text-title">Break-even: ${formatNumber(r.breakEvenVisitors)} visitas</div>
          <div class="be-text-sub">${r.totalVisitors >= r.breakEvenVisitors
            ? '✓ Break-even alcanzado en esta simulación'
            : `Faltan ${formatNumber(r.breakEvenVisitors - r.totalVisitors)} visitas para cubrir costos`
          }</div>
        </div>
      </div>
    </div>` : ''}

  </div>

  <!-- Footer -->
  <div class="ftr">
    <span class="ftr-brand">Generado con Funnel Labs · funnellabs.bralto.io</span>
    <img src="${logoUrl}" class="ftr-logo" alt="" onerror="this.style.display='none'"/>
  </div>

</div>
<script>window.onload = () => { window.print() }</script>
</body>
</html>`
}

function openPDF(run: SimRun) {
  const logoUrl = `${window.location.origin}/logo.png`
  const html = generateReportHTML(run, logoUrl)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) return
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
