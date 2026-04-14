'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, ChevronDown, Zap, BarChart3,
  GitBranch, Brain, Menu, X, Globe, AtSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import FunnelDemo from './FunnelDemo'

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
      scrolled
        ? 'bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#2e2e2e]'
        : 'bg-transparent',
    )}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="FunnelLab" className="h-7 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={e => {
                e.preventDefault()
                document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all"
            >
              Ir al dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-slate-400" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f0f0f] border-b border-[#2e2e2e] px-6 py-4 space-y-3">
          {navLinks.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => { setMenuOpen(false); document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' }) }}
              className="block text-sm text-slate-300 hover:text-white py-1"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold text-center">
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-xl border border-[#2e2e2e] text-slate-300 text-sm text-center">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold text-center">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Subtle radial bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.08) 0%, transparent 70%)',
      }} />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-xs font-medium text-orange-400 mb-8">
          <Zap size={11} />
          Simulá, predecí y optimizá con IA
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
          Simulá tu funnel antes de{' '}
          <span className="text-orange-400">gastar un centavo</span>
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Construí visualmente cualquier funnel de marketing, predecí conversiones
          y detectá cuellos de botella antes de invertir en ads.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-base transition-all shadow-lg shadow-orange-950/40"
          >
            {isAuthenticated ? 'Ir al dashboard' : 'Empezar gratis'}
            <ArrowRight size={16} />
          </Link>
          <a
            href="#demo"
            onClick={e => { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#2e2e2e] hover:border-[#3e3e3e] text-slate-300 hover:text-white font-semibold text-base transition-all"
          >
            Ver demo
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            { value: '+70', label: 'tipos de nodos' },
            { value: '3', label: 'funnels en demo' },
            { value: '∞', label: 'escenarios posibles' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
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
        <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-5">
          Diseñado para marketers, agencias y emprendedores
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {platforms.map(p => (
            <span key={p} className="text-sm font-medium text-slate-600 hover:text-slate-400 transition-colors whitespace-nowrap">
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
      icon: '💸',
      title: 'Gastás en ads sin certeza',
      desc: 'Lanzás campañas y cruzás los dedos esperando que funcionen. Si no, ya perdiste el presupuesto.',
    },
    {
      icon: '🎲',
      title: 'Funnels por intuición',
      desc: 'Armás la estructura del funnel basado en feeling. No hay datos que respalden las decisiones.',
    },
    {
      icon: '🔍',
      title: 'Los cuellos de botella aparecen tarde',
      desc: 'Descubrís dónde estás perdiendo clientes cuando ya invertiste semanas y dinero.',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">El problema</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            ¿Cuánto dinero perdiste lanzando<br className="hidden md:block" /> funnels a ciegas?
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {pains.map((p, i) => (
            <FadeIn key={p.title} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-[#2e2e2e] bg-[#0f0f0f] h-full">
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="text-center">
          <div className="inline-block px-6 py-3 rounded-xl border border-orange-500/30 bg-orange-500/5">
            <p className="text-base font-semibold text-orange-300">
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
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">Demo en vivo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mirá cómo funciona</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
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
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Todo lo que necesitás para simular</h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 80}>
              <div className="p-6 rounded-2xl border border-[#2e2e2e] bg-[#111111] h-full group hover:border-orange-500/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-orange-600/15 border border-orange-600/20 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
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
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Tres pasos y ya estás simulando</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 120}>
              <div className="relative p-6 rounded-2xl border border-[#2e2e2e] bg-[#111111] h-full">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl font-black text-[#2e2e2e] leading-none flex-shrink-0">{s.n}</span>
                  <span className="px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-[10px] font-medium text-orange-400 mt-1">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
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
      color: 'text-slate-300',
      highlight: false,
      features: ['Canvas y simulación ilimitada', '3 proyectos', '1 escenario por proyecto', 'Blueprints incluidos'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$14.99',
      color: 'text-orange-400',
      highlight: true,
      features: ['Todo lo de Starter', '150 créditos IA/mes', '10 proyectos', '4 escenarios por proyecto', 'Asistente IA completo', '7 días de prueba gratis'],
    },
    {
      id: 'max',
      name: 'Max',
      price: '$69',
      color: 'text-purple-400',
      highlight: false,
      features: ['Todo lo de Pro', '800 créditos IA/mes', 'Proyectos ilimitados', 'Escenarios ilimitados', 'Soporte prioritario'],
    },
  ]

  const ctaHref = isAuthenticated ? '/pricing' : '/register'

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">Planes</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Sin sorpresas. Sin compromisos.</h2>
          <p className="text-slate-400">7 días de prueba gratis en planes pagos. Sin tarjeta para el plan Starter.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {plans.map((p, i) => (
            <FadeIn key={p.id} delay={i * 80}>
              <div className={cn(
                'relative flex flex-col rounded-2xl border p-6 h-full',
                p.highlight ? 'border-orange-500/50 bg-orange-500/5' : 'border-[#2e2e2e] bg-[#111111]',
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
                    <span className="text-slate-500 text-sm">/mes</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ctaHref}
                  className={cn(
                    'block text-center py-2.5 rounded-xl text-sm font-semibold transition-all',
                    p.highlight
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'border border-[#3e3e3e] text-slate-200 hover:border-orange-500/50 hover:text-white',
                  )}
                >
                  Empezar
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="max-w-sm mx-auto border border-[#2e2e2e] rounded-2xl p-5 bg-[#111111] text-center">
            <Zap size={16} className="text-orange-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">Pack de créditos adicionales</p>
            <p className="text-xs text-slate-500 mb-3">250 créditos · Compra única · No vencen</p>
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[#0f0f0f] border border-[#2e2e2e]">
              <span className="text-sm text-slate-300">250 créditos IA</span>
              <span className="text-sm font-bold text-orange-400">$9.99</span>
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
    a: 'FunnelLab tiene más de 70 tipos de nodos que cubren e-commerce, SaaS, agencias, negocios locales, infoproductos, servicios B2B y más. Si tenés un funnel de marketing, FunnelLab puede simularlo.',
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
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Preguntas frecuentes</h2>
        </FadeIn>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 40}>
              <div className="border border-[#2e2e2e] rounded-xl overflow-hidden bg-[#111111]">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn('text-slate-500 flex-shrink-0 transition-transform duration-200', open === i && 'rotate-180')}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-[#2e2e2e] pt-3">
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
            <span className="text-orange-400">Empezá a simular.</span>
          </h2>
          <p className="text-slate-400 mb-8">
            7 días de prueba gratis en planes pagos. Sin tarjeta para empezar.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-base transition-all shadow-lg shadow-orange-950/40"
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
            <p className="text-xs text-slate-600 leading-relaxed">
              Simulá funnels de marketing antes de gastar un centavo en ads.
            </p>
          </div>

          {/* Producto */}
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Producto</p>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Demo'].map(l => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Cuenta</p>
            <ul className="space-y-2">
              {[{ label: 'Iniciar sesión', href: '/login' }, { label: 'Registrarse', href: '/register' }, { label: 'Dashboard', href: '/dashboard' }].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Legal</p>
            <ul className="space-y-2">
              {[{ label: 'Términos de servicio', href: '/terms' }, { label: 'Privacidad', href: '/privacy' }].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Hecho con ♥ por{' '}
            <a href="https://bralto.io" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              Bralto
            </a>
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: <Globe size={15} />, href: '#' },
              { icon: <AtSign size={15} />, href: '#' },
              { icon: <Globe size={15} />, href: '#' },
            ].map((s, i) => (
              <a key={i} href={s.href} className="text-slate-600 hover:text-slate-400 transition-colors">
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
      <Navbar isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <SocialProof />
      <ProblemSolution />
      <DemoSection />
      <Features />
      <HowItWorks />
      <Pricing isAuthenticated={isAuthenticated} />
      <FAQ />
      <FinalCTA isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  )
}
