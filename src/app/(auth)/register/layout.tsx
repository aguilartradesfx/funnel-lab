import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta — FunnelLab',
  description: 'Creá tu cuenta gratis en FunnelLab y empezá a simular tus funnels de marketing hoy. Sin tarjeta de crédito.',
  alternates: {
    canonical: 'https://funnellabs.bralto.io/register',
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
