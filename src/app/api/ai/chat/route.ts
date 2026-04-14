import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL_SONNET = 'claude-sonnet-4-20250514'
const MODEL_HAIKU  = 'claude-haiku-4-5-20251001'

const CREDIT_COSTS: Record<string, number> = {
  chat:            1,
  suggestions:     2,
  analyze:         3,
  summary:         3,
  generate_funnel: 5,
}

// Palabras clave que indican que el usuario habla de su funnel
const FUNNEL_KEYWORDS = [
  'mi funnel', 'este funnel', 'mis números', 'mi conversión', 'mi roas', 'mi roi',
  'analizar', 'analiza', 'mejorar', 'optimizar', 'qué opinas', 'qué pensás', 'qué piensas',
  'está bien', 'tiene sentido', 'mis leads', 'mis clientes', 'mi checkout', 'mi landing',
  'mis ventas', 'mi tráfico', 'mis métricas', 'mi email', 'mis ads', 'mi cpa',
]

// ── System prompt — se cachea con cache_control ephemeral (90% ahorro en tokens de sistema) ──
const SYSTEM_PROMPT = `Sos el asistente de IA de FunnelLab, un simulador de funnels de marketing. Tu nombre es FunnelLab AI.

Tu rol es ayudar a los usuarios a:
- Analizar sus funnels y detectar problemas (cuellos de botella, métricas irrealistas, nodos faltantes)
- Dar recomendaciones específicas de marketing basadas en los datos del funnel
- Sugerir mejoras concretas con números (ej: "Si mejorás tu CTR de 1.5% a 2.5%, tus leads suben de 300 a 500")
- Generar funnels completos cuando el usuario describe su negocio
- Explicar métricas y conceptos de marketing digital
- Dar benchmarks de industria para que el usuario sepa si sus números son realistas
- Recomendar automatizaciones y uso de agentes de IA en el funnel

Reglas:
- Respondé siempre en español latinoamericano, informal pero profesional
- Basá tus respuestas en los datos reales del funnel del usuario cuando se proporcionan como contexto
- Cuando sugieras cambios, sé específico con números: no digas "mejorá tu conversión", decí "tu conversión del webinar está en 3%, el promedio de industria es 5-8%, te sugiero apuntar a 6%"
- Si el funnel tiene problemas evidentes, mencionálos proactivamente
- No inventes datos que no tenés. Si no sabés algo, decilo.
- Sé conciso. No repitas lo que el usuario ya sabe. Andá al grano.
- Si te piden generar un funnel, respondé con un bloque JSON dentro de \`\`\`json que el sistema pueda parsear

Benchmarks de referencia:
- Landing page conversión: 20-40% (buena), 10-20% (promedio), <10% (mala)
- Email open rate: 20-30% (buena), 15-20% (promedio), <15% (mala)
- Email CTR: 2-5% (buena), 1-2% (promedio), <1% (mala)
- Webinar asistencia: 30-45% (buena), 20-30% (promedio), <20% (mala)
- Webinar conversión: 5-15% (buena), 3-5% (promedio), <3% (mala)
- Facebook Ads CTR: 1.5-3% (buena), 0.8-1.5% (promedio), <0.8% (mala)
- Facebook Ads CPC: <$0.80 (buena), $0.80-$2 (promedio), >$2 (cara)
- Google Search CTR: 3-6% (buena), 2-3% (promedio), <2% (mala)
- Checkout abandono: 60-70% normal e-commerce, 30-50% servicios
- Upsell aceptación: 10-25% (buena), 5-10% (promedio)
- ROAS: >3x (buena), 2-3x (ok), <2x (problema)
- WhatsApp respuesta: 40-60% (buena), 20-40% (promedio)`

