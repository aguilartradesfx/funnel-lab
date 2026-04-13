'use client'

import { useState } from 'react'
import { X, Keyboard, BookOpen, Layers } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tab = 'shortcuts' | 'guide' | 'nodes'

// ─── Componentes de apoyo ─────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #3a3a3a',
        color: '#c8c8c8',
        boxShadow: '0 1px 0 #555',
        minWidth: '22px',
      }}
    >
      {children}
    </kbd>
  )
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode[]; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
      <span className="text-[12px] text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-600 text-[10px]">/</span>}
            {k}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Mini ilustración de nodo ─────────────────────────────────────────────────

function MiniNode({
  label,
  color,
  icon,
}: {
  label: string
  color: string
  icon: string
}) {
  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0"
      style={{
        width: 90,
        border: `1px solid ${color}44`,
        backgroundColor: '#1c1c1c',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ backgroundColor: '#252525', borderBottom: '1px solid #333' }}
      >
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
          style={{ backgroundColor: '#2e2e2e', color }}
        >
          {icon}
        </div>
        <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: '#555' }}>
          {label}
        </span>
      </div>
      <div className="px-2 py-1.5">
        <div className="h-1.5 rounded-full bg-[#2a2a2a] mb-1" style={{ width: '70%' }} />
        <div className="h-1.5 rounded-full bg-[#2a2a2a]" style={{ width: '50%' }} />
      </div>
    </div>
  )
}

// ─── Paso de la guía ──────────────────────────────────────────────────────────

function GuideStep({
  step,
  title,
  description,
  visual,
}: {
  step: number
  title: string
  description: string
  visual: React.ReactNode
}) {
  return (
    <div className="flex gap-4 py-4 border-b border-[#1e1e1e] last:border-0">
      <div className="flex-shrink-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
        >
          {step}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-200 mb-1">{title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{description}</p>
        {visual}
      </div>
    </div>
  )
}

// ─── Categoría de nodo ────────────────────────────────────────────────────────

