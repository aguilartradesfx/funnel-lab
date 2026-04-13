'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email'
          : error.message)
        return
      }
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
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
          Revisá tu email <span className="text-slate-200 font-medium">{email}</span> para confirmar tu cuenta.
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
        <div>
          <label className="block text-sm text-slate-300 font-medium mb-1.5">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
              'text-slate-100 text-sm placeholder:text-slate-600',
              'focus:outline-none focus:border-orange-500 transition-colors'
            )}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
              'text-slate-100 text-sm placeholder:text-slate-600',
              'focus:outline-none focus:border-orange-500 transition-colors'
            )}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 font-medium mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              className={cn(
                'w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
                'text-slate-100 text-sm placeholder:text-slate-600',
                'focus:outline-none focus:border-orange-500 transition-colors'
              )}
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
          Al crear una cuenta aceptás los términos de uso.
        </p>
      </form>
    </div>
  )
}
