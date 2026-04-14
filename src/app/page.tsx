import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
  description: 'Simulador de funnels de marketing con IA. Mapeá tu embudo de ventas, simulá resultados, comparáescenarios y optimizá con inteligencia artificial. Para marketers, agencias y emprendedores.',
  keywords: 'simulador de funnels, funnel de ventas, simulador de marketing, embudo de ventas, funnel simulator, planificador de funnels, ROAS calculator, marketing funnel builder, herramienta de marketing digital',
  alternates: {
    canonical: 'https://funnellabs.bralto.io',
  },
  openGraph: {
    url: 'https://funnellabs.bralto.io',
    title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
    description: 'Simulador de funnels de marketing con IA. Mapeá tu embudo, simulá resultados y optimizá con inteligencia artificial.',
  },
}

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FunnelLab',
  description: 'Simulador de funnels de marketing con inteligencia artificial. Mapeá, simulá y optimizá tu embudo de ventas antes de gastar en publicidad.',
  url: 'https://funnellabs.bralto.io',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', name: 'Starter', price: '6.99', priceCurrency: 'USD', billingIncrement: 'Monthly' },
    { '@type': 'Offer', name: 'Pro', price: '14.99', priceCurrency: 'USD', billingIncrement: 'Monthly' },
    { '@type': 'Offer', name: 'Max', price: '69.00', priceCurrency: 'USD', billingIncrement: 'Monthly' },
  ],
  creator: { '@type': 'Organization', name: 'Bralto', url: 'https://bralto.io' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es FunnelLab?',
      acceptedAnswer: { '@type': 'Answer', text: 'FunnelLab es un simulador de funnels de marketing que te permite mapear, simular y optimizar tu embudo de ventas completo antes de gastar en publicidad. Usá IA para analizar tu funnel, detectar cuellos de botella y recibir recomendaciones específicas.' },
    },
    {
      '@type': 'Question',
      name: '¿Para quién es FunnelLab?',
      acceptedAnswer: { '@type': 'Answer', text: 'Para emprendedores, marketers, agencias de marketing, consultores y cualquier persona que invierta en estrategias de marketing digital y quiera predecir resultados antes de ejecutar.' },
    },
    {
      '@type': 'Question',
      name: '¿Necesito saber de marketing para usarlo?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. FunnelLab incluye templates pre-armados con métricas de industria y un asistente de IA que te guía paso a paso. Podés empezar desde un blueprint y personalizarlo para tu negocio.' },
    },
    {
      '@type': 'Question',
      name: '¿Qué incluyen los créditos de IA?',
      acceptedAnswer: { '@type': 'Answer', text: 'Los créditos de IA te permiten usar el asistente integrado para analizar tu funnel, recibir sugerencias de mejora con números específicos, generar funnels automáticamente desde una descripción de tu negocio, y crear resúmenes ejecutivos para presentar a clientes.' },
    },
    {
      '@type': 'Question',
      name: '¿Puedo cancelar cuando quiera?',
      acceptedAnswer: { '@type': 'Answer', text: 'Sí, podés cancelar tu suscripción en cualquier momento. Mantenés el acceso hasta el final del período ya pagado. No hay contratos ni permanencia mínima.' },
    },
    {
      '@type': 'Question',
      name: '¿Tiene prueba gratuita?',
      acceptedAnswer: { '@type': 'Answer', text: 'Sí, los planes pagos incluyen 7 días de prueba gratuita. Podés probar todas las funcionalidades antes de que se realice el primer cobro.' },
    },
  ],
}

export default async function HomePage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {
    // Si falla el cliente de Supabase, mostramos la landing sin auth
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage isAuthenticated={isAuthenticated} />
    </>
  )
}
