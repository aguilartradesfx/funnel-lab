'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Section {
  number: string
  title: string
  content: React.ReactNode
}

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  breadcrumb: string
  sections: Section[]
}

export default function LegalLayout({ title, lastUpdated, breadcrumb, sections }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#1e1e1e]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Funnel Labs" className="h-7 w-auto" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#666] hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#555] mb-8">
            <Link href="/" className="hover:text-[#888] transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-[#777]">{breadcrumb}</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
            <p className="text-sm text-[#555]">Última actualización: {lastUpdated}</p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.number}>
                <h2 className="text-base font-bold text-white mb-3 flex items-baseline gap-2.5">
                  <span className="text-orange-500 font-mono text-sm">{s.number}.</span>
                  {s.title}
                </h2>
                <div className="text-[#888] text-[15px] leading-relaxed space-y-3 pl-6">
                  {s.content}
                </div>
              </section>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0f0f0f] px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#555]">
            © {new Date().getFullYear()} Funnel Labs · Operado por{' '}
            <a href="https://bralto.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] transition-colors">Bralto</a>
          </p>
          <div className="flex items-center gap-5 text-xs text-[#555]">
            <Link href="/terms" className="hover:text-[#888] transition-colors">Términos de servicio</Link>
            <Link href="/privacy" className="hover:text-[#888] transition-colors">Política de privacidad</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
