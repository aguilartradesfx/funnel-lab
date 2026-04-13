'use client'

import { AlertTriangle, XCircle, X, Play } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { hasBlockingErrors } from '@/lib/validation'

export default function ValidationModal() {
  const issues = useFunnelStore(s => s.validationIssues)
  const clearValidationIssues = useFunnelStore(s => s.clearValidationIssues)
  const simulate = useFunnelStore(s => s.simulate)

  if (!issues || issues.length === 0) return null

  const blocking = hasBlockingErrors(issues)
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')

  function handleSimulateAnyway() {
    clearValidationIssues()
    // Limpiar issues temporalmente para que simulate() no vuelva a mostrar el modal
    // y avanzar directo a la animación
    simulate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl animate-fade-in"
        style={{ backgroundColor: '#1a1a1a', borderColor: '#2e2e2e' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: '#2a2a2a' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: blocking ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
              color: blocking ? '#f87171' : '#facc15',
            }}
          >
            {blocking ? <XCircle size={16} /> : <AlertTriangle size={16} />}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-100">
              {blocking ? 'El flujo tiene errores' : 'El flujo tiene advertencias'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {blocking
                ? 'Corregí los errores para poder simular'
                : 'Podés simular igualmente, pero los resultados pueden ser incorrectos'}
            </p>
          </div>
          <button
            onClick={clearValidationIssues}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Lista de issues */}
        <div className="px-5 py-3 space-y-2 max-h-72 overflow-y-auto">
          {errors.map(issue => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
          {warnings.map(issue => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: '#2a2a2a' }}
        >
          <button
            onClick={clearValidationIssues}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cerrar
          </button>

          {!blocking && (
            <button
              onClick={handleSimulateAnyway}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                         bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-sm"
            >
              <Play size={11} fill="currentColor" />
              Simular igualmente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function IssueRow({ issue }: { issue: { severity: string; title: string; description: string } }) {
  const isError = issue.severity === 'error'
  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{
        backgroundColor: isError ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)',
        borderLeft: `2px solid ${isError ? '#ef4444' : '#eab308'}`,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isError
          ? <XCircle size={13} style={{ color: '#f87171' }} />
          : <AlertTriangle size={13} style={{ color: '#facc15' }} />
        }
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold" style={{ color: isError ? '#fca5a5' : '#fde047' }}>
          {issue.title}
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
          {issue.description}
        </p>
      </div>
    </div>
  )
}
