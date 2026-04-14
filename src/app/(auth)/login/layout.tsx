import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión — FunnelLab',
  description: 'Accedé a tu cuenta de FunnelLab para simular y optimizar tus funnels de marketing.',
  alternates: {
    canonical: 'https://funnellabs.bralto.io/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
