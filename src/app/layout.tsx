import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FunnelLab — Simulador de Funnels de Marketing',
    template: '%s',
  },
  description: 'Simulá tu funnel de marketing antes de gastar. Predecí resultados, optimizá con IA, y lanzá con confianza. Más de 70 tipos de nodos, simulación en tiempo real y asistente de IA integrado.',
  openGraph: {
    type: 'website',
    siteName: 'FunnelLab',
    locale: 'es_LA',
    url: 'https://funnellabs.bralto.io',
    title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
    description: 'Simulador de funnels de marketing con IA. Mapeá tu embudo, simulá resultados y optimizá con inteligencia artificial.',
    images: [
      {
        url: 'https://funnellabs.bralto.io/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FunnelLab — Simulador de Funnels de Marketing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
    description: 'Simulador de funnels de marketing con IA. Mapeá tu embudo, simulá resultados y optimizá con inteligencia artificial.',
    images: ['https://funnellabs.bralto.io/og-image.jpg'],
  },
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
