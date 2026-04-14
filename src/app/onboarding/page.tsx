'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronDown, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fireOnboardingCompleted } from '@/lib/webhooks'
import { cn } from '@/lib/utils'

const TEAM_SIZES = [
  'Solo yo',
  '2-5 personas',
  '6-15 personas',
  '16-50 personas',
  '50+ personas',
]

const INDUSTRIES = [
  'E-commerce / Tienda online',
  'Servicios profesionales',
  'Restaurantes / Gastronomía',
  'Salud / Clínicas',
  'Educación / Cursos online',
  'Inmobiliaria / Bienes raíces',
  'SaaS / Tecnología',
  'Agencia de marketing',
  'Coaching / Consultoría',
  'Fitness / Bienestar',
  'Turismo / Viajes / Hoteles',
  'Belleza / Estética',
  'Imprenta / Gráficas',
  'Legal / Contabilidad',
  'Construcción',
  'Automotriz',
  'Otro',
]

const inputClass = cn(
  'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
  'text-slate-100 text-sm placeholder:text-slate-600',
  'focus:outline-none focus:border-orange-500 transition-colors'
)
const labelClass = 'block text-sm text-slate-300 font-medium mb-1.5'

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            inputClass,
            'appearance-none pr-9 cursor-pointer',
            !value && 'text-slate-600'
          )}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-[#1a1a1a] text-slate-100">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companyName, setCompanyName] = useState('')
  const [teamSize, setTeamSize]       = useState('')
  const [industry, setIndustry]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [skipping, setSkipping]       = useState(false)
  const [userId, setUserId]           = useState('')
  const [userEmail, setUserEmail]     = useState('')
  const [profile, setProfile]         = useState<{
    full_name: string; last_name: string; phone: string
  } | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('full_name, last_name, phone, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (data?.onboarding_completed) {
        router.replace('/dashboard')
        return
      }
      setProfile(data ?? null)
    }
    loadUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markCompleted = async () => {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          company_name: companyName.trim() || null,
          team_size: teamSize || null,
          industry: industry || null,
          onboarding_completed: true,
        })
        .eq('id', userId)

      // Webhook 2: fire-and-forget
      fireOnboardingCompleted({
        event: 'onboarding_completed',
        timestamp: new Date().toISOString(),
        user: {
          id: userId,
          email: userEmail,
          first_name: profile?.full_name ?? '',
          last_name: profile?.last_name ?? '',
          phone: profile?.phone ?? '',
          company_name: companyName.trim(),
          team_size: teamSize,
          industry,
        },
      })

      router.push('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await markCompleted()
      router.push('/dashboard')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FunnelLab" className="h-9 w-auto" />
        </div>

        <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-orange-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">
            ¡Bienvenido a FunnelLab!
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Contanos un poco sobre tu negocio. Podés saltar esto si querés.
          </p>

          <form onSubmit={handleComplete} className="space-y-4">
            {/* Empresa */}
            <div>
              <label className={labelClass}>
                Nombre de la empresa{' '}
                <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Mi Empresa S.A."
                className={inputClass}
              />
            </div>

            {/* Tamaño de equipo */}
            <SelectField
              label="Tamaño del equipo"
              value={teamSize}
              onChange={setTeamSize}
              options={TEAM_SIZES}
              placeholder="Seleccioná una opción"
            />

            {/* Industria */}
            <SelectField
              label="Industria / Nicho"
              value={industry}
              onChange={setIndustry}
              options={INDUSTRIES}
              placeholder="Seleccioná una opción"
            />

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || skipping}
                className={cn(
                  'w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500',
                  'text-white text-sm font-semibold transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                )}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Completar
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={saving || skipping}
                className={cn(
                  'w-full py-2.5 rounded-xl border border-[#2e2e2e]',
                  'text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                )}
              >
                {skipping && <Loader2 size={15} className="animate-spin" />}
                Omitir por ahora
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
