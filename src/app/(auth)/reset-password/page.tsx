'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Contraseña actualizada</h2>
        <p className="text-slate-400 text-sm">Redirigiendo al dashboard…</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Nueva contraseña</h1>
      <p className="text-slate-400 text-sm mb-6">Elegí una contraseña segura para tu cuenta.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 font-medium mb-1.5">Nueva contraseña</label>
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

        <div>
          <label className="block text-sm text-slate-300 font-medium mb-1.5">Confirmar contraseña</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder="Repetí tu contraseña"
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]',
              'text-slate-100 text-sm placeholder:text-slate-600',
              'focus:outline-none focus:border-orange-500 transition-colors'
            )}
          />
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500',
            'text-white text-sm font-semibold transition-all shadow-sm shadow-orange-950/50',
            'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          )}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Actualizar contraseña
        </button>
      </form>
    </div>
  )
}
