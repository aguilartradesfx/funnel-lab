'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check, User, Zap, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const PLAN_LABELS: Record<string, { label: string; color: string; credits: number }> = {
  starter: { label: 'Starter', color: 'text-slate-400', credits: 0 },
  pro:     { label: 'Pro', color: 'text-orange-400', credits: 150 },
  max:     { label: 'Max', color: 'text-purple-400', credits: 800 },
}

const PLAN_PRICES: Record<string, string> = {
  starter: '$6.99',
  pro:     '$14.99',
  max:     '$69',
}

const ACTION_LABELS: Record<string, string> = {
  chat: 'Chat IA',
  analyze: 'Analizar funnel',
  generate_funnel: 'Generar funnel',
  summary: 'Resumen ejecutivo',
  suggestions: 'Sugerencias',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:   { label: 'Activa', color: 'text-green-400' },
  trialing: { label: 'Período de prueba', color: 'text-blue-400' },
  past_due: { label: 'Pago pendiente', color: 'text-red-400' },
  canceled: { label: 'Cancelada', color: 'text-slate-500' },
  inactive: { label: 'Sin suscripción', color: 'text-slate-500' },
}

interface CreditLogEntry {
  action: string
  credits_consumed: number
  source: string
  created_at: string
}

interface Props {
  user: { id: string; email: string; name: string; avatarUrl: string }
  plan: {
    plan: string
    monthly_credits_total: number
    monthly_credits_used: number
    pack_credits: number
    stripe_subscription_id?: string | null
    subscription_status?: string | null
    current_period_end?: string | null
  }
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
  const [profileError, setProfileError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [packLoading, setPackLoading] = useState(false)
  const [billingError, setBillingError] = useState('')

  const planInfo = PLAN_LABELS[plan.plan] ?? PLAN_LABELS.starter
  const creditsUsed = plan.monthly_credits_used
  const creditsTotal = plan.monthly_credits_total
  const creditsLeft = Math.max(0, creditsTotal - creditsUsed) + plan.pack_credits
  const progressPct = creditsTotal > 0 ? Math.min(100, (creditsUsed / creditsTotal) * 100) : 0
  const hasSubscription = !!plan.stripe_subscription_id
  const statusInfo = STATUS_LABELS[plan.subscription_status ?? 'inactive'] ?? STATUS_LABELS.inactive

  const periodEnd = plan.current_period_end
    ? new Date(plan.current_period_end).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', user.id)
      if (error) { setProfileError('Error al guardar. Intentá de nuevo.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handlePortal = async () => {
    setBillingError('')
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) { setBillingError(data.error ?? 'Error'); return }
      window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  const handleBuyCreditPack = async () => {
    setBillingError('')
    setPackLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'price_1TLqxRBsZkS4TPpPshsMT7qT', userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) { setBillingError(data.error ?? 'Error'); return }
      if (data.url) window.location.href = data.url
    } finally {
      setPackLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* Header */}
      <header className="h-14 bg-[#0f0f0f] border-b border-[#2e2e2e] flex items-center gap-4 px-6">
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
                type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-[#2e2e2e] text-slate-100 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Email</label>
              <input
                type="email" value={user.email} disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
            {profileError && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{profileError}</div>
            )}
            <button
              type="submit" disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
              {saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        {/* ── Plan y suscripción ── */}
        <section className="space-y-5">
          <SectionHeader icon={<Zap size={14} className="text-orange-400" />} title="Plan y créditos" />

          {/* Info del plan */}
          <div className="flex items-center justify-between">
            <div>
              <span className={cn('text-sm font-bold', planInfo.color)}>Plan {planInfo.label}</span>
              <p className="text-xs text-slate-500 mt-0.5">{PLAN_PRICES[plan.plan] ?? '—'}/mes</p>
              <p className={cn('text-xs mt-0.5', statusInfo.color)}>{statusInfo.label}</p>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="px-3 py-1.5 rounded-xl border border-orange-500/40 text-orange-400 text-xs font-medium hover:bg-orange-500/10 transition-colors"
            >
              {plan.plan === 'max' ? 'Ver planes' : 'Hacer upgrade'}
            </button>
          </div>

          {periodEnd && (
            <p className="text-xs text-slate-500">Próxima renovación: {periodEnd}</p>
          )}

          {/* Barra de créditos */}
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

          <div className="divide-y divide-[#2e2e2e]">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Créditos de pack</span>
              <span className="text-sm font-semibold text-slate-200">{plan.pack_credits} créditos</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Total disponible</span>
              <span className="text-sm font-bold text-white">{creditsLeft} créditos</span>
            </div>
          </div>

          {billingError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{billingError}</div>
          )}

          {/* Pack de créditos */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3">Comprar créditos adicionales</p>
            <button
              onClick={handleBuyCreditPack}
              disabled={packLoading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#2e2e2e] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-white group-hover:text-orange-400">250 créditos</p>
                <p className="text-xs text-slate-500">Compra única, no se vencen</p>
              </div>
              <div className="flex items-center gap-2">
                {packLoading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : null}
                <span className="text-sm font-bold text-orange-400">$19.99</span>
              </div>
            </button>
          </div>

          {/* Customer Portal */}
          {hasSubscription && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              Administrar suscripción y facturas
            </button>
          )}
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