function NodeCategory({
  color,
  emoji,
  title,
  description,
  examples,
}: {
  color: string
  emoji: string
  title: string
  description: string
  examples: string
}) {
  return (
    <div
      className="rounded-xl p-3 mb-2"
      style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          {emoji}
        </div>
        <div>
          <p className="text-[12px] font-semibold mb-0.5" style={{ color }}>{title}</p>
          <p className="text-[11px] text-slate-500 mb-1">{description}</p>
          <p className="text-[10px] text-slate-600">{examples}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'shortcuts', label: 'Atajos', icon: Keyboard },
  { id: 'guide',     label: 'Guía de uso', icon: BookOpen },
  { id: 'nodes',     label: 'Tipos de nodo', icon: Layers },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function HelpModal() {
  const isHelpOpen = useFunnelStore(s => s.isHelpOpen)
  const toggleHelp  = useFunnelStore(s => s.toggleHelp)
  const [tab, setTab] = useState<Tab>('shortcuts')

  if (!isHelpOpen) return null

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
  const Mod = isMac ? '⌘' : 'Ctrl'

  return (
    <>
      {/* Backdrop — flex centra el modal automáticamente */}
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
        onClick={() => toggleHelp(false)}
      >
      {/* Modal — w-full + max-w para responsividad; max-h + overflow para scroll */}
      <div
        className="animate-fade-in flex flex-col w-full"
        style={{
          maxWidth: 560,
          maxHeight: 'calc(100vh - 32px)',
          backgroundColor: '#141414',
          border: '1px solid #2e2e2e',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e1e1e' }}
        >
          <div>
            <h2 className="text-[15px] font-bold text-slate-100">Manual de uso</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">Funnel Simulator Pro</p>
          </div>
          <button
            onClick={() => toggleHelp(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                       hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 px-4 pt-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e1e1e' }}
        >
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 pb-2.5 text-[12px] font-medium transition-colors relative"
                style={{ color: tab === t.id ? '#f97316' : '#666' }}
              >
                <Icon size={12} />
                {t.label}
                {tab === t.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ backgroundColor: '#f97316' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Contenido — min-h-0 es clave: sin él flex-1 no puede hacer scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: 0 }}>

          {/* ── Tab: Atajos ────────────────────────────────────────────── */}
          {tab === 'shortcuts' && (
            <div>
              <Section title="Edición">
                <ShortcutRow keys={[<Kbd key="1">{Mod}</Kbd>, <Kbd key="2">Z</Kbd>]} label="Deshacer" />
                <ShortcutRow keys={[<Kbd key="1">{Mod}</Kbd>, <Kbd key="2">Shift</Kbd>, <Kbd key="3">Z</Kbd>]} label="Rehacer" />
                <ShortcutRow keys={[<Kbd key="1">{Mod}</Kbd>, <Kbd key="2">C</Kbd>]} label="Copiar nodo seleccionado" />
                <ShortcutRow keys={[<Kbd key="1">{Mod}</Kbd>, <Kbd key="2">V</Kbd>]} label="Pegar nodo" />
                <ShortcutRow
                  keys={[
                    <span key="a" className="flex items-center gap-1"><Kbd>Alt</Kbd><span className="text-slate-600 text-[10px]">/</span><Kbd>{Mod}</Kbd><span className="text-slate-600 text-[10px]">+</span><Kbd>D</Kbd></span>,
                  ]}
                  label="Duplicar nodo seleccionado"
                />
                <ShortcutRow keys={[<Kbd key="1">Del</Kbd>]} label="Eliminar nodo seleccionado" />
                <ShortcutRow keys={[<Kbd key="1">Esc</Kbd>]} label="Cerrar panel / Deseleccionar" />
              </Section>

              <Section title="Canvas">
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Scroll</span>]} label="Zoom in / out" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Click + Drag</span>]} label="Selección múltiple" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Click derecho / medio + Drag</span>]} label="Desplazar canvas (pan)" />
                <ShortcutRow keys={[<Kbd key="1">Shift</Kbd>, <span key="2" className="text-slate-400 text-[11px]">+ Click</span>]} label="Agregar a selección múltiple" />
              </Section>

              <Section title="Simulación y herramientas">
                <ShortcutRow keys={[<Kbd key="1">{Mod}</Kbd>, <Kbd key="2">↵</Kbd>]} label="Ejecutar simulación" />
                <ShortcutRow keys={[<Kbd key="1">F1</Kbd>]} label="Abrir / cerrar este manual" />
              </Section>

              <Section title="Nodos y conexiones">
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Arrastrar desde sidebar</span>]} label="Agregar nodo al canvas" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Botón + junto al nodo</span>]} label="Agregar nodo siguiente (sugerido)" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Arrastrar punto de conexión</span>]} label="Crear conexión entre nodos" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Soltar en espacio vacío</span>]} label="Abrir selector de nodo siguiente" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Hover en línea → + / ×</span>]} label="Insertar nodo / Eliminar conexión" />
                <ShortcutRow keys={[<span key="1" className="text-slate-400 text-[11px]">Click derecho en nodo</span>]} label="Menú contextual (duplicar, eliminar…)" />
              </Section>
            </div>
          )}

          {/* ── Tab: Guía de uso ───────────────────────────────────────── */}
          {tab === 'guide' && (
            <div>
              <GuideStep
                step={1}
                title="Agregar una fuente de tráfico"
                description="Todo funnel comienza con tráfico. Arrastrá un nodo de fuente (Facebook Ads, Google Ads, TikTok, etc.) desde la barra lateral izquierda hacia el canvas."
                visual={
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#111a20', border: '1px solid #1e3040' }}>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="px-2 py-1 rounded-lg text-[9px]" style={{ backgroundColor: '#1c2830', border: '1px solid #2a3840', color: '#5a7a8a' }}>
                        📢 Facebook Ads
                      </span>
                      <span className="text-slate-700">→ drag →</span>
                      <span className="px-2 py-1 rounded-lg text-[9px]" style={{ backgroundColor: '#191919', border: '1px dashed #333', color: '#555' }}>
                        canvas
                      </span>
                    </div>
                  </div>
                }
              />

              <GuideStep
                step={2}
                title="Conectar nodos en secuencia"
                description="Pasá el mouse sobre un nodo para ver el botón +. Hacé click en + para elegir el nodo siguiente con sugerencias automáticas. O arrastrá desde el punto de conexión (⚬) derecho."
                visual={
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0f0f0f', border: '1px solid #222' }}>
                    <div className="flex items-center gap-1.5">
                      <MiniNode label="Tráfico" color="#5a7a8a" icon="📢" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-0.5 bg-[#3a3a3a]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">+</span>
                        </div>
                        <div className="w-2 h-0.5 bg-[#3a3a3a]" />
                      </div>
                      <MiniNode label="Landing" color="#4d7050" icon="📄" />
                      <div className="w-4 h-0.5 bg-[#3a3a3a]" />
                      <MiniNode label="Checkout" color="#c27a30" icon="💳" />
                    </div>
                  </div>
                }
              />

              <GuideStep
                step={3}
                title="Terminar el flujo con un nodo Resultado"
                description='El funnel debe terminar siempre con el nodo "Resultado" (ícono de gráfico de barras). Sin este nodo la simulación no puede ejecutarse. Debe estar conectado al final del flujo.'
                visual={
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#1a1410', border: '1px solid #302218' }}>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span style={{ color: '#888' }}>… Checkout</span>
                      <span className="text-[8px]" style={{ color: '#3a3a3a' }}>──▶</span>
                      <span
                        className="px-2 py-1 rounded-lg font-semibold"
                        style={{ backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', fontSize: '9px' }}
                      >
                        BarChart  Resultado  <span className="text-orange-500/50 text-[8px] ml-1">FIN</span>
                      </span>
                    </div>
                  </div>
                }
              />

              <GuideStep
                step={4}
                title="Configurar cada nodo"
                description="Hacé click en cualquier nodo para abrir su panel de configuración flotante. Ajustá tasas de conversión, precios, presupuesto y demás parámetros."
                visual={
                  <div className="flex gap-2 p-3 rounded-xl" style={{ backgroundColor: '#0f0f0f', border: '1px solid #222' }}>
                    <MiniNode label="Landing" color="#4d7050" icon="📄" />
                    <div className="flex items-center text-[10px] text-slate-600">→ click →</div>
                    <div className="rounded-xl p-2 flex-1" style={{ backgroundColor: '#1c1c1c', border: '1px solid #2e2e2e' }}>
                      <div className="text-[9px] font-bold text-slate-400 mb-2">Configuración</div>
                      <div className="space-y-1">
                        {['Conversión: 35%', 'Precio: $97', 'Visitas: 1.000'].map(t => (
                          <div key={t} className="h-1.5 rounded" style={{ backgroundColor: '#252525', width: t.length * 4 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                }
              />

              <GuideStep
                step={5}
                title="Ejecutar la simulación"
                description='Hacé click en "Simular" (o Ctrl+Enter) para calcular el flujo de visitantes y revenue a través del funnel. Los nodos se animarán y mostrarán métricas en tiempo real.'
                visual={
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#0a1a0a', border: '1px solid #1a2a1a' }}>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                      style={{ backgroundColor: '#f97316', color: '#fff' }}
                    >
                      ▶ Simular
                    </button>
                    <span className="text-[10px] text-slate-600">→</span>
                    <div className="flex gap-1.5">
                      {['#22c55e', '#22c55e', '#22c55e'].map((c, i) => (
                        <div key={i} className="w-8 h-6 rounded" style={{ backgroundColor: `${c}15`, border: `1px solid ${c}40` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-emerald-500 font-semibold">¡Listo!</span>
                  </div>
                }
              />
            </div>
          )}

          {/* ── Tab: Tipos de nodo ─────────────────────────────────────── */}
          {tab === 'nodes' && (
            <div>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Los nodos se organizan en categorías según su función en el funnel. Cada uno tiene
                parámetros específicos que afectan el cálculo de tráfico y revenue.
              </p>

              <NodeCategory
                color="#5a7a8a"
                emoji="📢"
                title="Tráfico"
                description="Generan visitantes para el funnel. Son el punto de entrada. Sin ellos no hay flujo."
                examples="Facebook Ads · Google Ads · TikTok Ads · LinkedIn Ads · Reels · Podcast · Influencer · Orgánico"
              />
              <NodeCategory
                color="#4d7050"
                emoji="📄"
                title="Páginas"
                description="Páginas que convierten visitantes. Tienen tasa de conversión configurable."
                examples="Landing Page · Sales Page · Webinar/VSL · Checkout · Cita / Agendamiento"
              />
              <NodeCategory
                color="#c27a30"
                emoji="💰"
                title="Ventas"
                description="Nodos de monetización. Capturan revenue en distintos puntos del funnel."
                examples="Upsell · Downsell · Order Bump"
              />
              <NodeCategory
                color="#686868"
                emoji="📧"
                title="Follow-up"
                description="Nutren y retargetizan leads para llevarlos de vuelta al funnel."
                examples="Secuencia de Email · WhatsApp / SMS · Retargeting"
              />
              <NodeCategory
                color="#555"
                emoji="⚙️"
                title="Utilidades"
                description="Herramientas de flujo y organización. No generan tráfico por sí solos."
                examples="Split A/B · Nota adhesiva · Contenedor de grupo"
              />
              <NodeCategory
                color="#f97316"
                emoji="📊"
                title="Resultado (terminal)"
                description="Nodo obligatorio que cierra el funnel y consolida las métricas finales. Debe estar conectado al final del flujo."
                examples="Resultado"
              />

              <div
                className="mt-4 rounded-xl p-3 text-[11px] leading-relaxed text-slate-500"
                style={{ backgroundColor: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)' }}
              >
                <span className="text-orange-400 font-semibold">Regla clave:</span> cada funnel necesita al menos
                una <span className="text-slate-300">fuente de tráfico</span> + un <span className="text-slate-300">nodo Resultado</span> conectado al final
                para que la simulación pueda ejecutarse.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid #1e1e1e' }}
        >
          <p className="text-[10px] text-slate-700">
            Presioná <Kbd>F1</Kbd> en cualquier momento para abrir esta ayuda
          </p>
          <button
            onClick={() => toggleHelp(false)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style={{ backgroundColor: '#222', border: '1px solid #333', color: '#888' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2a2a'; e.currentTarget.style.color = '#ccc' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#888' }}
          >
            Cerrar
          </button>
        </div>
      </div>
      </div>
    </>
  )
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-700 mb-2">{title}</p>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #1e1e1e', backgroundColor: '#0f0f0f' }}
      >
        <div className="px-3">{children}</div>
      </div>
    </div>
  )
}
