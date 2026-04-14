import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

export const metadata = {
  title: 'FunnelLab — Simulá tu funnel antes de gastar un centavo',
  description: 'Simulá funnels de marketing, predecí resultados y optimizá con IA antes de invertir en ads. Más de 70 tipos de nodos, asistente IA y colaboración en equipo.',
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
  return <LandingPage isAuthenticated={isAuthenticated} />
}
