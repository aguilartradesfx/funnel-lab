import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Funnel Simulator Pro',
  description: 'Simulá y optimizá tus funnels de marketing antes de invertir en ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="bg-[#0a0a0a] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
