'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from 'recharts'
import { ChevronDown, ChevronUp, TrendingUp, Users, DollarSign, Target, Activity } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent, formatRoas, getProfitColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Tarjeta de métrica ───────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color = 'default',
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  color?: 'green' | 'red' | 'orange' | 'default'
  icon?: React.ElementType
}) {
  const colorMap = {
    green:  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    red:    { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
    orange: { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    default:{ text: 'text-slate-200',   bg: 'bg-zinc-800/40',    border: 'border-zinc-700/50' },
  }
  const c = colorMap[color]

  return (
    <div className={cn('rounded-xl p-3 border flex-shrink-0', c.bg, c.border)}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold leading-none">{label}</p>
          <p className={cn('text-[18px] font-bold leading-tight mt-1 tabular-nums', c.text)}>{value}</p>
          {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', c.bg)}>
            <Icon size={14} className={c.text} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Gráfico de barras de revenue por nodo ────────────────────────────────

const CHART_COLORS = ['#f97316', '#888888', '#6b7280', '#4b5563', '#ea580c', '#52525b', '#71717a']

function RevenueChart({ data }: { data: Array<{ name: string; revenue: number }> }) {
  if (data.length === 0) return null
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
          />
          <Tooltip
            contentStyle={{ background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: unknown) => [formatCurrencyFull(Number(value)), 'Revenue']}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Gráfico de embudo de conversión ─────────────────────────────────────

function ConversionFunnelChart({ data }: { data: Array<{ name: string; value: number; fill: string }> }) {
  if (data.length === 0) return null
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip
            contentStyle={{ background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 12 }}
            formatter={(value: unknown) => [formatNumber(Number(value)), 'Visitantes']}
          />
          <Funnel dataKey="value" data={data} isAnimationActive>
            <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" fontSize={11} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Tabla de resultados por nodo ─────────────────────────────────────────

function NodeResultsTable() {
  const nodes = useFunnelStore(s => s.nodes)
  const simResults = useFunnelStore(s => s.simResults)

  if (!simResults) return null

  const rows = nodes
    .filter(n => simResults.nodeResults[n.id])
    .map(n => ({
      label: n.data.label,
      type: n.data.nodeType,
      result: simResults.nodeResults[n.id],
    }))
    .filter(r => r.result.visitorsIn > 0 || r.result.revenue > 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-1.5 px-2 text-slate-500 font-semibold">Nodo</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Visitas</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Conv.</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Conv%</th>
            <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
            >
              <td className="py-1.5 px-2 text-slate-300 truncate max-w-[120px]">{row.label}</td>
              <td className="py-1.5 px-2 text-right text-slate-400 tabular-nums">{formatNumber(row.result.visitorsIn)}</td>
              <td className="py-1.5 px-2 text-right text-slate-400 tabular-nums">{formatNumber(row.result.visitorsConverted)}</td>
              <td className="py-1.5 px-2 text-right tabular-nums">
                <span className={row.result.conversionRate >= 20 ? 'text-emerald-400' : row.result.conversionRate >= 5 ? 'text-orange-400' : 'text-slate-400'}>
                  {formatPercent(row.result.conversionRate)}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right text-emerald-400 font-semibold tabular-nums">
                {row.result.revenue > 0 ? formatCurrency(row.result.revenue) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────

export default function SimulationPanel() {
  const isOpen = useFunnelStore(s => s.isSimPanelOpen)
  const simResults = useFunnelStore(s => s.simResults)
  const hasSimulated = useFunnelStore(s => s.hasSimulated)
  const toggleSimPanel = useFunnelStore(s => s.toggleSimPanel)
  const nodes = useFunnelStore(s => s.nodes)

  const [activeTab, setActiveTab] = useState<'metrics' | 'charts' | 'table'>('metrics')

  if (!hasSimulated && !isOpen) return null

  const res = simResults

  // Datos para el gráfico de revenue
  const revenueChartData = nodes
    .filter(n => res?.nodeResults[n.id] && res.nodeResults[n.id].revenue > 0)
    .map(n => ({
      name: n.data.label.length > 14 ? n.data.label.slice(0, 12) + '…' : n.data.label,
      revenue: res!.nodeResults[n.id].revenue,
    }))

  // Datos para el embudo de conversión
  const funnelChartData = nodes
    .filter(n => res?.nodeResults[n.id] && res.nodeResults[n.id].visitorsIn > 0)
    .slice(0, 6)
    .map((n, i) => ({
      name: n.data.label.length > 14 ? n.data.label.slice(0, 12) + '…' : n.data.label,
      value: res!.nodeResults[n.id].visitorsIn,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))

  const profitColor = res
    ? res.netProfit > 0 ? 'green' : res.netProfit === 0 ? 'orange' : 'red'
    : 'default'

  return (
    <div
      className={cn(
        'border-t border-[#2e2e2e] bg-[#0f0f0f] flex-shrink-0 transition-all duration-300',
        isOpen ? 'h-[280px]' : 'h-9'
      )}
    >
      {/* Toggle bar */}
      <button
        onClick={() => toggleSimPanel()}
        className="w-full h-9 flex items-center justify-between px-4 hover:bg-slate-800/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Activity size={13} className="text-orange-400" />
          <span className="text-[12px] font-semibold text-slate-300">
            Resultados de Simulación
          </span>
          {res && (
            <div className="flex items-center gap-2 ml-2">
              <span className={cn('text-[12px] font-bold tabular-nums', getProfitColor(res.roi))}>
                {formatCurrency(res.netProfit)} neto
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[12px] text-slate-400 tabular-nums">
                ROAS {formatRoas(res.roas)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[12px] text-slate-400 tabular-nums">
                ROI {formatPercent(res.roi)}
              </span>
            </div>
          )}
        </div>
        <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Contenido */}
      {isOpen && res && (
        <div className="flex flex-col h-[calc(280px-36px)] overflow-hidden animate-slide-bottom">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pt-1 border-b border-[#2e2e2e] flex-shrink-0">
            {(['metrics', 'charts', 'table'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 text-[11px] font-semibold rounded-t transition-colors -mb-px border-b-2',
                  activeTab === tab
                    ? 'text-orange-400 border-orange-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                )}
              >
                {tab === 'metrics' ? 'Métricas' : tab === 'charts' ? 'Gráficos' : 'Detalles'}
              </button>
            ))}
          </div>

          {/* Tab: Métricas */}
          {activeTab === 'metrics' && (
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-2 p-3 h-full items-start">
                {/* Columna izquierda: Rentabilidad */}
                <div className="grid grid-cols-2 gap-2 flex-shrink-0" style={{ width: 360 }}>
                  <MetricCard
                    label="Revenue Total"
                    value={formatCurrency(res.totalRevenue)}
                    sub={formatCurrencyFull(res.totalRevenue)}
                    color="green"
                    icon={DollarSign}
                  />
                  <MetricCard
                    label="Costo Total"
                    value={formatCurrency(res.totalCost)}
                    sub={formatCurrencyFull(res.totalCost)}
                    color="red"
                    icon={TrendingUp}
                  />
                  <MetricCard
                    label="Profit Neto"
                    value={formatCurrency(res.netProfit)}
                    sub={`ROI: ${formatPercent(res.roi)}`}
                    color={profitColor as 'green' | 'red' | 'orange'}
                    icon={Activity}
                  />
                  <MetricCard
                    label="ROAS"
                    value={formatRoas(res.roas)}
                    sub="Return on Ad Spend"
                    color={res.roas >= 3 ? 'green' : res.roas >= 1 ? 'orange' : 'red'}
                  />
                </div>

                {/* Divisor */}
                <div className="w-px h-full bg-[#2e2e2e] flex-shrink-0 mx-1" />

                {/* Columna derecha: KPIs */}
                <div className="grid grid-cols-3 gap-2 flex-shrink-0" style={{ width: 420 }}>
                  <MetricCard
                    label="CPA"
                    value={res.totalCustomers > 0 ? formatCurrency(res.cpa) : '—'}
                    sub="Costo por Adquisición"
                    color="orange"
                    icon={Target}
                  />
                  <MetricCard
                    label="CPL"
                    value={res.totalLeads > 0 ? formatCurrency(res.cpl) : '—'}
                    sub="Costo por Lead"
                    color="orange"
                  />
                  <MetricCard
                    label="EPC"
                    value={formatCurrency(res.epc, 2)}
                    sub="Earnings per Click"
                    color="orange"
                  />
                  <MetricCard
                    label="AOV"
                    value={res.aov > 0 ? formatCurrency(res.aov) : '—'}
                    sub="Valor Promedio de Orden"
                    color="default"
                  />
                  <MetricCard
                    label="Visitantes"
                    value={formatNumber(res.totalVisitors)}
                    sub="Tráfico total"
                    color="default"
                    icon={Users}
                  />
                  <MetricCard
                    label="Clientes"
                    value={formatNumber(res.totalCustomers)}
                    sub={`${res.totalLeads} leads`}
                    color="default"
                  />
                </div>

                {/* Break-even */}
                {res.breakEvenVisitors > 0 && (
                  <>
                    <div className="w-px h-full bg-[#2e2e2e] flex-shrink-0 mx-1" />
                    <div className="flex-shrink-0 w-48">
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 h-full flex flex-col justify-center">
                        <p className="text-[10px] text-orange-400/70 uppercase tracking-wider font-semibold">Break-even</p>
                        <p className="text-[22px] font-bold text-orange-400 tabular-nums mt-1">
                          {formatNumber(res.breakEvenVisitors)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">visitas para cubrir costos</p>
                        <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${Math.min(100, (res.totalVisitors / res.breakEvenVisitors) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {Math.round((res.totalVisitors / res.breakEvenVisitors) * 100)}% alcanzado
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab: Gráficos */}
          {activeTab === 'charts' && (
            <div className="flex-1 overflow-hidden flex gap-4 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold mb-2">Revenue por nodo</p>
                <RevenueChart data={revenueChartData} />
              </div>
              <div className="w-px bg-[#2e2e2e] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold mb-2">Embudo de conversión</p>
                <ConversionFunnelChart data={funnelChartData} />
              </div>
            </div>
          )}

          {/* Tab: Tabla */}
          {activeTab === 'table' && (
            <div className="flex-1 overflow-y-auto p-3">
              <NodeResultsTable />
            </div>
          )}
        </div>
      )}

      {/* Estado: no hay resultados todavía */}
      {isOpen && !res && (
        <div className="flex-1 flex items-center justify-center text-[12px] text-slate-600 py-8">
          Presioná <kbd className="mx-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-400">Simular</kbd> para ver los resultados
        </div>
      )}
    </div>
  )
}
