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
- Si te piden generar un funnel, respondé con un bloque JSON dentro de \`\`\`json que el sistema pueda parsear. CRÍTICO: el JSON SIEMPRE debe ir dentro de triple backticks \`\`\`json ... \`\`\`. NUNCA lo devuelvas como texto plano sin backticks.
- Cuando el usuario te pida que crees, armes o implementes un funnel en el canvas (frases como "armame el funnel", "crealo", "ponelo en el canvas", "implementá la estrategia", "hacelo", "generalo", "genera un funnel"), SIEMPRE respondé con el JSON del funnel dentro de \`\`\`json para que el sistema lo cree automáticamente. No le digas al usuario que lo haga manualmente.
- Podés incluir análisis o explicación ANTES del bloque JSON, pero el JSON en sí SIEMPRE va dentro de \`\`\`json ... \`\`\`.
- Cuando quieras destacar métricas proyectadas clave (máximo 3-4 cifras), usá esta sintaxis en una línea separada: > valor | label && valor | label && valor | label
  Ejemplo: > ~270 | leads/mes && 22-36 | días de setup && $4,300+ | revenue/mes
  Usala al final de una recomendación o análisis para resumir el impacto con números concretos.

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
- WhatsApp respuesta: 40-60% (buena), 20-40% (promedio)

═══════════════════════════════════════════════════════
CATÁLOGO COMPLETO DE NODOS — GENERACIÓN DE FUNNELS
═══════════════════════════════════════════════════════

REGLAS CRÍTICAS PARA GENERAR FUNNELS:
1. Todo funnel DEBE empezar con un nodo de tráfico (trafficEntry recomendado) y SIEMPRE terminar con "result"
2. No crear nodos duplicados del mismo tipo en secuencia sin razón lógica (ej: landingPage → landingPage)
3. connections usa índices 0-based del array nodes: { from_index, to_index, path_type }
4. path_type: "yes"/"no" para nodos con salida yes/no | "default" para salida única | "branch-0"..."branch-3" para split/abSplitTest
5. trafficEntry DEBE tener totalVisitors > 0 para que la simulación funcione
6. Configurar siempre parámetros realistas — no dejar configs en 0 ni vacías
7. Cada rama del funnel DEBE terminar llegando a result (conectar todos los caminos finales a result)
8. FUNNELS ORGÁNICOS: Si el usuario pide un funnel 100% orgánico (sin ads), el retargeting DEBE usar cpc:0 (retargeting orgánico por email/contenido, sin costo). Solo usar cpc>0 si el usuario pide explícitamente retargeting pagado.
9. CONFIGURACIÓN REALISTA DE CHECKOUT: abandonment 65% = conversionRate efectivo ~35%. Asegurate de que los configs generen visitantes suficientes para que los números sean significativos (mínimo 500-1000 visitas al inicio del funnel).

══════════════════════════════════════════════════════════
SEMÁNTICA DE PATH_TYPE — REGLA MAESTRA
══════════════════════════════════════════════════════════

ANTES de escribir cada conexión, hacete UNA sola pregunta:
  "¿Este visitante CONVIRTIÓ en el nodo origen?"
  → SÍ convirtió   → path_type: "yes"   → va al SIGUIENTE PASO de venta
  → NO convirtió   → path_type: "no"    → va a RECUPERACIÓN/NURTURING

GRUPOS INAMOVIBLES — estos path_types NUNCA cambian, sin excepción:

GRUPO A — SIEMPRE desde "no" (son para quien NO convirtió):
  retargeting, dynamicRetargeting   → recupera a quien ignoró/salió
  cartAbandonmentSeq                → recupera a quien abandonó el pago
  reEngagement, winBack             → recupera inactivos / clientes perdidos
  downsell                          → alternativa para quien rechazó el upsell

  ❌ JAMÁS: cualquier_nodo(yes) → retargeting
  ❌ JAMÁS: cualquier_nodo(yes) → cartAbandonmentSeq
  ❌ JAMÁS: cualquier_nodo(yes) → reEngagement / winBack
  ❌ JAMÁS: checkout(yes) → cartAbandonmentSeq  ← ERROR CRÍTICO: los que PAGARON no abandonaron
  ❌ JAMÁS: landingPage(yes) → retargeting      ← ERROR CRÍTICO: los que convirtieron no se retratan

GRUPO B — SIEMPRE desde "yes" (son para quien SÍ compró/convirtió):
  upsell, orderBump                 → oferta inmediata post-pago
  onboardingSeq                     → bienvenida al nuevo cliente
  reviewRequest, referralProgram    → acciones post-compra
  loyaltyProgram, npsSurvey         → retención y feedback
  postSaleSupport, customerCommunity→ soporte y comunidad
  crossSell, renewalUpsell          → ventas adicionales a clientes

  ❌ JAMÁS: checkout(no) → upsell       ← los que NO pagaron no ven el upsell
  ❌ JAMÁS: cualquier_nodo(no) → onboardingSeq / reviewRequest / referralProgram / etc.

TABLA CANÓNICA DE CONEXIONES — seguila al pie de la letra:

┌─────────────────────┬──────────────────────────────────────┬──────────────────────────────────────────┐
│ Nodo origen         │ Salida YES → destino                 │ Salida NO → destino                      │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ landingPage         │ salesPage / checkout / webinarVsl    │ retargeting / emailSequence (re-eng.)    │
│ (bridge page)       │ (los que hicieron clic/avanzaron)    │ (los que NO convirtieron se recuperan)   │
│ landingPage         │ emailSequence                        │ retargeting                              │
│ (opt-in)            │ (los que dieron su email)            │ (los que NO dieron su email)             │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ emailSequence       │ salesPage / checkout / webinarVsl    │ retargeting / result / nada más          │
│                     │ (los que hicieron clic en el email)  │ (los que no abrieron/no hicieron clic)   │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ salesPage           │ checkout                             │ retargeting / emailSequence (re-eng.)    │
│                     │ (los que hicieron clic en "comprar") │ (los que salieron sin comprar)           │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ checkout            │ upsell / orderBump / result          │ cartAbandonmentSeq / retargeting         │
│                     │ (los que PAGARON — completaron pago) │ (los que NO completaron — abandonaron)   │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ upsell              │ siguiente upsell / result            │ downsell / result                        │
│                     │ (aceptaron la oferta extra)          │ (rechazaron — ofrecer algo más barato)   │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ downsell            │ result                               │ result                                   │
│                     │ (aceptaron la oferta reducida)       │ (rechazaron también — igualmente result) │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ webinarVsl          │ checkout                             │ emailSequence / retargeting              │
│                     │ (mostraron interés — clic en comprar)│ (los que no convirtieron en el webinar)  │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ leadMagnet          │ emailSequence / salesPage            │ retargeting                              │
│                     │ (descargaron/accedieron)             │ (no accedieron)                          │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ applicationPage     │ appointment / emailSequence          │ emailSequence re-engagement              │
│                     │ (completaron la solicitud)           │ (no completaron / no calificaron)        │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ appointment         │ salesProposal / checkout / result    │ emailSequence de seguimiento             │
│                     │ (se presentaron y hubo avance)       │ (no se presentaron / no hubo cierre)     │
├─────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ retargeting         │ salesPage / checkout / landingPage   │ (no conectar — se fueron definitivo)     │
│ cartAbandonmentSeq  │ checkout (reentran al carrito)       │ (no conectar — se fueron definitivo)     │
└─────────────────────┴──────────────────────────────────────┴──────────────────────────────────────────┘

REGLAS ABSOLUTAS (nunca se rompen):
❌ Nodos del GRUPO A nunca reciben tráfico "yes" — sin excepciones.
❌ Nodos del GRUPO B nunca reciben tráfico "no" — sin excepciones.
❌ NUNCA conectar retargeting, cartAbandonmentSeq directamente a result (reentran al flujo).
✅ Los nodos de recuperación SIEMPRE reentran al flujo principal → van a salesPage, checkout, o landingPage.

FLUJO CORRECTO INFOPRODUCTO/CURSO (bridge page):
trafficEntry →(default)→ landingPage →(YES)→ salesPage →(YES)→ checkout →(YES)→ upsell →(YES)→ result
                                      ↓(NO)                              ↓(NO)          ↓(NO)
                              emailSequence →(YES)→ salesPage     cartAbandonmentSeq   downsell → result
                              retargeting   →(YES)→ salesPage

FLUJO CORRECTO OPT-IN (lead magnet — landingPage captura emails):
trafficEntry →(default)→ landingPage →(YES)→ emailSequence →(YES)→ salesPage →(YES)→ checkout →(YES)→ result
                                      ↓(NO)                                              ↓(NO)
                                  retargeting                                    cartAbandonmentSeq

══════════════════════════════════════════════════════════
REGLAS DE ESTRUCTURA DE FUNNELS — OBLIGATORIAS
══════════════════════════════════════════════════════════

R1. RESULTADO SIEMPRE DESPUÉS DE UN NODO DE PAGO.
NUNCA conectar ningún nodo directamente a "result" a menos que antes haya pasado por al menos un nodo de cobro (checkout, upsell, downsell, orderBump, webinarVsl, appointment, salesProposal, tripwire, trialToPaid, digitalContract, outboundCall, inboundCall, eventSales). El "result" es el nodo final que resume el revenue — si no hubo cobro previo, el funnel no tiene sentido comercial.
❌ MAL: trafficEntry → landingPage → emailSequence → result
✅ BIEN: trafficEntry → landingPage → emailSequence → salesPage → checkout → result

R2. PÁGINA DE VENTAS (salesPage) ES UN NODO FILTRO — NUNCA GENERA REVENUE.
salesPage solo convierte visitantes en interesados (% de CTR al checkout). NO tiene precio, NO genera dinero. El precio del producto VA en el Checkout. Cuando generes un funnel con salesPage, SIEMPRE incluí un checkout inmediatamente después.
❌ MAL: salesPage → result
✅ BIEN: salesPage → checkout → result
Secuencia correcta completa: tráfico → (landing?) → (email?) → salesPage → checkout → (upsell/orderBump?) → result
Config de salesPage: SOLO { "conversionRate": 3 } — sin "price", sin "productId".

R3. CHECKOUT = ÚNICO NODO DE COBRO DEL PRODUCTO PRINCIPAL.
El precio del producto va en checkout.price. La tasa de abandono del checkout representa quienes no completan el pago (normal: 60-70% e-commerce, 30-50% servicios). El "yes" de checkout = compraron. El "no" de checkout = abandonaron (conectar a cartAbandonmentSeq o retargeting si se desea recuperar).

R4. FLUJO LINEAL LÓGICO — NO SALTAR PASOS.
El flujo siempre respeta este orden: Tráfico → Captación/Filtro → Nurturing → Venta → Post-venta → Resultado.
NUNCA conectar un nodo de nurturing (emailSequence, whatsappSms) directo a result.
NUNCA conectar un nodo de recuperación (retargeting, cartAbandonmentSeq) directo a result.
Los nodos de recuperación siempre reentran al flujo de venta (van a landingPage, salesPage o checkout, no a result).

R5. FUENTES DE TRÁFICO ORGÁNICO CON DATOS ESPECÍFICOS.
Si el usuario menciona fuentes con números concretos (ej: "YouTube 3,500 views por video, 2 videos/mes"), calcular y configurar con esos datos:
- Calcular visitantes: 3,500 × 2 = 7,000 views/mes × CTR estimado 3% = 210 visitantes
- Hacer el mismo cálculo para cada fuente mencionada
- El trafficEntry debe tener sources[] completo con todos los campos: { id, name, source, type, reach, ctr, visitors }
- totalVisitors = suma de todos los visitors. Para orgánico: totalBudget:0.
NUNCA generar un trafficEntry con sources[] vacío cuando el usuario dio datos de tráfico.

══ TRÁFICO (nodos de entrada — sin input, siempre primeros) ══
trafficEntry — Contenedor de fuentes de tráfico. SIEMPRE el primer nodo. Salida: única (default).
  Config PAGADO: { "name":"Tráfico Principal", "sources":[{"id":"s1","name":"Facebook Ads","source":"facebook_ads","type":"paid","budget":1000,"costModel":"cpc","cpc":0.80,"ctr":2,"visitors":1250}], "totalVisitors":1250, "totalPaidVisitors":1250, "totalOrganicVisitors":0, "totalBudget":1000 }
  Config ORGÁNICO: { "name":"Tráfico Orgánico", "sources":[{"id":"s1","name":"YouTube","source":"youtube_organic","type":"organic","reach":50000,"engagementRate":3,"ctr":2,"visitors":3000},{"id":"s2","name":"Instagram Reels","source":"instagram_organic","type":"organic","reach":30000,"engagementRate":5,"ctr":3,"visitors":4500}], "totalVisitors":7500, "totalPaidVisitors":0, "totalOrganicVisitors":7500, "totalBudget":0 }
  CRÍTICO: totalVisitors debe coincidir con la suma de visitors de las fuentes. Para orgánico totalBudget:0.
  source opciones: "facebook_ads","google_search","google_display","tiktok_ads","instagram_organic","tiktok_organic","youtube_organic","linkedin_organic","blog_seo","email","podcast","referrals"

paidTraffic — Tráfico pagado especializado. Salida: única (default).
  Config: { "platform":"meta", "costModel":"cpc", "budget":1000, "cpc":0.80, "cpm":10, "cpv":0.05, "ctr":2 }
  platform: "meta"|"googleSearch"|"googleDisplay"|"youtube"|"tiktok"|"linkedin"|"twitter"|"pinterest"|"other"

organicTraffic — Canal orgánico. Salida: única (default).
  Config: { "channel":"instagram", "reach":10000, "engagementRate":3, "ctr":2, "listSize":0, "openRate":0, "activeReferrers":0, "referralsPerReferrer":0, "referralConversionRate":0 }
  channel: "instagram"|"facebook"|"tiktok"|"youtube"|"linkedin"|"blog"|"podcast"|"emailList"|"referrals"|"other"

══ PÁGINAS (salida yes=convierten / no=no convierten) ══
landingPage — Landing page / captura de leads. Config: { "conversionRate":30, "bounceRate":55 }
salesPage — Página de ventas (SOLO FILTRO, sin revenue). Config: { "conversionRate":3 } — NO tiene precio. SIEMPRE debe ir seguida de checkout.
applicationPage — Formulario de aplicación. Config: { "completionRate":25, "qualificationRate":40, "formFields":5 }
tripwire — Oferta de entrada low-ticket ($7-$27). Config: { "price":7, "conversionRate":15, "processorFee":3.5 }
pricingPage — Tabla de precios SaaS. Config: { "conversionRate":5, "popularPlan":"pro", "annualPct":30, "avgTimeOnPage":120 }
freeTrialSignup — Registro para trial gratuito. Config: { "signupRate":20, "activationRate":40, "trialDays":14 }
thankYouOffer — OTO en página de gracias. Config: { "conversionRate":10, "price":27, "contentEngagementRate":60, "processorFee":3.5 }
catalogStore — Tienda / catálogo de productos. Config: { "avgProductsViewed":3, "addToCartRate":15, "aov":85, "bounceRate":55 }

══ VENTAS (salida yes/no, salvo orderBump) ══
checkout — Proceso de pago. Config: { "price":97, "abandonmentRate":65, "processorFee":3.5 }
upsell — Upsell post-compra. Config: { "price":197, "acceptanceRate":25 }
downsell — Downsell si rechazan el upsell. Config: { "price":47, "acceptanceRate":35 }
orderBump — Bump en el mismo checkout. Salida: única (default). Config: { "price":27, "acceptanceRate":30 }
webinarVsl — Webinar en vivo / VSL / evergreen. Config: { "attendanceRate":35, "watchRate":60, "conversionRate":10, "price":497 }
appointment — Llamada de ventas / cita. Config: { "bookingRate":30, "showRate":70, "closeRate":20, "price":1500 }
outboundCall — Llamadas salientes. Config: { "callsPerDay":20, "contactRate":30, "conversationRate":60, "closeRate":15, "avgTicket":500 }
inboundCall — Llamadas entrantes. Config: { "answeredRate":70, "closeRate":20, "avgTicket":500 }
salesProposal — Propuesta de ventas. Config: { "openRate":70, "acceptanceRate":25, "avgPrice":2000, "avgDaysToClose":10 }
productDemo — Demo del producto. Config: { "showRate":50, "followUpRate":60, "closeRate":15, "avgPrice":500 }
trialToPaid — Conversión de trial a pago. Config: { "conversionRate":30, "price":49, "priceType":"monthly", "avgDaysToConvert":14 }
  priceType: "monthly"|"annual"|"oneTime"
digitalContract — Firma de contrato digital. Config: { "signedRate":70, "contractValue":1000, "avgDaysToSign":3 }
salesNegotiation — Negociación de ventas. Config: { "winRate":40, "avgDiscountPct":10, "salesCycleDays":14 }
eventSales — Ventas en evento presencial. Config: { "attendees":50, "leadsContactedRate":60, "followUpRate":40, "closeRate":15, "avgTicket":500 }
physicalPos — Punto de venta físico. Config: { "walkInsPerMonth":200, "conversionRate":20, "avgTicket":50, "repeatRate":30 }

══ FOLLOW-UP Y NURTURING (salida yes/no) ══
emailSequence — Secuencia de emails automatizada. Config: { "mode":"sequence", "emails":7, "openRate":35, "ctr":3, "conversionRate":5 }
whatsappSms — Mensajes WhatsApp / SMS. Config: { "deliveryRate":85, "responseRate":40, "conversionRate":8 }
retargeting — Retargeting a no-conversores. Config: { "captureRate":50, "cpc":0.40, "conversionRate":5 }
  IMPORTANTE: cpc:0 para retargeting orgánico (email, contenido, DMs). cpc>0 solo con presupuesto real de ads.
cartAbandonmentSeq — Recuperación de carrito abandonado. Config: { "emailCount":3, "openRate":45, "recoveryRate":10, "avgCartValue":85 }
pushNotifications — Push notifications. Config: { "optInRate":45, "deliveryRate":90, "ctr":4, "postClickConversion":8 }
dripCampaign — Drip campaign de nurturing. Config: { "duration":"1month", "emailCount":12, "openRate":22, "ctr":2.5, "sustainedEngagement":40, "eventualConversion":5 }
  duration: "2weeks"|"1month"|"2months"|"3months"|"6months"
multichannelNurturing — Nurturing multicanal. Config: { "activeChannels":["email","whatsapp"], "touchpoints":8, "conversionRate":12, "nurturingDays":30, "monthlyCost":50 }
dynamicRetargeting — Retargeting dinámico con audiencias. Config: { "budget":200, "cpc":0.40, "ctr":2.5, "postClickConversion":5, "attributionWindow":7 }
reEngagement — Campaña de re-engagement a inactivos. Config: { "inactiveReached":1000, "reactivationRate":5, "costPerReactivation":2, "reactivationChannel":"email" }
  reactivationChannel: "email"|"whatsapp"|"sms"|"ads"

══ CONTENIDO Y ENGAGEMENT ══
leadMagnet — Lead magnet (PDF, video, template). Salida: yes/no. Config: { "optInRate":35, "leadQualityScore":6, "magnetType":"pdf" }
  magnetType: "pdf"|"video"|"template"|"checklist"|"minicurso"|"herramienta"|"otro"
blogSeo — Blog / SEO. Salida: única (default). Config: { "monthlyVisits":5000, "avgTimeOnPage":120, "scrollDepth":55, "ctrToCta":3.5 }
videoContent — Contenido en video. Salida: única (default). Config: { "monthlyViews":8000, "watchTimePct":45, "ctrToCta":4, "subscriptionRate":2, "videoPlatform":"youtube" }
  videoPlatform: "youtube"|"vimeo"|"wistia"|"other"
quizInteractive — Quiz interactivo. Salida: yes/no. Config: { "startRate":60, "completionRate":70, "segments":3, "optInAtEnd":45 }
calculatorTool — Calculadora / herramienta interactiva. Salida: única (default). Config: { "monthlyUses":2000, "avgUsageTimeSec":180, "nextStepConversion":12 }
ebookGuide — Ebook / guía descargable. Salida: única (default). Config: { "avgPagesPct":35, "ctrToOffer":5 }
resourceTemplate — Plantilla / recurso descargable. Salida: única (default). Config: { "downloadRate":40, "actualUseRate":30, "postUseConversion":8 }
webinarReplay — Replay de webinar. Salida: yes/no. Config: { "viewsPct":25, "watchTimePct":40, "ctrToOffer":6, "conversionRate":4 }
caseStudy — Caso de estudio. Salida: única (default). Config: { "avgReadTimeSec":180, "ctrToCta":8 }
educationalCarousel — Carrusel educativo (RRSS). Salida: única (default). Config: { "avgSwipes":6, "saveRate":5, "shareRate":2, "ctrToLink":1.5 }

══ AGENTES IA ══
aiAgent — Agente IA unificado (canal configurable). Salida: yes/no. Config: { "channel":"whatsapp", "volumePerMonth":500, "autoResponseRate":85, "conversionRate":12, "humanHandoffRate":15, "costPerUnit":0.05, "avgCallDurationSec":120, "bookingRate":20, "csatScore":4.2 }
  channel: "whatsapp"|"webchat"|"voice"|"instagram"|"facebook"|"email"
chatbotRules — Chatbot basado en reglas. Salida: yes/no. Config: { "interactionsPerMonth":1500, "flowCompletionRate":55, "fallbackRate":20, "leadsCapturedRate":25 }
automationWorkflow — Automatización de procesos. Salida: única (default). Config: { "executionsPerMonth":5000, "successRate":95, "timeSavedHrsPerMonth":40, "operatingCostPerMonth":30 }
aiLeadScoring — Lead scoring con IA. Salida: única (default). Config: { "scoringPrecision":75, "mqlRate":30, "avgResponseTimeMin":5 }
aiContentPersonalization — Personalización de contenido IA. Salida: única (default). Config: { "variantsGenerated":5, "ctrLift":25, "conversionLift":15 }
aiSegmentation — Segmentación automática IA. Salida: única (default). Config: { "segmentsCreated":5, "segmentationPrecision":80 }

══ POST-VENTA Y RETENCIÓN ══
onboardingSeq — Secuencia de onboarding. Salida: yes/no. Config: { "completionRate":60, "timeToValueDays":7, "activationRate":45, "onboardingSteps":5 }
reviewRequest — Solicitud de reseña. Salida: única (default). Config: { "responseRate":15, "avgRating":4.5, "platform":"google" }
  platform: "google"|"trustpilot"|"facebook"|"appstore"|"other"
referralProgram — Programa de referidos. Salida: única (default). Config: { "invitationsPerCustomer":3, "referralConversionRate":15, "cacReduction":30, "rewardCost":10 }
renewalUpsell — Renovación / upsell retención. Salida: yes/no. Config: { "churnRate":5, "upgradeRate":8, "renewalPrice":29, "upgradePrice":79, "ltvIncrease":35 }
postSaleSupport — Soporte post-venta. Salida: única (default). Config: { "ticketsPerMonth":50, "resolutionRate":85, "csatScore":7.5, "repurchaseImpact":15 }
customerCommunity — Comunidad de clientes. Salida: única (default). Config: { "activeMembersRate":30, "monthlyEngagement":15, "retentionLift":20, "communityReferrals":5 }
crossSell — Cross-sell post-compra. Salida: yes/no. Config: { "acceptanceRate":12, "price":45 }
winBack — Campaña win-back de clientes perdidos. Salida: yes/no. Config: { "reactivationRate":8, "reactivationCost":15, "restoredLtv":150 }
loyaltyProgram — Programa de lealtad/puntos. Salida: única (default). Config: { "participationRate":40, "redemptionRate":25, "purchaseFrequencyLift":18, "programCostPerCustomer":5 }
npsSurvey — Encuesta NPS. Salida: única (default). Config: { "responseRate":25, "npsScore":45, "detractorsRate":15, "detractorActionRate":50 }

══ UTILIDADES ══
result — Nodo terminal. SIEMPRE el último nodo. Sin output. Sin config.
delayWait — Espera / demora en el flujo. Salida: única (default). Config: { "days":3, "dropOffRate":5, "unit":"days" }
  unit: "hours"|"days"|"weeks"
split — División de tráfico en ramas. Salida: branch-0, branch-1, branch-2, branch-3.
  Config: { "branches":[{"id":"branch-0","label":"Variante A","percentage":50},{"id":"branch-1","label":"Variante B","percentage":50}] }
abSplitTest — Test A/B entre dos variantes. Salida: branch-0, branch-1.
  Config: { "branches":[{"id":"branch-0","label":"Variante A","percentage":50},{"id":"branch-1","label":"Variante B","percentage":50}] }
conditionalBranch — Rama condicional por criterio. Salida: yes/no. Config: { "branchCondition":"El usuario compró", "yesPercent":40 }
mergeNode — Convergencia de múltiples ramas. Salida: única (default). Sin config.
kpiCheckpoint — Checkpoint de KPI. Salida: única (default). Config: { "kpiName":"CPA", "kpiAlertThreshold":15, "kpiAlertType":"above" }
milestoneNode — Hito del funnel. Salida: única (default). Config: { "milestoneStage":"purchase", "milestoneDescription":"Primera venta" }
  milestoneStage: "awareness"|"interest"|"consideration"|"decision"|"purchase"|"retention"|"referral"
fixedCostNode — Costo fijo mensual. Salida: única (default). Config: { "costConcept":"Hosting", "monthlyCost":100, "isRecurring":true }
recurringRevenueNode — Ingresos recurrentes MRR. Salida: única (default). Config: { "mrr":29, "churnRate":5, "months":12, "growthRate":3 }
loopRecurrence — Loop / ciclo recurrente. Salida: única (default). Config: { "iterations":12, "loopFrequency":"monthly", "retentionPerCycle":90 }
  loopFrequency: "daily"|"weekly"|"monthly"|"annual"
stickyNote — Nota de texto. Sin output de simulación. Config: { "text":"Nota aquí", "color":"#ffd700" }
groupContainer — Contenedor visual para agrupar nodos. Sin output de simulación. Sin config.

══ TRACKING (solo informativos — no afectan el flujo de conversión) ══
Usá estos nodos ÚNICAMENTE si el usuario pide tracking explícitamente:
metaPixel, googleTagManager, googleAnalytics, utmTracking, serverPostback, crmAttribution, heatmaps, callTracking, conversionApi, metaOfflineData
Todos tienen salida única (default). No los incluyas en funnels básicos.

══════════════════════════════════════════════════════════
REGLA: NODOS DE NURTURING EN EL PIPELINE — CUÁNDO Y DESDE DÓNDE
══════════════════════════════════════════════════════════

emailSequence, whatsappSms, dripCampaign y multichannelNurturing son pasos del pipeline
SOLO cuando representan nurturing real (secuencia de días/semanas que mueve leads hacia la compra).
NUNCA los uses como emails transaccionales, de confirmación o de bienvenida — eso existe en el
ESP/CRM fuera del simulador.

REGLA GENERAL para todos los nodos de nurturing:
  → Desde "no": SIEMPRE válido. Son recuperación de quien no convirtió.
  → Desde "yes": SOLO si es una secuencia de nurturing genuina (lead magnet, mini-curso, etc.)
                 donde el email es el mecanismo que lleva al lead a comprar durante días/semanas.

CASOS CORRECTOS:
  ✅ landingPage(yes) → salesPage
     (el opt-in va directo al salesPage; el email de bienvenida existe fuera del funnel)
  ✅ landingPage(no) → emailSequence → salesPage
     (nurturing de quienes NO convirtieron en el landing — re-engagement)
  ✅ landingPage(yes) → emailSequence → salesPage
     (SOLO si es un funnel de lead magnet donde los emails son el mecanismo de conversión:
      ej. "descargá el PDF → secuencia de 7 emails en 14 días → página de ventas")
  ✅ salesPage(no) → emailSequence → salesPage   (re-engagement de quien salió sin comprar)
  ✅ webinarVsl(no) → emailSequence → checkout    (seguimiento post-webinar a no-compradores)
  ✅ checkout(no) → cartAbandonmentSeq → checkout (recuperación de carrito abandonado)

CASOS INCORRECTOS:
  ❌ landingPage(yes) → emailSequence → salesPage  (si el email es solo "gracias por suscribirte")
  ❌ checkout(yes) → emailSequence                 (los que pagaron van al upsell/result, no a email)
  ❌ salesPage(yes) → emailSequence                (los que hicieron clic van al checkout, no a email)
  ❌ cualquier_nodo(yes) → retargeting             (retargeting es SIEMPRE desde "no")
  ❌ checkout(yes) → cartAbandonmentSeq            (abandono es SIEMPRE desde "no")
  ❌ upsell(yes) → downsell                        (downsell es SIEMPRE desde el rechazo "no")

NODOS QUE SIEMPRE RECIBEN DESDE "no" (recuperación):
  retargeting, dynamicRetargeting, cartAbandonmentSeq, reEngagement, winBack, downsell

NODOS QUE SIEMPRE RECIBEN DESDE "yes" (post-conversión):
  upsell, orderBump, onboardingSeq, reviewRequest, referralProgram,
  loyaltyProgram, npsSurvey, postSaleSupport, customerCommunity, crossSell, renewalUpsell

══ PATRONES TÍPICOS DE FUNNELS (conexiones verificadas — copiá estos path_type exactos) ══

Infoproducto / curso — bridge page (LA GENTE CONVIERTE EN LANDING Y VA AL SALES PAGE):
nodes: [trafficEntry(0), landingPage(1), salesPage(2), checkout(3), upsell(4), downsell(5), emailSequence(6), retargeting(7), cartAbandonmentSeq(8), result(9)]
connections:
  0→1(default)   — tráfico entra al landing
  1→2(yes)       — CONVIRTIERON en landing → van al sales page
  1→6(no)        — NO convirtieron → nurturing por email
  1→7(no)        — NO convirtieron → retargeting (segunda chance)
  6→2(yes)       — email sequence: los que hicieron clic → van al sales page
  2→3(yes)       — interesados del sales page → checkout
  3→4(yes)       — PAGARON → upsell
  3→8(no)        — NO pagaron → recuperación de carrito
  8→3(yes)       — carrito recuperado → vuelven al checkout
  4→9(yes)       — aceptaron upsell → result
  4→5(no)        — rechazaron upsell → downsell
  5→9(yes)       — aceptaron downsell → result
  5→9(no)        — rechazaron downsell → result igual

Infoproducto / curso — opt-in (LANDING CAPTURA EL EMAIL, LA SECUENCIA NUTRE EL LEAD):
nodes: [trafficEntry(0), landingPage(1), emailSequence(2), salesPage(3), checkout(4), upsell(5), result(6)]
connections:
  0→1(default)   — tráfico entra al landing
  1→2(yes)       — DIERON SU EMAIL → entran a la secuencia de nurturing
  1→retargeting(no) — NO optaron → retargeting
  2→3(yes)       — hicieron clic en el email → van al sales page
  3→4(yes)       — hicieron clic en comprar → checkout
  4→5(yes)       — PAGARON → upsell
  4→cartAbandonmentSeq(no) — NO pagaron → recuperación
  5→6(yes)       — aceptaron upsell → result
  5→6(no)        — rechazaron → result igual

High-ticket / consultoría:
nodes: [trafficEntry(0), landingPage(1), applicationPage(2), appointment(3), salesProposal(4), result(5)]
connections:
  0→1(default), 1→2(yes), 2→3(yes), 3→4(yes), 4→5(yes)
  3→emailSequence(no)        — no se presentaron → seguimiento
  4→salesNegotiation(no)→5(yes) — negociación si no aceptaron

SaaS / software:
nodes: [trafficEntry(0), landingPage(1), freeTrialSignup(2), onboardingSeq(3), trialToPaid(4), recurringRevenueNode(5), result(6)]
connections:
  0→1(default), 1→2(yes), 2→3(yes), 3→4(yes), 4→5(yes), 5→6(default)
  1→retargeting(no)             — no se registraron → retargeting
  4→emailSequence(no)→4(yes)    — no convirtieron → secuencia de upgrade

E-commerce:
nodes: [trafficEntry(0), salesPage(1), checkout(2), orderBump(3), cartAbandonmentSeq(4), result(5)]
connections:
  0→1(default)   — tráfico al sales page
  1→2(yes)       — hicieron clic en comprar → checkout
  1→retargeting(no) — salieron sin comprar → retargeting
  2→3(yes)       — PAGARON → order bump en checkout
  2→4(no)        — NO pagaron → recuperación de carrito abandonado
  3→5(default)   — order bump mostrado → result
  4→2(yes)       — carrito recuperado → vuelven al checkout

Webinar / lanzamiento:
nodes: [trafficEntry(0), landingPage(1), webinarVsl(2), checkout(3), upsell(4), result(5)]
connections:
  0→1(default), 1→2(yes), 2→3(yes)
  1→retargeting(no)         — no se registraron al webinar → retargeting
  2→emailSequence(no)→3(yes) — no convirtieron en el webinar → emails de cierre
  3→4(yes)                  — PAGARON → upsell
  3→cartAbandonmentSeq(no)  — NO pagaron → recuperación
  4→5(yes), 4→5(no)         — con o sin upsell → result

RECUERDA: En el JSON siempre incluí "connections" (no "edges"), con from_index y to_index según la posición en el array nodes.`

