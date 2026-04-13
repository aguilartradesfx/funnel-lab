'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError(error.message)
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Email enviado</h2>
        <p className="text-slate-400 text-sm mb-6">
          Revisá tu bandeja de entrada en <span className="text-slate-200 font-medium">{email}</span> para restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Olvidé mi contraseña</h1>
      <p className="text-slate-400 text-sm mb-6">
        Ingresá tu email y te enviamos un link para resetearla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          Enviar enlace
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={13} />
          Volver al login
        </Link>
      </div>
    </div>
  )
}
