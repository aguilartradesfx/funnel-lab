import { streamText, createUIMessageStreamResponse } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  suggestions: 2,
  analyze: 3,
  summary: 3,
  generate_funnel: 5,
}

const SYSTEM_PROMPT = `Sos un experto en marketing digital y funnels de ventas con más de 10 años de experiencia en Latinoamérica. Tu especialidad es analizar, optimizar y diseñar funnels para negocios de toda escala.

CÓMO RESPONDER:
- Siempre en español (es-419 / Latinoamérica)
- Respuestas concretas, específicas y accionables
- Cuando des benchmarks, especificá la industria y región
- Usá números reales y contexto latinoamericano
- Sé directo y evita jerga innecesaria
- Máximo 400 palabras por respuesta a menos que se pida más detalle

MÉTRICAS DE REFERENCIA LATAM:
- Facebook Ads CTR: 1-2.5% | CPC: $0.20-$0.80 USD
- Google Ads CTR: 3-6% | CPC: $0.50-$3.00 USD
- Landing pages opt-in: 25-45%
- Sales pages conversión: 2-5%
- Checkout abandono: 65-75%
- Email open rate: 22-32%
- WhatsApp respuesta: 40-60%
- Upsell aceptación: 15-30%
- Webinar asistencia: 25-40%

Si el usuario te comparte datos de su funnel, analizalos específicamente.
Si detectás métricas irreales, señalalo con benchmark comparativo.
Si el funnel tiene brechas obvias, mencionalo.`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { messages, funnelContext, action = 'chat' } = await req.json()
    const cost = CREDIT_COSTS[action] ?? 1

    // Verificar créditos disponibles
    const admin = createServiceClient()
    const { data: plan } = await admin
      .from('user_plans')
      .select('plan, monthly_credits_total, monthly_credits_used, pack_credits')
      .eq('user_id', user.id)
      .single()

    if (plan) {
      const monthlyLeft = plan.monthly_credits_total - plan.monthly_credits_used
      const totalLeft = Math.max(0, monthlyLeft) + plan.pack_credits

      if (plan.plan === 'starter' && plan.monthly_credits_total === 0) {
        return Response.json(
          { error: 'sin_creditos', message: 'El plan Starter no incluye créditos de IA. Hacé upgrade para usar el asistente.' },
          { status: 402 }
        )
      }

      if (totalLeft < cost) {
        return Response.json(
          { error: 'sin_creditos', message: 'Se agotaron tus créditos. Comprá más o hacé upgrade de plan.', credits_left: totalLeft },
          { status: 402 }
        )
      }
    }

    // Construir contexto del funnel
    let contextAddition = ''
    if (funnelContext?.nodes?.length > 0) {
      contextAddition = `\n\nCONTEXTO DEL FUNNEL ACTUAL:
Nodos (${funnelContext.nodes.length}):
${funnelContext.nodes.map((n: { label: string; type: string; config: Record<string, unknown> }) =>
  `- ${n.label} (${n.type}): ${JSON.stringify(n.config)}`
).join('\n')}

Conexiones (${funnelContext.edges.length}):
${funnelContext.edges.map((e: { source: string; target: string; pathType: string }) =>
  `- ${e.source} → ${e.target} [${e.pathType}]`
).join('\n')}
${funnelContext.simResults ? `
Última simulación:
- Revenue: $${funnelContext.simResults.totalRevenue?.toFixed(2)}
- Costo: $${funnelContext.simResults.totalCost?.toFixed(2)}
- Profit: $${funnelContext.simResults.netProfit?.toFixed(2)}
- ROAS: ${funnelContext.simResults.roas?.toFixed(2)}x
- ROI: ${funnelContext.simResults.roi?.toFixed(1)}%
- CPA: $${funnelContext.simResults.cpa?.toFixed(2)}
- Visitantes: ${funnelContext.simResults.totalVisitors}
- Leads: ${funnelContext.simResults.totalLeads}
- Clientes: ${funnelContext.simResults.totalCustomers}` : '(sin simulación ejecutada)'}`
    }

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: SYSTEM_PROMPT + contextAddition,
      messages,
      maxOutputTokens: 1024,
      onFinish: async () => {
        // Consumir créditos al terminar (solo si el stream completó)
        if (!plan) return
        const monthlyLeft = plan.monthly_credits_total - plan.monthly_credits_used
        let newMonthlyUsed = plan.monthly_credits_used
        let newPackCredits = plan.pack_credits
        let source: 'monthly' | 'pack' = 'monthly'
        let remaining = cost

        if (monthlyLeft > 0) {
          const fromMonthly = Math.min(remaining, monthlyLeft)
          newMonthlyUsed += fromMonthly
          remaining -= fromMonthly
        }
        if (remaining > 0) {
          newPackCredits -= remaining
          source = monthlyLeft > 0 ? 'monthly' : 'pack'
        }

        await Promise.all([
          admin.from('user_plans').update({
            monthly_credits_used: newMonthlyUsed,
            pack_credits: Math.max(0, newPackCredits),
          }).eq('user_id', user.id),
          admin.from('credit_usage_log').insert({
            user_id: user.id,
            action,
            credits_consumed: cost,
            source,
            metadata: { scenario_id: funnelContext?.scenarioId ?? null },
          }),
        ])
      },
    })

    return createUIMessageStreamResponse({ stream: result.toUIMessageStream() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return Response.json({ error: message }, { status: 500 })
  }
}
