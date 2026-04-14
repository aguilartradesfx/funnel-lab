'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fireUserCreated } from '@/lib/webhooks'
import PhoneInputField from '@/components/ui/PhoneInputField'
import { cn } from '@/lib/utils'

const inputClass = cn(
  'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
  'text-slate-100 text-sm placeholder:text-slate-600',
  'focus:outline-none focus:border-orange-500 transition-colors'
)
const labelClass = 'block text-sm text-slate-300 font-medium mb-1.5'

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [userId, setUserId]       = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setCreatedAt(user.created_at)

      // Prellenar con datos de Google si existen
      const meta = user.user_metadata
      const fullName: string = meta?.full_name ?? meta?.name ?? ''
      const spaceIdx = fullName.indexOf(' ')
      if (spaceIdx > 0) {
        setFirstName(fullName.substring(0, spaceIdx))
        setLastName(fullName.substring(spaceIdx + 1))
      } else if (fullName) {
        setFirstName(fullName)
      } else {
        setFirstName(meta?.given_name ?? '')
        setLastName(meta?.family_name ?? '')
      }

      // Si ya tiene teléfono, saltear este paso
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, last_name')
        .eq('id', user.id)
        .single()

      if (profile?.phone) {
        router.replace('/onboarding')
        return
      }

      if (profile?.last_name) setLastName(profile.last_name)
      setLoading(false)
    }

    loadUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim()) { setError('El nombre es obligatorio'); return }
    if (!lastName.trim())  { setError('El apellido es obligatorio'); return }
    if (!phone)            { setError('El teléfono es obligatorio'); return }
    if (phone.replace(/\D/g, '').length < 7) {
      setError('El teléfono debe tener al menos 7 dígitos')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: firstName.trim(),
          last_name: lastName.trim(),
          phone,
          auth_provider: 'google',
        })
        .eq('id', userId)

      if (updateError) {
        setError('Error guardando el perfil. Intentá de nuevo.')
        return
      }

      // Webhook 1: fire-and-forget
      fireUserCreated({
        event: 'user_created',
        timestamp: new Date().toISOString(),
        user: {
          id: userId,
          email: userEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone,
          auth_provider: 'google',
          created_at: createdAt,
        },
      })

      router.push('/onboarding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-orange-500" />
      </div>
    )
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
            <User size={22} className="text-orange-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Completá tu perfil</h1>
          <p className="text-slate-400 text-sm mb-6">
            Solo falta un paso para empezar a usar FunnelLab.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  placeholder="Juan"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  placeholder="Pérez"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className={labelClass}>Teléfono</label>
              <PhoneInputField
                value={phone}
                onChange={setPhone}
                placeholder="8888-1234"
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={cn(
                'w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500',
                'text-white text-sm font-semibold transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              )}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
