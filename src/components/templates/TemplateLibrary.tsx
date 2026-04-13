'use client'

import { useState } from 'react'
import { X, LayoutTemplate, Tag, Zap } from 'lucide-react'
import { BLUEPRINTS } from '@/lib/templates'
import { useFunnelStore } from '@/stores/funnelStore'
import type { BlueprintCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<BlueprintCategory | 'all', string> = {
  all: 'Todos',
  general: 'General',
  ecommerce: 'E-commerce',
  servicios: 'Servicios',
  infoproductos: 'Infoproductos',
  saas: 'SaaS',
  local: 'Negocio Local',
  ia: 'Inteligencia Artificial',
  organico: 'Tráfico Orgánico',
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-zinc-800 text-zinc-400',
  ecommerce: 'bg-zinc-800 text-zinc-400',
  servicios: 'bg-zinc-800 text-zinc-400',
  infoproductos: 'bg-orange-950 text-orange-400',
  saas: 'bg-zinc-800 text-zinc-400',
  local: 'bg-zinc-800 text-zinc-400',
}

export default function TemplateLibrary() {
  const isOpen = useFunnelStore(s => s.isTemplateLibraryOpen)
  const toggleTemplateLibrary = useFunnelStore(s => s.toggleTemplateLibrary)
  const loadBlueprint = useFunnelStore(s => s.loadBlueprint)

  const [selectedCategory, setSelectedCategory] = useState<BlueprintCategory | 'all'>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!isOpen) return null

  const filtered = selectedCategory === 'all'
    ? BLUEPRINTS
    : BLUEPRINTS.filter(b => b.category === selectedCategory)

  const categories = ['all', ...Array.from(new Set(BLUEPRINTS.map(b => b.category)))] as const

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => toggleTemplateLibrary(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-16 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[820px]
                      bg-[#0f0f0f] border border-[#2e2e2e] rounded-2xl shadow-2xl z-50 flex flex-col
                      animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e] flex-shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={16} className="text-orange-400" />
            <h2 className="text-[14px] font-bold text-slate-100">Biblioteca de Blueprints</h2>
          </div>
          <button
            onClick={() => toggleTemplateLibrary(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filtros de categoría */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-[#2e2e2e] flex-shrink-0 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as BlueprintCategory | 'all')}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              )}
            >
              {CATEGORY_LABELS[cat as BlueprintCategory | 'all']}
            </button>
          ))}
        </div>

        {/* Grid de blueprints */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(blueprint => (
              <div
                key={blueprint.id}
                onMouseEnter={() => setHoveredId(blueprint.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'relative rounded-xl border p-4 cursor-pointer transition-all duration-200',
                  'bg-[#141414] border-[#2e2e2e]',
                  hoveredId === blueprint.id
                    ? 'border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-950/20'
                    : 'hover:border-zinc-600'
                )}
              >
                {/* Categoría badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[13px] font-bold text-slate-100">{blueprint.title}</h3>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                    CATEGORY_COLORS[blueprint.category] ?? 'bg-slate-700 text-slate-300'
                  )}>
                    {CATEGORY_LABELS[blueprint.category]}
                  </span>
                </div>

                <p className="text-[12px] text-slate-400 leading-relaxed mb-2">
                  {blueprint.description}
                </p>

                <p className="text-[11px] text-slate-500 mb-3">
                  <span className="text-slate-600">Ideal para:</span> {blueprint.idealFor}
                </p>

                {/* Tags */}
                <div className="flex items-center flex-wrap gap-1 mb-3">
                  {blueprint.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full"
                    >
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Nodos del blueprint */}
                <div className="flex items-center gap-1 text-[10px] text-slate-600 mb-3">
                  <span>{blueprint.nodes.length} nodos</span>
                  <span>·</span>
                  <span>{blueprint.edges.length} conexiones</span>
                </div>

                {/* Botón de acción */}
                <button
                  onClick={() => loadBlueprint(blueprint)}
                  className={cn(
                    'w-full py-2 rounded-lg text-[12px] font-semibold transition-all',
                    hoveredId === blueprint.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  )}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap size={12} />
                    Cargar este blueprint
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2e2e2e] flex-shrink-0 bg-[#141414]/50">
          <p className="text-[11px] text-slate-600">
            Los blueprints reemplazan el canvas actual. Podés deshacer con <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 font-mono text-slate-500">Ctrl+Z</kbd> si cometés un error.
          </p>
        </div>
      </div>
    </>
  )
}
