'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check, User, Zap, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const PLAN_LABELS: Record<string, { label: string; color: string; credits: number }> = {
  starter: { label: 'Starter', color: 'text-slate-400', credits: 0 },
  pro:     { label: 'Pro', color: 'text-orange-400', credits: 150 },
  agency:  { label: 'Agency', color: 'text-purple-400', credits: 800 },
}

const ACTION_LABELS: Record<string, string> = {
  chat: 'Chat IA',
  analyze: 'Analizar funnel',
  generate_funnel: 'Generar funnel',
  summary: 'Resumen ejecutivo',
  suggestions: 'Sugerencias',
}

interface CreditLogEntry {
  action: string
  credits_consumed: number
  source: string
  created_at: string
}

interface Props {
  user: { id: string; email: string; name: string; avatarUrl: string }
  plan: { plan: string; monthly_credits_total: number; monthly_credits_used: number; pack_credits: number }
  creditLog: CreditLogEntry[]
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-[#2e2e2e]">
      <div className="w-7 h-7 rounded-lg bg-orange-600/15 border border-orange-600/25 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  )
}

export default function SettingsClient({ user, plan, creditLog }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const planInfo = PLAN_LABELS[plan.plan] ?? PLAN_LABELS.pro
  const creditsUsed = plan.monthly_credits_used
  const creditsTotal = plan.monthly_credits_total
  const creditsLeft = Math.max(0, creditsTotal - creditsUsed) + plan.pack_credits
  const progressPct = creditsTotal > 0 ? Math.min(100, (creditsUsed / creditsTotal) * 100) : 0

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', user.id)

      if (profileErr) {
        setError('Error al guardar. Intentá de nuevo.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('es', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* Header */}
      <header className="h-14 bg-[#0d0d0d] border-b border-[#2e2e2e] flex items-center gap-4 px-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
        <div className="w-px h-4 bg-[#2e2e2e]" />
        <span className="text-sm font-semibold text-white">Configuración de cuenta</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-10">

        {/* ── Perfil ── */}
        <section className="space-y-5">
          <SectionHeader icon={<User size={14} className="text-orange-400" />} title="Perfil" />

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-[#2e2e2e]',
                  'text-slate-100 text-sm focus:outline-none focus:border-orange-500/60 transition-colors'
                )}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                'bg-orange-600 hover:bg-orange-500 text-white',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        {/* ── Plan y créditos ── */}
        <section className="space-y-5">
          <SectionHeader icon={<Zap size={14} className="text-orange-400" />} title="Plan y créditos" />

          <div className="flex items-center justify-between">
            <div>
              <span className={cn('text-sm font-bold', planInfo.color)}>Plan {planInfo.label}</span>
              <p className="text-xs text-slate-500 mt-0.5">${{ starter: '6.99', pro: '15.99', agency: '79' }[plan.plan]}/mes</p>
            </div>
            <button className="px-3 py-1.5 rounded-xl border border-orange-500/40 text-orange-400 text-xs font-medium hover:bg-orange-500/10 transition-colors">
              Hacer upgrade
            </button>
          </div>

          {creditsTotal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Créditos mensuales usados</span>
                <span className="font-medium text-slate-300">{creditsUsed} / {creditsTotal}</span>
              </div>
              <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', progressPct > 85 ? 'bg-red-500' : 'bg-orange-500')}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-0 divide-y divide-[#2e2e2e]">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Créditos de pack</span>
              <span className="text-sm font-semibold text-slate-200">{plan.pack_credits} créditos</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Total disponible</span>
              <span className="text-sm font-bold text-white">{creditsLeft} créditos</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3">Comprar créditos adicionales</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { size: 20, price: '$4.99' },
                { size: 50, price: '$9.99' },
                { size: 150, price: '$24.99' },
              ].map(pack => (
                <button
                  key={pack.size}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl border border-[#2e2e2e]',
                    'hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group'
                  )}
                >
                  <span className="text-sm font-bold text-white group-hover:text-orange-400">{pack.size}</span>
                  <span className="text-[10px] text-slate-500">créditos</span>
                  <span className="text-xs font-semibold text-slate-300 mt-1">{pack.price}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-3 text-center">Pagos con Stripe — próximamente</p>
          </div>
        </section>

        {/* ── Historial de créditos ── */}
        {creditLog.length > 0 && (
          <section className="space-y-5">
            <SectionHeader icon={<Clock size={14} className="text-slate-400" />} title="Historial de créditos" />

            <div className="divide-y divide-[#2e2e2e]">
              {creditLog.map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-slate-200">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(entry.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-400">-{entry.credits_consumed}</p>
                    <p className="text-[10px] text-slate-600">{entry.source === 'monthly' ? 'mensual' : 'pack'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
