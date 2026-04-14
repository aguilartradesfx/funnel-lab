'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, ArrowLeft, Loader2 } from 'lucide-react'
import { PRICES } from '@/lib/stripe'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  priceId: string
  name: string
  price: string
  period: string
  credits: string
  projects: string
  scenarios: string
  color: string
  highlight: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    priceId: PRICES.starter,
    name: 'Starter',
    price: '$6.99',
    period: '/mes',
    credits: 'Sin créditos IA',
    projects: '3 proyectos',
    scenarios: '1 escenario por proyecto',
    color: 'text-slate-300',
    highlight: false,
    features: [
      'Canvas de funnels ilimitado',
      'Simulación de conversiones',
      '3 proyectos',
      '1 escenario por proyecto',
      'Blueprints incluidos',
    ],
  },
  {
    id: 'pro',
    priceId: PRICES.pro,
    name: 'Pro',
    price: '$14.99',
    period: '/mes',
    credits: '150 créditos IA/mes',
    projects: '10 proyectos',
    scenarios: '4 escenarios por proyecto',
    color: 'text-orange-400',
    highlight: true,
    features: [
      'Todo lo de Starter',
      '150 créditos IA por mes',
      '10 proyectos',
      '4 escenarios por proyecto',
      'Asistente IA para funnels',
      'Análisis y sugerencias IA',
      '7 días de prueba gratis',
    ],
  },
  {
    id: 'max',
    priceId: PRICES.max,
    name: 'Max',
    price: '$69',
    period: '/mes',
    credits: '800 créditos IA/mes',
    projects: 'Ilimitados',
    scenarios: 'Ilimitados',
    color: 'text-purple-400',
    highlight: false,
    features: [
      'Todo lo de Pro',
      '800 créditos IA por mes',
      'Proyectos ilimitados',
      'Escenarios ilimitados',
      'Soporte prioritario',
    ],
  },
]

interface Props {
  userId: string | null
  currentPlan: string | null
  hasSubscription: boolean
}

export default function PricingClient({ userId, currentPlan, hasSubscription }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (plan: Plan) => {
    if (!userId) {
      router.push('/login')
      return
    }

    if (plan.id === currentPlan) return
    setError('')
    setLoading(plan.priceId)

    try {
      // Si ya tiene suscripción activa, usar upgrade endpoint
      const endpoint = hasSubscription ? '/api/stripe/upgrade' : '/api/stripe/checkout'
      const body = hasSubscription
        ? { newPriceId: plan.priceId, userId }
        : { priceId: plan.priceId, userId }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar')
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else if (hasSubscription) {
        // Upgrade exitoso sin redirección
        router.push('/dashboard')
      }
    } finally {
      setLoading(null)
    }
  }

  const handleBuyCreditPack = async () => {
    if (!userId) { router.push('/login'); return }
    setError('')
    setLoading('pack')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICES.credit_pack, userId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* Header */}
      <header className="h-14 bg-[#0f0f0f] border-b border-[#2e2e2e] flex items-center gap-4 px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
        <div className="w-px h-4 bg-[#2e2e2e]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="FunnelLab" className="h-6 w-auto" />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Elegí tu plan</h1>
          <p className="text-slate-400 text-base">
            Empezá gratis con Starter o probá Pro 7 días sin cargo.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const isLoading = loading === plan.priceId
            const planOrder = { starter: 0, pro: 1, max: 2 }
            const currentOrder = planOrder[currentPlan as keyof typeof planOrder] ?? 0
            const thisOrder = planOrder[plan.id as keyof typeof planOrder] ?? 0
            const isUpgrade = thisOrder > currentOrder && currentPlan !== null

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 transition-all',
                  plan.highlight
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-[#2e2e2e] bg-[#111111]',
                  isCurrent && 'ring-1 ring-orange-500/40'
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-[11px] font-bold tracking-wide">
                      MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className={cn('text-base font-bold mb-1', plan.color)}>{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{plan.credits}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan)}
                  disabled={isCurrent || isLoading}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    isCurrent
                      ? 'bg-[#2e2e2e] text-slate-500 cursor-default'
                      : plan.highlight
                        ? 'bg-orange-600 hover:bg-orange-500 text-white'
                        : 'border border-[#3e3e3e] text-slate-200 hover:border-orange-500/50 hover:text-white',
                    isLoading && 'opacity-60 cursor-wait'
                  )}
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {isCurrent ? 'Plan actual' : isUpgrade ? 'Hacer upgrade' : 'Empezar'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Pack de créditos */}
        <div className="max-w-md mx-auto border border-[#2e2e2e] rounded-2xl p-6 bg-[#111111]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600/15 border border-orange-600/25 flex items-center justify-center">
              <Zap size={15} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pack de créditos</h3>
              <p className="text-xs text-slate-500">Compra única, sin suscripción</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-white">250</span>
              <span className="text-slate-500 text-sm ml-1">créditos</span>
            </div>
            <span className="text-lg font-bold text-orange-400">$9.99</span>
          </div>
          <button
            onClick={handleBuyCreditPack}
            disabled={loading === 'pack'}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
              'border border-orange-500/40 text-orange-400 hover:bg-orange-500/10',
              loading === 'pack' && 'opacity-60 cursor-wait'
            )}
          >
            {loading === 'pack' && <Loader2 size={14} className="animate-spin" />}
            Comprar créditos
          </button>
        </div>
      </main>
    </div>
  )
}