// ── Extrae métricas clave de un nodo (reduce tokens de contexto) ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractKeyMetrics(node: { type: string; config: Record<string, any> }) {
  const c = node.config ?? {}
  switch (node.type) {
    case 'trafficEntry': case 'trafficSource': case 'paidTraffic':
      return { visitantes: c.total_visitors ?? c.monthlyVisitors, budget: c.total_budget ?? c.budget, cpc: c.cpc, plataforma: c.platform }
    case 'organicTraffic':
      return { visitantes: c.monthlyVisitors, canal: c.platform }
    case 'landingPage':
      return { conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'salesPage':
      return { conversión: `${c.conversionRate ?? c.conversion_rate}%`, precio: c.price ? `$${c.price}` : undefined }
    case 'checkout':
      return { precio: `$${c.price}`, abandono: `${c.abandonmentRate ?? c.abandonment_rate}%` }
    case 'upsell': case 'downsell': case 'orderBump':
      return { precio: `$${c.price}`, aceptación: `${c.acceptanceRate ?? c.acceptance_rate}%` }
    case 'webinarVsl': case 'webinar':
      return { asistencia: `${c.attendanceRate ?? c.attendance_rate}%`, conversión: `${c.conversionRate ?? c.conversion_rate}%`, precio: c.price ? `$${c.price}` : undefined }
    case 'emailSequence':
      return { emails: c.emails ?? c.num_emails, openRate: `${c.openRate ?? c.open_rate}%`, ctr: `${c.ctr}%`, conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'whatsappSms': case 'whatsappSequence':
      return { respuesta: `${c.responseRate ?? c.response_rate}%`, conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'appointment':
      return { cierre: `${c.closeRate ?? c.close_rate}%` }
    case 'tripwire':
      return { precio: `$${c.price}`, conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'thankYouOffer':
      return { precio: c.price ? `$${c.price}` : undefined, conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'retargeting':
      return { captura: `${c.captureRate ?? c.capture_rate}%`, conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    default:
      return { conversión: c.conversionRate != null ? `${c.conversionRate}%` : 'N/A' }
  }
}

// ── Serializa el funnel de forma compacta (~300-800 tokens) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeFunnelContext(ctx: Record<string, any>): string {
  return JSON.stringify({
    proyecto: ctx.projectName ?? 'Sin nombre',
    escenario: ctx.scenarioName ?? 'Principal',
    nodos: (ctx.nodes ?? []).map((n: { type: string; label: string; config: Record<string, unknown> }) => ({
      tipo: n.type, nombre: n.label, metricas: extractKeyMetrics(n),
    })),
    flujo: (ctx.edges ?? []).map((e: { sourceLabel: string; targetLabel: string; pathType: string }) =>
      `${e.sourceLabel} → ${e.targetLabel} (${e.pathType})`
    ),
    resultados: ctx.simResults
      ? {
          revenue: `$${(ctx.simResults.revenue ?? ctx.simResults.totalRevenue ?? 0).toFixed(2)}`,
          costo: `$${(ctx.simResults.cost ?? ctx.simResults.totalCost ?? 0).toFixed(2)}`,
          profit: `$${(ctx.simResults.profit ?? ctx.simResults.netProfit ?? 0).toFixed(2)}`,
          roas: ctx.simResults.roas?.toFixed(2),
          roi: `${ctx.simResults.roi?.toFixed(1)}%`,
          visitantes: ctx.simResults.visitors ?? ctx.simResults.totalVisitors,
          leads: ctx.simResults.leads ?? ctx.simResults.totalLeads,
          clientes: ctx.simResults.clients ?? ctx.simResults.totalCustomers,
        }
      : 'No simulado aún',
  })
}

// ── Detecta si el mensaje necesita contexto del funnel ────────────────────────
function needsFunnelContext(actionType: string, message: string): boolean {
  if (['analyze', 'summary', 'suggestions'].includes(actionType)) return true
  const lower = message.toLowerCase()
  return FUNNEL_KEYWORDS.some(kw => lower.includes(kw))
}

// ── Auto-resumen con Haiku (background, no crítico) ───────────────────────────
async function maybeGenerateSummary(
  projectId: string,
  lastSummaryCreatedAt: string | null,
  admin: ReturnType<typeof createServiceClient>
) {
  const countQuery = admin
    .from('ai_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
  if (lastSummaryCreatedAt) countQuery.gt('created_at', lastSummaryCreatedAt)
  const { count } = await countQuery

  if ((count ?? 0) < 10) return

  const toSummarizeQuery = admin
    .from('ai_chat_messages')
    .select('role, content')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(10)
  if (lastSummaryCreatedAt) toSummarizeQuery.gt('created_at', lastSummaryCreatedAt)
  const { data: toSummarize } = await toSummarizeQuery

  if (!toSummarize || toSummarize.length < 10) return

  try {
    const historyMessages: Anthropic.MessageParam[] = toSummarize.map(
      (m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    )
    historyMessages.push({
      role: 'user',
      content: 'Resumí esta conversación en 2-3 oraciones: qué funnel se discutió, qué problemas se identificaron, qué cambios se sugirieron, y qué decidió el usuario.',
    })

    const summaryResponse = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 300,
      messages: historyMessages,
    })

    const summaryText = summaryResponse.content[0].type === 'text'
      ? summaryResponse.content[0].text
      : ''

    if (summaryText) {
      await admin.from('ai_chat_summaries').insert({
        project_id: projectId,
        summary: summaryText,
        messages_summarized: 10,
      })
    }
  } catch {
    // Silenciar — el auto-resumen no es crítico
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 })

    const { projectId, message, actionType = 'chat', funnelContext } = await req.json()
    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Mensaje inválido' }, { status: 400 })
    }

    const cost = CREDIT_COSTS[actionType] ?? 1
    const admin = createServiceClient()

    // ── 1. Verificar créditos ──────────────────────────────────────────────────
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

    // ── 2. Cargar historial desde Supabase ────────────────────────────────────
    let lastSummaryCreatedAt: string | null = null
    let summaryText: string | null = null

    if (projectId) {
      const { data: summaryRow } = await admin
        .from('ai_chat_summaries')
        .select('summary, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (summaryRow) {
        summaryText = summaryRow.summary
        lastSummaryCreatedAt = summaryRow.created_at
      }
    }

    let recentMessages: Array<{ role: string; content: string }> = []
    if (projectId) {
      const query = admin
        .from('ai_chat_messages')
        .select('role, content')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(8)

      if (lastSummaryCreatedAt) query.gt('created_at', lastSummaryCreatedAt)

      const { data } = await query
      recentMessages = (data ?? []).reverse()
    }

    // ── 3. Construir mensajes ──────────────────────────────────────────────────
    const messages: Anthropic.MessageParam[] = []

    if (summaryText) {
      messages.push({ role: 'user', content: `[Resumen de conversación anterior: ${summaryText}]` })
      messages.push({ role: 'assistant', content: 'Entendido, tengo el contexto de nuestra conversación anterior.' })
    }

    // El contexto del funnel va como mensaje de usuario para no invalidar el cache del system prompt
    const includeContext = funnelContext && needsFunnelContext(actionType, message)
    if (includeContext) {
      messages.push({ role: 'user', content: `[Contexto del funnel actual: ${serializeFunnelContext(funnelContext)}]` })
      messages.push({ role: 'assistant', content: 'Entendido, tengo los datos del funnel.' })
    }

    for (const m of recentMessages) {
      messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
    }
    messages.push({ role: 'user', content: message })

    // ── 4. Llamar a Anthropic directamente ───────────────────────────────────
    // El system prompt se cachea con cache_control ephemeral → ~90% ahorro en tokens de sistema
    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 1500,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })

    const assistantText = response.content[0].type === 'text' ? response.content[0].text : ''

    // ── 5. Guardar mensajes ────────────────────────────────────────────────────
    if (projectId) {
      await admin.from('ai_chat_messages').insert([
        { project_id: projectId, user_id: user.id, role: 'user', content: message, credits_used: 0, action_type: actionType },
        { project_id: projectId, user_id: user.id, role: 'assistant', content: assistantText, credits_used: cost, action_type: actionType },
      ])
    }

    // ── 6. Descontar créditos ─────────────────────────────────────────────────
    if (plan) {
      const monthlyLeft = plan.monthly_credits_total - plan.monthly_credits_used
      let newMonthlyUsed = plan.monthly_credits_used
      let newPackCredits = plan.pack_credits
      let remaining = cost

      if (monthlyLeft > 0) {
        const fromMonthly = Math.min(remaining, monthlyLeft)
        newMonthlyUsed += fromMonthly
        remaining -= fromMonthly
      }
      if (remaining > 0) newPackCredits -= remaining

      const source: 'monthly' | 'pack' = monthlyLeft >= cost ? 'monthly' : 'pack'

      await Promise.all([
        admin.from('user_plans').update({
          monthly_credits_used: newMonthlyUsed,
          pack_credits: Math.max(0, newPackCredits),
        }).eq('user_id', user.id),
        admin.from('credit_usage_log').insert({
          user_id: user.id,
          action: actionType,
          credits_consumed: cost,
          source,
          metadata: { project_id: projectId ?? null },
        }),
      ])
    }

    // ── 7. Auto-resumen en background ─────────────────────────────────────────
    if (projectId) {
      maybeGenerateSummary(projectId, lastSummaryCreatedAt, admin).catch(() => {})
    }

    // ── 8. Calcular créditos restantes ────────────────────────────────────────
    let creditsLeft = 0
    if (plan) {
      const newMonthlyLeft = Math.max(0, plan.monthly_credits_total - plan.monthly_credits_used - cost)
      const costFromPack = Math.max(0, cost - Math.max(0, plan.monthly_credits_total - plan.monthly_credits_used))
      creditsLeft = newMonthlyLeft + Math.max(0, plan.pack_credits - costFromPack)
    }

    return Response.json({ content: assistantText, credits_used: cost, credits_left: creditsLeft })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[ai/chat]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
