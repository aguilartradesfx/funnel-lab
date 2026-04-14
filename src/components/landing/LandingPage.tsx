'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, ChevronDown, Zap, BarChart3,
  GitBranch, Brain, Menu, X, Globe, AtSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import FunnelDemo from './FunnelDemo'
import ParticlesBackground from './ParticlesBackground'

// ─── useInView hook ───────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Fade-in section wrapper ──────────────────────────────────────────────────

function FadeIn({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Producto', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-[#1e1e1e]' : 'bg-transparent',
    )}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FunnelLab" className="h-7 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <a key={l.label} href={l.href}
              onClick={e => { e.preventDefault(); document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' }) }}
              className="text-sm text-[#666] hover:text-white transition-colors"
            >{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#e5e5e5] text-black text-sm font-semibold transition-all">
              Ir al dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#666] hover:text-white transition-colors px-3 py-2">
                Iniciar sesión
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-xl bg-white hover:bg-[#e5e5e5] text-black text-sm font-semibold transition-all">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-[#666]" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#050505] border-b border-[#1e1e1e] px-6 py-4 space-y-3">
          {navLinks.map(l => (
            <a key={l.label} href={l.href}
              onClick={() => { setMenuOpen(false); document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' }) }}
              className="block text-sm text-[#aaa] hover:text-white py-1"
            >{l.label}</a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold text-center">Ir al dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-xl border border-[#1e1e1e] text-[#aaa] text-sm text-center">Iniciar sesión</Link>
                <Link href="/register" className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold text-center">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Static funnel builder mock ───────────────────────────────────────────────

function FunnelBuilderMock() {
  return (
    <div className="w-full rounded-2xl border border-white/8 bg-[#0a0a0a] overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.05),0_0_80px_rgba(255,255,255,0.03),0_40px_120px_-20px_rgba(0,0,0,0.95)]">

      {/* Browser title bar */}
      <div className="h-9 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center px-4 gap-3 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#222]" />
        </div>
        <div className="flex-1 max-w-xs mx-auto">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-md h-5 flex items-center justify-center px-3">
            <span className="text-[9px] text-[#333]">funnellab.io/project/e-commerce-q1</span>
          </div>
        </div>
      </div>

      {/* App toolbar */}
      <div className="h-11 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center px-4 gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-5 w-auto opacity-75 flex-shrink-0" />
        <div className="w-px h-5 bg-[#1e1e1e] flex-shrink-0" />
        <span className="text-[11px] text-[#555] truncate">E-commerce Q1 2025</span>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[#1e1e1e] bg-[#111]">
          <span className="text-[10px] text-[#4a4a4a]">Escenario 1</span>
          <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><path d="M1 1l2.5 2.5L6 1" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:block px-2.5 py-1 rounded-md border border-[#1e1e1e] bg-[#111]">
            <span className="text-[10px] text-[#4a4a4a]">Guardar</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white">
            <div className="w-1.5 h-1.5 rounded-full bg-black/30" />
            <span className="text-[10px] font-semibold text-black">Simular</span>
          </div>
        </div>
      </div>

      {/* App body */}
      <div className="flex" style={{ height: '320px' }}>

        {/* Left sidebar */}
        <div className="hidden sm:flex w-11 flex-shrink-0 border-r border-[#1a1a1a] bg-[#0d0d0d] flex-col items-center py-3 gap-2">
          {[
            { label: '◈', active: true },
            { label: '▣', active: false },
            { label: '✉', active: false },
            { label: '◎', active: false },
            { label: '⬡', active: false },
          ].map((item, i) => (
            <div key={i} className={cn(
              'w-7 h-7 rounded-lg border flex items-center justify-center',
              item.active ? 'border-white/15 bg-white/5' : 'border-[#1e1e1e] bg-[#111]',
            )}>
              <span className={cn('text-[10px]', item.active ? 'text-white/50' : 'text-[#3a3a3a]')}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundColor: '#060606',
            backgroundImage: 'radial-gradient(circle, #1c1c1c 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="flex items-center gap-2 pl-5 pr-3">

              {/* Node: Facebook Ads */}
              <div className="flex-shrink-0 w-[112px] rounded-xl border border-white/12 bg-[#0f0f0f] shadow-[0_0_20px_rgba(255,255,255,0.03)]">
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-white/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-white/50 font-bold">◈</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white leading-tight">Facebook Ads</span>
                  </div>
                  <p className="text-[8px] text-[#444] mb-1.5">$1,000/mes · CPC $0.80</p>
                  <div className="bg-white/5 rounded-lg py-1 px-1.5 text-center">
                    <span className="text-[10px] font-bold text-white/70">1,250</span>
                    <span className="text-[8px] text-[#555] ml-0.5">visitas</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <div className="w-5 h-px bg-[#2a2a2a]" />
                <svg width="5" height="8" viewBox="0 0 5 8" fill="none"><path d="M0 0L5 4L0 8" fill="#2a2a2a"/></svg>
              </div>

              {/* Node: Landing Page */}
              <div className="flex-shrink-0 w-[112px] rounded-xl border border-[#222] bg-[#0f0f0f]">
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-[#666] font-bold">▣</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white leading-tight">Landing Page</span>
                  </div>
                  <p className="text-[8px] text-[#444] mb-1.5">Conversión 25%</p>
                  <div className="bg-[#141414] rounded-lg py-1 px-1.5 text-center">
                    <span className="text-[10px] font-bold text-[#666]">312</span>
                    <span className="text-[8px] text-[#444] ml-0.5">leads</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                <div className="w-5 h-px bg-[#2a2a2a]" />
                <svg width="5" height="8" viewBox="0 0 5 8" fill="none"><path d="M0 0L5 4L0 8" fill="#2a2a2a"/></svg>
              </div>

              {/* Node: Checkout */}
              <div className="flex-shrink-0 w-[112px] rounded-xl border border-[#222] bg-[#0f0f0f]">
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-[#666] font-bold">◎</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white leading-tight">Checkout</span>
                  </div>
                  <p className="text-[8px] text-[#444] mb-1.5">Producto $97</p>
                  <div className="bg-[#141414] rounded-lg py-1 px-1.5 text-center">
                    <span className="text-[10px] font-bold text-[#666]">109</span>
                    <span className="text-[8px] text-[#444] ml-0.5">clientes</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-14 bg-[#1a1a1a] flex-shrink-0 mx-1" />

              {/* Results widget */}
              <div className="flex-shrink-0 w-[100px] rounded-xl border border-white/8 bg-[#0d0d0d] p-2.5">
                <p className="text-[8px] font-semibold text-white/30 uppercase tracking-wider mb-2">Resultado</p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-[8px] text-[#555]">Revenue</p>
                    <p className="text-[11px] font-bold text-white">$10,573</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-[#555]">ROAS</p>
                    <p className="text-[11px] font-bold text-white">10.6x</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-[#555]">Profit</p>
                    <p className="text-[11px] font-bold text-white">$9,573</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f0f0f] border border-[#1e1e1e]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-[#555]">Simulación lista · ROAS 10.6x</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="hidden lg:flex w-44 flex-shrink-0 border-l border-[#1a1a1a] bg-[#0d0d0d] flex-col p-3">
          <p className="text-[9px] text-[#444] font-semibold uppercase tracking-wider mb-3">Análisis IA</p>
          <div className="space-y-2 mb-3">
            <div className="p-2 rounded-lg bg-[#111] border border-[#1a1a1a]">
              <p className="text-[8px] text-[#555] leading-relaxed">ROAS 10.6x. Funnel bien optimizado.</p>
            </div>
            <div className="p-2 rounded-lg bg-[#111] border border-white/6">
              <p className="text-[8px] text-white/30 leading-relaxed">A/B test en landing puede mejorar +20% revenue.</p>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2.5 mt-auto">
            <p className="text-[9px] text-[#444] mb-2">Embudo</p>
            {[
              { label: 'Visitas', pct: 100 },
              { label: 'Leads', pct: 25 },
              { label: 'Clientes', pct: 9 },
            ].map(item => (
              <div key={item.label} className="mb-1.5">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[8px] text-[#444]">{item.label}</span>
                  <span className="text-[8px] text-[#444]">{item.pct}%</span>
                </div>
                <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', item.pct === 9 ? 'bg-white/25' : 'bg-[#2e2e2e]')}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-7 bg-[#0d0d0d] border-t border-[#1a1a1a] flex items-center px-4 gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-[#444]">Simulación completada</span>
        </div>
        <span className="text-[9px] text-[#2a2a2a]">·</span>
        <span className="text-[9px] text-[#444]">3 nodos</span>
        <span className="text-[9px] text-[#2a2a2a]">·</span>
        <span className="text-[9px] text-[#444]">ROAS 10.6x</span>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative pt-28 pb-0 overflow-hidden bg-[#080808]">
      {/* Soft white radial glow — top center */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
      }} />
      {/* Extra subtle center warmth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 40% at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)',
      }} />

      {/* Text block — same width as the mock below */}
      <div className="relative max-w-5xl mx-auto text-left px-6 mb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-xs font-medium text-orange-400 mb-7">
          <Zap size={11} />
          Simulá, predecí y optimizá con IA
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
          Simulá tu funnel<br />
          antes de gastar <span className="text-[#aaa]">un centavo</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/40 max-w-2xl mb-10 leading-relaxed">
          Para marketers, agencias y emprendedores: construí funnels visualmente,
          predecí conversiones y detectá cuellos de botella antes de invertir.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-start">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-[#e8e8e8] text-black font-semibold text-base transition-all"
          >
            {isAuthenticated ? 'Ir al dashboard' : 'Empezar gratis'}
            <ArrowRight size={16} />
          </Link>
          <a
            href="#demo"
            onClick={e => { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/25 text-white/50 hover:text-white font-semibold text-base transition-all"
          >
            Ver demo en vivo
          </a>
        </div>
      </div>

      {/* App mock — fades into bg at bottom */}
      <div
        className="relative max-w-5xl mx-auto px-6"
        style={{
          maskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }} />
        <FunnelBuilderMock />
      </div>
    </section>
  )
}

// ─── Social proof strip ───────────────────────────────────────────────────────

function SocialProof() {
  const platforms = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Instagram', 'YouTube', 'WhatsApp', 'Stripe']
  return (
    <section className="border-y border-[#1a1a1a] bg-[#0f0f0f] py-6 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs text-orange-500/60 uppercase tracking-widest mb-5">
          Diseñado para marketers, agencias digitales y emprendedores
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {platforms.map(p => (
            <span key={p} className="text-sm font-medium text-[#555] hover:text-[#888] transition-colors whitespace-nowrap">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Problem → Solution ───────────────────────────────────────────────────────

function ProblemSolution() {
  const pains = [
    {
      icon: '$',
      title: 'Gastás en ads sin certeza',
      desc: 'Lanzás campañas y cruzás los dedos esperando que funcionen. Si no, ya perdiste el presupuesto.',
    },
    {
      icon: '?',
      title: 'Funnels por intuición',
      desc: 'Armás la estructura del funnel basado en feeling. No hay datos que respalden las decisiones.',
    },
    {
      icon: '↓',
      title: 'Los cuellos de botella aparecen tarde',
      desc: 'Descubrís dónde estás perdiendo clientes cuando ya invertiste semanas y dinero.',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">El problema</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            ¿Cuánto dinero perdiste lanzando funnels<br className="hidden md:block" /> sin datos que los respaldaran?
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {pains.map((p, i) => (
            <FadeIn key={p.title} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] h-full">
                <div className="w-9 h-9 rounded-xl border border-[#222] bg-[#111] flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-[#555]">{p.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="text-center">
          <div className="inline-block px-6 py-3 rounded-xl border border-white/12 bg-white/4">
            <p className="text-base font-semibold text-white/60">
              FunnelLab te deja simular todo <span className="text-white">ANTES</span> de gastar
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Demo interactivo ─────────────────────────────────────────────────────────

function DemoSection() {
  return (
    <section id="demo" className="py-24 px-6 bg-[#0f0f0f] border-y border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-white/30 text-sm font-semibold uppercase tracking-wider mb-4">Demo en vivo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mirá cómo funciona</h2>
          <p className="text-[#888] max-w-xl mx-auto">
            Simulación en tiempo real de un funnel real. Nodos que aparecen, métricas que se calculan, resultados que se leen solos.
          </p>
        </FadeIn>
        <FadeIn>
          <FunnelDemo />
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: <BarChart3 size={20} className="text-orange-400" />,
      title: 'Simulador visual',
      desc: 'Arrastrá nodos, conectálos y simulá resultados al instante. Cambiá un parámetro y los números se recalculan solos.',
    },
    {
      icon: <GitBranch size={20} className="text-orange-400" />,
      title: '+70 tipos de nodos',
      desc: 'Desde Facebook Ads, SEO y TikTok hasta agentes de IA, webinars, upsells, retargeting y muchísimo más.',
    },
    {
      icon: <Brain size={20} className="text-orange-400" />,
      title: 'IA que analiza tu funnel',
      desc: 'Recibí diagnósticos automáticos, sugerencias de optimización y funnels generados desde cero con IA.',
    },
    {
      icon: <Zap size={20} className="text-orange-400" />,
      title: 'Múltiples escenarios',
      desc: 'Creá distintos escenarios para el mismo proyecto y comparálos. ¿Qué pasa si subís el presupuesto un 50%?',
    },
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Todo lo que necesitás para simular</h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 80}>
              <div className="p-6 rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] h-full group hover:border-white/15 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Arrastrá tus fuentes de tráfico',
      desc: 'Elegí de dónde viene tu tráfico — Facebook Ads, Google, SEO, TikTok, orgánico. Configurá presupuesto y CPC.',
      tag: 'Drag & Drop',
    },
    {
      n: '02',
      title: 'Conectá los pasos del funnel',
      desc: 'Landing pages, email sequences, checkouts, upsells, webinars. Todo conectado con flechas que muestran el flujo.',
      tag: 'Visual Flow',
    },
    {
      n: '03',
      title: 'Simulá y optimizá con IA',
      desc: 'Presionás Simular y ves los números reales: cuántos entran, cuántos convierten, cuánto ganás. La IA te dice qué mejorar.',
      tag: 'IA Insights',
    },
  ]

  return (
    <section className="py-24 px-6 bg-[#0f0f0f] border-y border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Tres pasos y ya estás simulando</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 120}>
              <div className="relative p-6 rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] h-full">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl font-black text-[#2e2e2e] leading-none flex-shrink-0">{s.n}</span>
                  <span className="px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-[10px] font-medium text-orange-400 mt-1">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Chat section ─────────────────────────────────────────────────────────

function AIAssistant() {
  return (
    <section className="py-24 px-6 bg-[#030303]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <FadeIn>
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">Asistente IA</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
              Tu copiloto de<br />marketing con IA
            </h2>
            <p className="text-white/40 leading-relaxed mb-8">
              Describí tu negocio y objetivos. La IA te sugiere la estructura del funnel,
              proyecta revenue y ROAS, detecta cuellos de botella y puede generar el
              funnel completo en el editor con un solo mensaje.
            </p>
            <ul className="space-y-3">
              {[
                'Sugiere el tipo de funnel según tu modelo de negocio',
                'Proyecta revenue, ROAS y conversiones con datos reales',
                'Detecta cuellos de botella antes de que cuesten dinero',
                'Genera el funnel completo listo para simular',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/50">
                  <Check size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Right: chat window */}
          <FadeIn delay={100}>
            <div className="rounded-2xl border border-white/8 bg-[#0d0d0d] overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.05),0_0_80px_rgba(255,255,255,0.03),0_32px_80px_rgba(0,0,0,0.6)]">

              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
                <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                  <Brain size={13} className="text-white/50" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Asistente FunnelLab</p>
                  <p className="text-[10px] text-white/30">Especializado en funnels de marketing</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-white/30">En línea</span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4">

                {/* User */}
                <div className="flex justify-end">
                  <div className="bg-white/8 text-white/70 text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                    Quiero lanzar un curso online de $197. ¿Qué funnel me recomendás?
                  </div>
                </div>

                {/* AI response 1 */}
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={11} className="text-white/50" />
                  </div>
                  <div className="bg-[#111] border border-white/6 text-white/60 text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[88%] space-y-3">
                    <p>Para un infoproducto de $197 con tráfico frío, un <span className="text-white font-medium">Funnel VSL o Webinar</span> convierte mucho mejor que ir directo al checkout.</p>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/6 font-mono text-[11px] text-white/40 leading-relaxed space-y-0.5">
                      <p><span className="text-white/35">◈</span> FB/IG Ads — $800/mes</p>
                      <p className="pl-3 text-white/25">↓</p>
                      <p className="pl-3"><span className="text-white/50">▣</span> Landing de inscripción</p>
                      <p className="pl-6 text-white/25">↓</p>
                      <p className="pl-6"><span className="text-white/50">✉</span> Email sequence (3 mails)</p>
                      <p className="pl-9 text-white/25">↓</p>
                      <p className="pl-9"><span className="text-white/50">▶</span> Webinar / VSL</p>
                      <p className="pl-12 text-white/25">↓</p>
                      <p className="pl-12"><span className="text-white/50">◎</span> Checkout $197</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: '~270', lbl: 'Registros', sub: '30% conv.' },
                        { val: '22–36', lbl: 'Ventas', sub: 'ROAS 5–9x' },
                        { val: '$4,300+', lbl: 'Revenue', sub: 'estimado/mes' },
                      ].map(i => (
                        <div key={i.lbl} className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                          <p className="text-sm font-bold text-white">{i.val}</p>
                          <p className="text-[9px] text-white/40">{i.lbl}</p>
                          <p className="text-[9px] text-white/25">{i.sub}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-white/40">¿Querés que genere el funnel con $800 de presupuesto o lo ajustamos?</p>
                  </div>
                </div>

                {/* User */}
                <div className="flex justify-end">
                  <div className="bg-white/8 text-white/70 text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                    Generalo con $1,200 de presupuesto.
                  </div>
                </div>

                {/* AI response 2 — result */}
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={11} className="text-white/50" />
                  </div>
                  <div className="bg-[#111] border border-white/6 text-white/60 text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[88%] space-y-3">
                    <p>Listo. Creé tu funnel en el editor:</p>
                    <div className="bg-black/40 rounded-xl border border-white/10 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-white">Webinar $197 — FB/IG Ads</span>
                      </div>
                      {[
                        { label: 'Inversión mensual', value: '$1,200' },
                        { label: 'Revenue proyectado', value: '$8,640/mes' },
                        { label: 'ROAS estimado', value: '7.2x' },
                        { label: 'Nodos creados', value: '5 nodos' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between text-xs border-t border-white/5 pt-1.5">
                          <span className="text-white/35">{item.label}</span>
                          <span className="text-white font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-white/6 px-4 py-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/40 border border-white/8">
                  <span className="text-xs text-white/20 flex-1">Describí tu negocio o pedile que analice tu funnel...</span>
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={11} className="text-black" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing({ isAuthenticated }: { isAuthenticated: boolean }) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$6.99',
      color: 'text-[#aaa]',
      highlight: false,
      features: ['Canvas y simulación ilimitada', '3 proyectos', '1 escenario por proyecto', 'Blueprints incluidos'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$14.99',
      color: 'text-white',
      highlight: true,
      features: ['Todo lo de Starter', '150 créditos IA/mes', '10 proyectos', '4 escenarios por proyecto', 'Asistente IA completo', '7 días de prueba gratis'],
    },
    {
      id: 'max',
      name: 'Max',
      price: '$69',
      color: 'text-[#aaa]',
      highlight: false,
      features: ['Todo lo de Pro', '800 créditos IA/mes', 'Proyectos ilimitados', 'Escenarios ilimitados', 'Soporte prioritario'],
    },
  ]

  const ctaHref = isAuthenticated ? '/pricing' : '/register'

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">Planes</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Probalo gratis. Sin tarjeta.</h2>
          <p className="text-[#888] mb-3">Todos los planes pagos incluyen <span className="text-white font-semibold">7 días de prueba gratis</span> — cancelás cuando quieras.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            <span className="text-sm text-white/50 font-medium">Sin tarjeta para el plan Starter — es gratis de por vida</span>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {plans.map((p, i) => (
            <FadeIn key={p.id} delay={i * 80}>
              <div className={cn(
                'relative flex flex-col rounded-2xl border p-6 h-full',
                p.highlight ? 'border-white/15 bg-white/4 shadow-[0_0_40px_rgba(255,255,255,0.05),0_0_80px_rgba(255,255,255,0.03)]' : 'border-[#1e1e1e] bg-[#0d0d0d]',
              )}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-[11px] font-bold tracking-wide">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={cn('text-base font-bold mb-1', p.color)}>{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{p.price}</span>
                    <span className="text-[#666] text-sm">/mes</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#ccc]">
                      <Check size={13} className="text-white/40 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ctaHref}
                  className={cn(
                    'block text-center py-2.5 rounded-xl text-sm font-semibold transition-all',
                    p.highlight
                      ? 'bg-white hover:bg-[#e5e5e5] text-black'
                      : 'border border-[#2e2e2e] text-[#aaa] hover:border-white/20 hover:text-white',
                  )}
                >
                  {p.id === 'starter' ? 'Empezar gratis' : 'Probar 7 días gratis →'}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="max-w-sm mx-auto border border-[#1e1e1e] rounded-2xl p-5 bg-[#0d0d0d] text-center">
            <Zap size={16} className="text-white/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">Pack de créditos adicionales</p>
            <p className="text-xs text-[#666] mb-3">250 créditos · Compra única · No vencen</p>
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]">
              <span className="text-sm text-[#ccc]">250 créditos IA</span>
              <span className="text-sm font-bold text-white">$9.99</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '¿Qué es FunnelLab?',
    a: 'FunnelLab es una herramienta visual para simular funnels de marketing antes de lanzarlos. Construís el funnel con nodos arrastrables, configurás los parámetros y el sistema calcula automáticamente las conversiones, revenue y métricas clave.',
  },
  {
    q: '¿Necesito saber de marketing para usarlo?',
    a: 'No necesitás ser experto. La interfaz es visual e intuitiva. Además, el asistente de IA te guía para configurar los parámetros y te explica qué significan las métricas en términos simples.',
  },
  {
    q: '¿Qué incluyen los créditos de IA?',
    a: 'Los créditos se usan para funciones de IA: chat con el asistente, análisis del funnel, generación automática de funnels, resúmenes ejecutivos y sugerencias de optimización. El plan Starter no incluye créditos de IA.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí, podés cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. No hay permanencias ni penalizaciones. Seguís teniendo acceso hasta el fin del período pagado.',
  },
  {
    q: '¿Funciona para mi tipo de negocio?',
    a: 'FunnelLab tiene más de 70 tipos de nodos que cubren e-commerce, SaaS, agencias con clientes, negocios locales, infoproductos, servicios B2B y más. Si tenés un funnel, FunnelLab puede simularlo.',
  },
  {
    q: '¿Tiene prueba gratuita?',
    a: 'Los planes Pro y Max incluyen 7 días de prueba gratis. El plan Starter es gratuito de por vida con funciones limitadas. No necesitás tarjeta de crédito para el plan Starter.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-6 bg-[#0f0f0f] border-y border-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-wider mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Preguntas frecuentes</h2>
        </FadeIn>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 40}>
              <div className="border border-[#1e1e1e] rounded-xl overflow-hidden bg-[#0d0d0d]">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn('text-[#666] flex-shrink-0 transition-transform duration-200', open === i && 'rotate-180')}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-[#888] leading-relaxed border-t border-[#1e1e1e] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function FinalCTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="py-28 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Dejá de adivinar.<br />
            <span className="text-white">Empezá a simular.</span>
          </h2>
          <p className="text-[#888] mb-8">
            7 días de prueba gratis en planes pagos. Sin tarjeta para empezar.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-[#e5e5e5] text-black font-bold text-base transition-all"
          >
            {isAuthenticated ? 'Ir al dashboard' : 'Crear cuenta gratis'}
            <ArrowRight size={16} />
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#0f0f0f] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FunnelLab" className="h-7 w-auto mb-3" />
            <p className="text-xs text-[#555] leading-relaxed">
              Simulá funnels de marketing antes de gastar un centavo en ads.
            </p>
          </div>

          {/* Producto */}
          <div>
            <p className="text-xs font-semibold text-[#ccc] uppercase tracking-wider mb-3">Producto</p>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Demo'].map(l => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="text-sm text-[#666] hover:text-[#ccc] transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <p className="text-xs font-semibold text-[#ccc] uppercase tracking-wider mb-3">Cuenta</p>
            <ul className="space-y-2">
              {[{ label: 'Iniciar sesión', href: '/login' }, { label: 'Registrarse', href: '/register' }, { label: 'Dashboard', href: '/dashboard' }].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#666] hover:text-[#ccc] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-[#ccc] uppercase tracking-wider mb-3">Legal</p>
            <ul className="space-y-2">
              {[{ label: 'Términos de servicio', href: '/terms' }, { label: 'Privacidad', href: '/privacy' }].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#666] hover:text-[#ccc] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#555]">
            Hecho con ♥ por{' '}
            <a href="https://bralto.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#888] transition-colors">
              Bralto
            </a>
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: <Globe size={15} />, href: '#' },
              { icon: <AtSign size={15} />, href: '#' },
              { icon: <Globe size={15} />, href: '#' },
            ].map((s, i) => (
              <a key={i} href={s.href} className="text-[#555] hover:text-[#888] transition-colors">
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ParticlesBackground />
      <div className="relative" style={{ zIndex: 1 }}>
      <Navbar isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <SocialProof />
      <ProblemSolution />
      <AIAssistant />
      <Features />
      <HowItWorks />
      <Pricing isAuthenticated={isAuthenticated} />
      <FAQ />
      <FinalCTA isAuthenticated={isAuthenticated} />
      <Footer />
      </div>
    </div>
  )
}
