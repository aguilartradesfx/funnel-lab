import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

export const metadata = {
  title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
  description: 'Simulá funnels de marketing, predecí resultados y optimizá con IA antes de invertir en ads. Más de 70 tipos de nodos, asistente IA y colaboración en equipo.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <LandingPage isAuthenticated={!!user} />
}
