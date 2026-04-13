'use client'

import { X, Sparkles, Wand2, BarChart3, MessageSquare, Lock } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'

const COMING_SOON_FEATURES = [
  {
    icon: BarChart3,
    title: 'Análisis automático',
    description: 'Detecta cuellos de botella y métricas poco realistas en tu funnel.',
  },
  {
    icon: Wand2,
    title: 'Diseño asistido',
    description: 'Describí tu negocio y la IA sugiere qué nodos usar y en qué orden.',
  },
  {
    icon: MessageSquare,
    title: 'Chat de funnel',
    description: 'Preguntá sobre métricas, benchmarks LATAM y cómo mejorar tu ROAS.',
  },
]

export default function AIPanel() {
  const isOpen = useFunnelStore(s => s.isAIPanelOpen)
  const toggleAIPanel = useFunnelStore(s => s.toggleAIPanel)

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={() => toggleAIPanel(false)}
      />

      <aside className="fixed right-0 top-0 bottom-0 w-[320px] border-l z-50 flex flex-col shadow-2xl animate-slide-right"
        style={{ backgroundColor: '#141414', borderColor: '#2a2a2a' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#222' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}
            >
              <Sparkles size={13} className="text-orange-400" />
            </div>
            <span className="text-[13px] font-bold text-slate-100">Asistente IA</span>
          </div>
          <button
            onClick={() => toggleAIPanel(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenido: Próximamente */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ backgroundColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' }}
          >
            <Lock size={10} className="text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-400 tracking-widest uppercase">
              Próximamente
            </span>
          </div>

          {/* Título */}
          <div className="text-center">
            <h3 className="text-[15px] font-bold text-slate-100 mb-1.5">
              IA para funnels
            </h3>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Estamos trabajando en un asistente que analiza tu funnel, sugiere mejoras y responde preguntas en español.
            </p>
          </div>

          {/* Features */}
          <div className="w-full space-y-2.5">
            {COMING_SOON_FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#1c1c1c', border: '1px solid #272727' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#252525' }}
                >
                  <Icon size={13} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-300">{title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}
