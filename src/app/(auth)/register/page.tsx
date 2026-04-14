'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
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

export default function RegisterPage() {
  const router = useRouter()

  const [firstName, setFirstName]       = useState('')
  const [lastName, setLastName]         = useState('')
  const [email, setEmail]               = useState('')
  const [phone, setPhone]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)

  const supabase = createClient()

  const validate = (): string | null => {
    if (!firstName.trim()) return 'El nombre es obligatorio'
    if (!lastName.trim())  return 'El apellido es obligatorio'
    if (!email.trim())     return 'El email es obligatorio'
    if (!phone)            return 'El teléfono es obligatorio'
    if (phone.replace(/\D/g, '').length < 7) return 'El teléfono debe tener al menos 7 dígitos'
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (password !== confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(
          signUpError.message === 'User already registered'
            ? 'Ya existe una cuenta con ese email'
            : signUpError.message
        )
        return
      }

      // Guardar teléfono y apellido en profiles
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: firstName.trim(),
            last_name: lastName.trim(),
            phone,
            auth_provider: 'email',
          })
          .eq('id', data.user.id)

        // Webhook 1: fire-and-forget
        fireUserCreated({
          event: 'user_created',
          timestamp: new Date().toISOString(),
          user: {
            id: data.user.id,
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone,
            auth_provider: 'email',
            created_at: data.user.created_at,
          },
        })
      }

      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h2>
        <p className="text-slate-400 text-sm mb-6">
          Revisá tu email{' '}
          <span className="text-slate-200 font-medium">{email}</span>{' '}
          para confirmar tu cuenta.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all"
        >
          Ir al login
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
      <p className="text-slate-400 text-sm mb-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
          Iniciar sesión
        </Link>
      </p>

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className={cn(
          'w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl',
          'bg-[#1e1e1e] border border-[#2e2e2e] text-slate-200 text-sm font-medium',
          'hover:border-slate-500 hover:bg-[#252535] transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed mb-5'
        )}
      >
        {googleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#2e2e2e]" />
        <span className="text-slate-500 text-xs">o</span>
        <div className="flex-1 h-px bg-[#2e2e2e]" />
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Email */}
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            className={inputClass}
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className={labelClass}>Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              className={cn(inputClass, 'pr-10')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className={labelClass}>Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Repetí tu contraseña"
              className={cn(
                inputClass,
                'pr-10',
                confirmPassword && password !== confirmPassword
                  ? 'border-red-500/60'
                  : confirmPassword && password === confirmPassword
                    ? 'border-emerald-500/60'
                    : ''
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        {/* Nombre + Apellido (50/50) */}
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
          disabled={loading || googleLoading}
          className={cn(
            'w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500',
            'text-white text-sm font-semibold transition-all shadow-sm shadow-orange-950/50',
            'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          )}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Crear cuenta
        </button>

        <p className="text-center text-xs text-slate-500">
          Al crear una cuenta aceptás nuestros{' '}
          <Link href="/terms" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">
            Términos de servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">
            Política de privacidad
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