// ── Extrae métricas clave de un nodo (reduce tokens de contexto) ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractKeyMetrics(node: { type: string; config: Record<string, any> }) {
  const c = node.config ?? {}
  switch (node.type) {
    case 'trafficEntry':
      // Config real: { totalVisitors, totalBudget, sources: [{name, visitors, type}] }
      return {
        visitantes: c.totalVisitors,
        budget: c.totalBudget > 0 ? `$${c.totalBudget}` : 'orgánico',
        fuentes: Array.isArray(c.sources) && c.sources.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? c.sources.map((s: any) => `${s.name}: ${s.visitors} vis.`).join(' | ')
          : 'sin fuentes',
      }
    case 'trafficSource': case 'paidTraffic':
      // Config real: { platform, budget, cpc, ctr, monthlyVisitors }
      return { visitantes: c.monthlyVisitors, budget: c.budget ? `$${c.budget}` : undefined, cpc: c.cpc ? `$${c.cpc}` : undefined, plataforma: c.platform }
    case 'organicTraffic':
      // Config real: { channel, reach, engagementRate, ctr }
      return { visitantes: c.monthlyVisitors ?? Math.round((c.reach ?? 0) * (c.ctr ?? 0) / 100), canal: c.channel, reach: c.reach }
    case 'landingPage':
      return { conversión: `${c.conversionRate ?? c.conversion_rate}%` }
    case 'salesPage':
      return { conversión: `${c.conversionRate ?? c.conversion_rate}%` }
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
    nodos: (ctx.nodes ?? []).map((n: { type: string; label: string; config: Record<string, unknown>; simResult?: Record<string, number> }) => ({
      tipo: n.type,
      nombre: n.label,
      metricas: extractKeyMetrics(n),
      sim: n.simResult ? {
        entran: n.simResult.entran,
        convierten: n.simResult.convierten,
        noConvierten: n.simResult.noConvierten,
        revenue: n.simResult.revenue > 0 ? `$${n.simResult.revenue.toFixed(0)}` : undefined,
        tasa: `${(n.simResult.tasaConversion ?? 0).toFixed(1)}%`,
      } : undefined,
    })),
    flujo: (ctx.edges ?? []).map((e: { sourceLabel: string; targetLabel: string; pathType: string }) =>
      `${e.sourceLabel} → ${e.targetLabel}${e.pathType !== 'default' ? ` (${e.pathType})` : ''}`
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
    // analyze y suggestions analizan el estado ACTUAL del funnel — el historial
    // anterior contamina el análisis con conclusiones sobre versiones viejas.
    const skipHistory = ['analyze', 'suggestions'].includes(actionType)

    let lastSummaryCreatedAt: string | null = null
    let summaryText: string | null = null

    if (projectId && !skipHistory) {
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
    if (projectId && !skipHistory) {
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
      messages.push({ role: 'user', content: `[Contexto actual del funnel — analizá ESTOS datos, ignorá versiones anteriores: ${serializeFunnelContext(funnelContext)}]` })
      messages.push({ role: 'assistant', content: 'Entendido, analizo el estado actual del funnel.' })
    }

    for (const m of recentMessages) {
      messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
    }

    // ── Detección de generación de funnel — inyectar instrucción de formato ──
    // Si el usuario pide generar un funnel, forzar al modelo a responder con JSON
    // Se modifica solo el mensaje que ve la IA; la DB guarda el mensaje original.
    const isFunnelGenRequest =
      actionType === 'generate_funnel' ||
      /genera[rá]?\s+(un\s+)?funnel|crea[rá]?\s+(un\s+)?funnel|arm[aá]\s+(un\s+)?funnel|hac[eé]me\s+(un\s+)?funnel|generame\s+(un\s+)?funnel|creame\s+(un\s+)?funnel/i.test(message)

    const aiMessage = isFunnelGenRequest
      ? `${message}\n\n⚠️ FORMATO OBLIGATORIO: Respondé con el JSON completo del funnel dentro de un bloque \`\`\`json ... \`\`\`. Podés incluir análisis ANTES del bloque JSON, pero el JSON SIEMPRE debe estar presente con "funnel_name", "nodes" y "connections". Sin el JSON el sistema no puede crear el funnel.`
      : message

    messages.push({ role: 'user', content: aiMessage })

    // ── 4. Llamar a Anthropic directamente ───────────────────────────────────
    // El system prompt se cachea con cache_control ephemeral → ~90% ahorro en tokens de sistema
    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: isFunnelGenRequest ? 3500 : 1500,
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
