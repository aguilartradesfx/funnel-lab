'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'funnellab_cookies_accepted'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#888] leading-relaxed">
              Usamos cookies esenciales para el funcionamiento del sitio y la autenticación.{' '}
              <Link href="/privacy" className="text-white/60 hover:text-white transition-colors underline underline-offset-2">
                Política de privacidad
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#666] hover:text-[#999] transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-[#e5e5e5] transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
