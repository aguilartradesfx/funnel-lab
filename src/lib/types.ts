import type { Node, Edge } from '@xyflow/react'

// ─── Tipos de nodo ───────────────────────────────────────────────────────────

export type FunnelNodeType =
  | 'trafficSource'
  | 'landingPage'
  | 'salesPage'
  | 'checkout'
  | 'upsell'
  | 'downsell'
  | 'orderBump'
  | 'emailSequence'
  | 'whatsappSms'
  | 'webinarVsl'
  | 'retargeting'
  | 'appointment'
  | 'split'
  | 'result'
  // ─── New traffic sources ───
  | 'reels'
  | 'organicPost'
  | 'podcast'
  | 'influencer'
  | 'community'
  | 'pr'
  | 'marketplace'
  | 'qrOffline'
  | 'linkedinAds'
  | 'twitterAds'
  | 'pinterestAds'
  | 'youtubeAds'
  // ─── Content & Engagement ───
  | 'blogSeo'
  | 'videoContent'
  | 'leadMagnet'
  | 'quizInteractive'
  | 'calculatorTool'
  | 'educationalCarousel'
  | 'ebookGuide'
  | 'resourceTemplate'
  | 'webinarReplay'
  | 'caseStudy'
  // ─── AI Agents ───
  | 'aiAgent'
  | 'aiWhatsapp'
  | 'aiWebChat'
  | 'aiVoice'
  | 'aiInstagramDm'
  | 'aiEmail'
  | 'chatbotRules'
  | 'automationWorkflow'
  | 'aiLeadScoring'
  | 'aiContentPersonalization'
  | 'aiSegmentation'
  // ─── Tracking ───
  | 'metaPixel'
  | 'googleTagManager'
  | 'googleAnalytics'
  | 'metaOfflineData'
  | 'utmTracking'
  | 'serverPostback'
  | 'crmAttribution'
  | 'heatmaps'
  | 'callTracking'
  | 'conversionApi'
  // ─── New pages ───
  | 'applicationPage'
  | 'tripwire'
  | 'catalogStore'
  | 'pricingPage'
  | 'freeTrialSignup'
  | 'thankYouOffer'
  // ─── Follow-up ───
  | 'pushNotifications'
  | 'dynamicRetargeting'
  | 'multichannelNurturing'
  | 'cartAbandonmentSeq'
  | 'reEngagement'
  | 'dripCampaign'
  // ─── Sales ───
  | 'outboundCall'
  | 'inboundCall'
  | 'salesProposal'
  | 'productDemo'
  | 'trialToPaid'
  | 'physicalPos'
  | 'digitalContract'
  | 'salesNegotiation'
  | 'eventSales'
  // ─── Post-sale ───
  | 'onboardingSeq'
  | 'reviewRequest'
  | 'referralProgram'
  | 'renewalUpsell'
  | 'postSaleSupport'
  | 'customerCommunity'
  | 'crossSell'
  | 'winBack'
  | 'loyaltyProgram'
  | 'npsSurvey'
  // ─── Utilities ───
  | 'delayWait'
  | 'conditionalBranch'
  | 'mergeNode'
  | 'stickyNote'
  | 'kpiCheckpoint'
  | 'abSplitTest'
  | 'loopRecurrence'
  | 'groupContainer'
  | 'milestoneNode'
  | 'fixedCostNode'
  | 'recurringRevenueNode'
  // ─── Nuevas fuentes de tráfico especializadas ───
  | 'paidTraffic'
  | 'organicTraffic'
  | 'trafficEntry'

// ─── Tipos de path para conexiones ──────────────────────────────────────────

export type PathType = 'yes' | 'no' | 'default' | 'rejection' | 'branch-0' | 'branch-1' | 'branch-2' | 'branch-3'

// ─── Producto global ─────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  price: number
  description?: string
}

// ─── Configs por tipo de nodo ────────────────────────────────────────────────

export interface TrafficSourceConfig {
  platform: 'facebook' | 'google' | 'tiktok' | 'organic' | 'email' | 'whatsapp' | 'sms' | 'referral' | 'other'
  costModel: 'cpc' | 'cpm' | 'organic'
  budget: number
  cpc: number
  cpm: number
  ctr: number         // %
  monthlyVisitors: number // para tráfico orgánico
}

export interface LandingPageConfig {
  conversionRate: number  // %
  bounceRate: number      // % (informativo)
}

export interface SalesPageConfig {
  conversionRate: number  // %
  price: number
  productId?: string
  useManualPrice?: boolean
}

export interface CheckoutConfig {
  price: number
  abandonmentRate: number  // %
  processorFee: number     // %
  productId?: string
  useManualPrice?: boolean
}

export interface UpsellConfig {
  price: number
  acceptanceRate: number  // %
  productId?: string
  useManualPrice?: boolean
}

export interface DownsellConfig {
  price: number
  acceptanceRate: number  // %
  productId?: string
  useManualPrice?: boolean
}

export interface OrderBumpConfig {
  price: number
  acceptanceRate: number  // %
  productId?: string
  useManualPrice?: boolean
}

export interface EmailSequenceConfig {
  mode: 'sequence' | 'single'  // sequence = múltiples emails como bloque; single = un email individual
  subject?: string              // solo para modo single (nombre/asunto del email)
  emails: number                // solo para modo sequence
  openRate: number        // %
  ctr: number             // %
  conversionRate: number  // %
}

export interface WhatsAppSmsConfig {
  deliveryRate: number    // %
  responseRate: number    // %
  conversionRate: number  // %
}

export interface WebinarVslConfig {
  attendanceRate: number  // %
  watchRate: number       // %
  conversionRate: number  // %
  price: number
  productId?: string
  useManualPrice?: boolean
}

export interface RetargetingConfig {
  captureRate: number     // % de no-conversores alcanzados
  cpc: number
  conversionRate: number  // %
}

export interface AppointmentConfig {
  bookingRate: number  // %
  showRate: number     // %
  closeRate: number    // %
  price: number
  productId?: string
  useManualPrice?: boolean
}

// ─── Páginas de conversión ───────────────────────────────────────────────────

export interface ApplicationPageConfig {
  completionRate: number       // % que completa el formulario
  qualificationRate: number    // % de completados que califica
  formFields: number           // cantidad de campos del formulario
}

export interface TripwireConfig {
  price: number
  conversionRate: number       // %
  processorFee: number         // %
  productId?: string
  useManualPrice?: boolean
}

export interface CatalogStoreConfig {
  avgProductsViewed: number    // productos vistos promedio
  addToCartRate: number        // %
  aov: number                  // average order value $
  bounceRate: number           // %
}

export interface PricingPageConfig {
  conversionRate: number       // % total
  popularPlan: 'basic' | 'pro' | 'premium' | 'enterprise'
  annualPct: number            // % que elige anual
  avgTimeOnPage: number        // segundos
}

export interface FreeTrialSignupConfig {
  signupRate: number           // %
  activationRate: number       // %
  trialDays: number
}

export interface ThankYouOfferConfig {
  conversionRate: number       // %
  price: number
  contentEngagementRate: number // %
  processorFee: number         // %
  productId?: string
  useManualPrice?: boolean
}

// ─── Ventas y cierre ─────────────────────────────────────────────────────────

export interface OutboundCallConfig {
  callsPerDay: number
  contactRate: number          // %
  conversationRate: number     // %
  closeRate: number            // %
  avgTicket: number
}

export interface InboundCallConfig {
  answeredRate: number         // %
  closeRate: number            // %
  avgTicket: number
}

export interface SalesProposalConfig {
  openRate: number             // % que abre la propuesta
  acceptanceRate: number       // %
  avgPrice: number
  avgDaysToClose: number
}

export interface ProductDemoConfig {
  showRate: number             // %
  followUpRate: number         // %
  closeRate: number            // % (usado si no hay checkout downstream)
  avgPrice: number
}

export interface TrialToPaidConfig {
  conversionRate: number       // %
  price: number
  priceType: 'monthly' | 'annual' | 'oneTime'
  avgDaysToConvert: number
}

export interface PhysicalPosConfig {
  walkInsPerMonth: number
  conversionRate: number       // %
  avgTicket: number
  repeatRate: number           // %
}

export interface DigitalContractConfig {
  signedRate: number           // %
  contractValue: number
  avgDaysToSign: number
}

export interface SalesNegotiationConfig {
  winRate: number              // %
  avgDiscountPct: number       // % descuento promedio negociado
  salesCycleDays: number
}

export interface EventSalesConfig {
  attendees: number
  leadsContactedRate: number   // %
  followUpRate: number         // %
  closeRate: number            // %
  avgTicket: number
}

// ─── Follow-up y nurturing ───────────────────────────────────────────────────

export interface PushNotificationsConfig {
  optInRate: number            // % default 45
  deliveryRate: number         // % default 90
  ctr: number                  // % default 4
  postClickConversion: number  // % default 8
}

export interface DynamicRetargetingConfig {
  budget: number               // $ default 200
  cpc: number                  // $ default 0.40
  ctr: number                  // % default 2.5
  postClickConversion: number  // % default 5
  attributionWindow: number    // días: 1|7|14|28 default 7
}

export interface MultichannelNurturingConfig {
  activeChannels: string[]     // default ['email', 'whatsapp']
  touchpoints: number          // default 8
  conversionRate: number       // % default 12
  nurturingDays: number        // default 30
  monthlyCost: number          // $ default 50
}

export interface CartAbandonmentSeqConfig {
  emailCount: number           // default 3
  openRate: number             // % default 45
  recoveryRate: number         // % default 10
  avgCartValue: number         // $ default 85
}

export interface ReEngagementConfig {
  inactiveReached: number      // default 1000
  reactivationRate: number     // % default 5
  costPerReactivation: number  // $ default 2
  reactivationChannel: 'email' | 'whatsapp' | 'sms' | 'ads'
}

export interface DripCampaignConfig {
  duration: '2weeks' | '1month' | '2months' | '3months' | '6months'
  emailCount: number           // default 12
  openRate: number             // % default 22
  ctr: number                  // % default 2.5
  sustainedEngagement: number  // % default 40
  eventualConversion: number   // % default 5
}

// ─── Post-venta y retención ──────────────────────────────────────────────────

export interface OnboardingSeqConfig {
  completionRate: number       // % default 60
  timeToValueDays: number      // default 7
  activationRate: number       // % default 45
  onboardingSteps: number      // default 5
}

export interface ReviewRequestConfig {
  responseRate: number         // % default 15
  avgRating: number            // 1-5 default 4.5
  platform: 'google' | 'trustpilot' | 'facebook' | 'appstore' | 'other'
}

export interface ReferralProgramConfig {
  invitationsPerCustomer: number   // default 3
  referralConversionRate: number   // % default 15
  cacReduction: number             // % default 30
  rewardCost: number               // $ default 10
}

export interface RenewalUpsellConfig {
  churnRate: number            // % default 5
  upgradeRate: number          // % default 8
  renewalPrice: number         // $ default 29
  upgradePrice: number         // $ default 79
  ltvIncrease: number          // % default 35
}

export interface PostSaleSupportConfig {
  ticketsPerMonth: number      // default 50
  resolutionRate: number       // % default 85
  csatScore: number            // 1-10 default 7.5
  repurchaseImpact: number     // % default 15
}

export interface CustomerCommunityConfig {
  activeMembersRate: number    // % default 30
  monthlyEngagement: number    // % default 15
  retentionLift: number        // % default 20
  communityReferrals: number   // % default 5
}

export interface CrossSellConfig {
  acceptanceRate: number       // % default 12
  price: number                // $ default 45
  productId?: string
  useManualPrice?: boolean
}

export interface WinBackConfig {
  reactivationRate: number     // % default 8
  reactivationCost: number     // $ default 15
  restoredLtv: number          // $ default 150
}

export interface LoyaltyProgramConfig {
  participationRate: number        // % default 40
  redemptionRate: number           // % default 25
  purchaseFrequencyLift: number    // % default 18
  programCostPerCustomer: number   // $ default 5
}

export interface NpsSurveyConfig {
  responseRate: number         // % default 25
  npsScore: number             // -100 a 100 default 45
  detractorsRate: number       // % default 15
  detractorActionRate: number  // % default 50
}

export interface SplitConfig {
  branches: Array<{
    id: string
    label: string
    percentage: number
  }>
}

export interface ResultConfig {
  label?: string
}

// ─── Traffic Entry — contenedor de fuentes de tráfico ───────────────────────

export interface TrafficEntrySource {
  id: string
  name: string              // "Facebook Q1", "IG Reels", etc.
  source: string            // 'facebook_ads' | 'instagram' | 'blog_seo' | etc.
  type: 'paid' | 'organic'
  // Campos pagados
  budget?: number
  costModel?: 'cpc' | 'cpm' | 'cpv'
  cpc?: number
  cpm?: number
  cpv?: number
  ctr?: number
  // Campos orgánicos estándar
  reach?: number
  engagementRate?: number
  // Email list
  listSize?: number
  openRate?: number
  // Referidos / afiliados
  activeReferrers?: number
  referralsPerReferrer?: number
  referralConversionRate?: number
  // Visitantes calculados (puede editarse manualmente)
  visitors: number
}

export interface TrafficEntryConfig {
  name: string
  sources: TrafficEntrySource[]
  totalVisitors: number
  totalPaidVisitors: number
  totalOrganicVisitors: number
  totalBudget: number
}

// ─── New config interfaces ───────────────────────────────────────────────────

// Tráfico Pagado — nueva fuente especializada
export type PaidTrafficPlatform =
  | 'meta' | 'googleSearch' | 'googleDisplay' | 'youtube'
  | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'other'

export interface PaidTrafficConfig {
  platform: PaidTrafficPlatform
  platformLabel?: string          // solo cuando platform === 'other'
  costModel: 'cpc' | 'cpm' | 'cpv'
  budget: number                  // presupuesto mensual $
  cpc: number                     // costo por clic
  cpm: number                     // costo por mil impresiones
  cpv: number                     // costo por vista (YouTube)
  ctr: number                     // CTR % (para CPM y CPV)
}

// Tráfico Orgánico — nueva fuente especializada
export type OrganicTrafficChannel =
  | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
  | 'blog' | 'podcast' | 'pinterest' | 'emailList' | 'whatsapp'
  | 'community' | 'referrals' | 'other'

export interface OrganicChannelConfig {
  channel: OrganicTrafficChannel
  channelLabel?: string           // solo cuando channel === 'other'
  // Campos estándar (mayoría de canales)
  reach: number                   // alcance mensual (impresiones / views)
  engagementRate: number          // % engagement
  ctr: number                     // % CTR a link/perfil
  // Campos específicos para email list
  listSize: number
  openRate: number                // %
  // Campos específicos para referidos
  activeReferrers: number
  referralsPerReferrer: number
  referralConversionRate: number  // %
}

// Generic conversion node (used by most new nodes)
export interface GenericConversionConfig {
  conversionRate: number  // %
  revenue?: number        // price per converted visitor
  cost?: number           // fixed cost
}

// Organic traffic source (reels, posts, podcast, etc.)
export interface OrganicTrafficConfig {
  platform: string
  reach: number           // monthly reach/audience
  engagementRate: number  // %
  ctr: number             // CTR to next step %
}

// Paid social (LinkedIn, Twitter, Pinterest, YouTube ads)
export interface PaidSocialConfig {
  budget: number
  cpm: number
  ctr: number             // %
  platform: string
}

// AI Agent
export interface AIAgentConfig {
  sessionsPerMonth: number
  resolutionRate: number    // %
  conversionRate: number    // %
  costPerSession: number
}

// Tracking node (badge-like, no conversion)
export interface TrackingNodeConfig {
  platform: string
  matchRate?: number
}

// Delay/Wait utility
export interface DelayConfig {
  days: number
  dropOffRate: number     // % who disengage during wait
  unit?: 'hours' | 'days' | 'weeks'  // display unit for duration
}

// Note (no simulation)
export interface NoteConfig {
  title?: string
  text: string
  color?: string   // hex color
  size?: 'small' | 'medium' | 'large'
}

// Recurring revenue
export interface RecurringRevenueConfig {
  mrr: number
  churnRate: number       // % monthly
  months: number
  growthRate?: number     // % monthly growth, default 3
}

// ─── Contenido y engagement ──────────────────────────────────────────────────

export interface BlogSeoConfig {
  monthlyVisits: number        // default 5000
  avgTimeOnPage: number        // seconds, default 120
  scrollDepth: number          // %, default 55
  ctrToCta: number             // %, default 3.5
}

export interface VideoContentConfig {
  monthlyViews: number         // default 8000
  watchTimePct: number         // %, default 45
  ctrToCta: number             // %, default 4
  subscriptionRate: number     // %, default 2
  videoPlatform: 'youtube' | 'vimeo' | 'wistia' | 'other'
}

export interface LeadMagnetConfig {
  optInRate: number            // %, default 35
  leadQualityScore: number     // 1-10, default 6
  magnetType: 'pdf' | 'video' | 'template' | 'checklist' | 'minicurso' | 'herramienta' | 'otro'
}

export interface QuizInteractiveConfig {
  startRate: number            // %, default 60
  completionRate: number       // %, default 70
  segments: number             // default 3
  optInAtEnd: number           // %, default 45
}

export interface CalculatorToolConfig {
  monthlyUses: number          // default 2000
  avgUsageTimeSec: number      // seconds, default 180
  nextStepConversion: number   // %, default 12
}

export interface EducationalCarouselConfig {
  avgSwipes: number            // 1-10, default 6
  saveRate: number             // %, default 5
  shareRate: number            // %, default 2
  ctrToLink: number            // %, default 1.5
}

export interface EbookGuideConfig {
  avgPagesPct: number          // %, default 35
  ctrToOffer: number           // %, default 5
}

export interface ResourceTemplateConfig {
  downloadRate: number         // %, default 40
  actualUseRate: number        // %, default 30
  postUseConversion: number    // %, default 8
}

export interface WebinarReplayConfig {
  viewsPct: number             // %, default 25
  watchTimePct: number         // %, default 40
  ctrToOffer: number           // %, default 6
  conversionRate: number       // %, default 4
}

export interface CaseStudyConfig {
  avgReadTimeSec: number       // seconds, default 180
  ctrToCta: number             // %, default 8
}

// ─── Agentes de IA y automatización ──────────────────────────────────────────

export type AiAgentChannel = 'whatsapp' | 'webchat' | 'voice' | 'instagram' | 'facebook' | 'email'

// Nodo unificado "Agente IA" — el canal se elige dentro del panel de config
export interface AiAgentUnifiedConfig {
  channel: AiAgentChannel
  volumePerMonth: number       // mensajes / sesiones / llamadas / DMs / emails
  autoResponseRate: number     // %, resolución automática
  conversionRate: number       // %, leads o ventas generadas
  humanHandoffRate: number     // %, escalación a humano
  costPerUnit: number          // $ por mensaje/sesión/llamada (0 si no aplica)
  // Voice-specific
  avgCallDurationSec: number   // segundos (solo voz)
  bookingRate: number          // % bookings (solo voz)
  // WebChat-specific
  csatScore: number            // 1-5 (solo webchat)
}

export interface AiWhatsappConfig {
  messagesPerMonth: number     // default 500
  autoResponseRate: number     // %, default 85
  humanHandoffRate: number     // %, default 15
  conversionRate: number       // %, default 12
  costPerConversation: number  // $, default 0.05
}

export interface AiWebChatConfig {
  sessionsPerMonth: number     // default 1000
  autoResolutionRate: number   // %, default 70
  humanEscalationRate: number  // %, default 20
  leadsGeneratedRate: number   // %, default 15
  csatScore: number            // 1-5, default 4.2
}

export interface AiVoiceConfig {
  callsAttendedPerMonth: number // default 300
  avgCallDurationSec: number   // seconds, default 120
  resolutionRate: number       // %, default 60
  bookingRate: number          // %, default 20
  costPerCall: number          // $, default 0.15
}

export interface AiInstagramDmConfig {
  dmsProcessedPerMonth: number // default 800
  autoResponseRate: number     // %, default 80
  linkConversionRate: number   // %, default 18
  postResponseEngagement: number // %, default 25
}

export interface AiEmailConfig {
  emailsProcessedPerMonth: number // default 2000
  autoResponseRate: number     // %, default 75
  autoFollowUpRate: number     // %, default 40
  resolutionRate: number       // %, default 55
}

export interface ChatbotRulesConfig {
  interactionsPerMonth: number // default 1500
  flowCompletionRate: number   // %, default 55
  fallbackRate: number         // %, default 20
  leadsCapturedRate: number    // %, default 25
}

export interface AutomationWorkflowConfig {
  executionsPerMonth: number   // default 5000
  successRate: number          // %, default 95
  timeSavedHrsPerMonth: number // hours, default 40
  operatingCostPerMonth: number // $, default 30
}

export interface AiLeadScoringConfig {
  scoringPrecision: number     // %, default 75
  mqlRate: number              // %, default 30
  avgResponseTimeMin: number   // minutes, default 5
}

export interface AiContentPersonalizationConfig {
  variantsGenerated: number    // default 5
  ctrLift: number              // %, default 25
  conversionLift: number       // %, default 15
}

export interface AiSegmentationConfig {
  segmentsCreated: number      // default 5
  segmentationPrecision: number // %, default 80
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export interface MetaPixelConfig {
  trackedEvents: string[]      // multi-select
  matchQualityScore: number    // %, default 85
  capiEnabled: boolean
}

export interface GoogleTagManagerConfig {
  activeTags: number           // default 10
  configuredTriggers: number   // default 15
  gtmPagesCoverage: number     // %, default 90
}

export interface GoogleAnalyticsConfig {
  gaConfiguredEvents: number   // default 20
  gaConversions: number        // default 5
  gaAttributionModel: 'lastClick' | 'firstClick' | 'dataDriven' | 'linear'
}

export interface MetaOfflineDataConfig {
  offlineEventsPerMonth: number // default 500
  offlineMatchRate: number     // %, default 70
  uploadDelayDays: number      // default 3
}

export interface UtmTrackingConfig {
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
}

export interface ServerPostbackConfig {
  connectedPlatforms: string[]
  precisionVsCookie: number    // %, default 95
  postbackConversionsPerMonth: number // default 1000
}

export interface CrmAttributionConfig {
  crmAttributionModel: 'firstTouch' | 'lastTouch' | 'multiTouch' | 'wShaped' | 'uShaped'
  crmAttributedRevenue: number // $, default 10000
}

export interface HeatmapsConfig {
  heatmapTool: 'hotjar' | 'clarity' | 'crazyEgg' | 'other'
  heatmapSessionsPerMonth: number // default 1000
  rageClicksRate: number       // %, default 5
}

export interface CallTrackingConfig {
  trackedCallsPerMonth: number // default 200
  callSourceAttribution: number // %, default 75
  callAvgDurationSec: number   // seconds, default 180
  postCallConversion: number   // %, default 15
}

export interface ConversionApiConfig {
  serverEventsPerMonth: number // default 5000
  pixelRedundancyPct: number   // %, default 20
  deduplicationRate: number    // %, default 95
}

// ─── Utilidades del canvas ────────────────────────────────────────────────────

export interface ConditionalBranchConfig {
  branchCondition: string      // text description
  yesPercent: number           // %, default 40
}

export interface MergeNodeConfig {
  // informative only — no configurable fields
}

export interface KpiCheckpointConfig {
  kpiName: string              // e.g., "CPA"
  kpiAlertThreshold: number    // $, default 15
  kpiAlertType: 'above' | 'below'
}

export interface LoopRecurrenceConfig {
  iterations: number           // default 12
  loopFrequency: 'daily' | 'weekly' | 'monthly' | 'annual'
  retentionPerCycle: number    // %, default 90
}

export interface MilestoneNodeConfig {
  milestoneStage: 'awareness' | 'interest' | 'consideration' | 'decision' | 'purchase' | 'retention' | 'referral'
  milestoneDescription: string
}

export interface FixedCostNodeConfig {
  costConcept: string          // e.g., "Hosting"
  monthlyCost: number          // $, default 100
  isRecurring: boolean         // default true
}

export type NodeConfig =
  | TrafficSourceConfig
  | LandingPageConfig
  | SalesPageConfig
  | CheckoutConfig
  | UpsellConfig
  | DownsellConfig
  | OrderBumpConfig
  | EmailSequenceConfig
  | WhatsAppSmsConfig
  | WebinarVslConfig
  | RetargetingConfig
  | AppointmentConfig
  | SplitConfig
  | ResultConfig
  | GenericConversionConfig
  | OrganicTrafficConfig
  | PaidSocialConfig
  | AIAgentConfig
  | TrackingNodeConfig
  | DelayConfig
  | NoteConfig
  | RecurringRevenueConfig
  | PaidTrafficConfig
  | OrganicChannelConfig
  | TrafficEntryConfig
  | ApplicationPageConfig
  | TripwireConfig
  | CatalogStoreConfig
  | PricingPageConfig
  | FreeTrialSignupConfig
  | ThankYouOfferConfig
  | OutboundCallConfig
  | InboundCallConfig
  | SalesProposalConfig
  | ProductDemoConfig
  | TrialToPaidConfig
  | PhysicalPosConfig
  | DigitalContractConfig
  | SalesNegotiationConfig
  | EventSalesConfig
  | PushNotificationsConfig
  | DynamicRetargetingConfig
  | MultichannelNurturingConfig
  | CartAbandonmentSeqConfig
  | ReEngagementConfig
  | DripCampaignConfig
  | OnboardingSeqConfig
  | ReviewRequestConfig
  | ReferralProgramConfig
  | RenewalUpsellConfig
  | PostSaleSupportConfig
  | CustomerCommunityConfig
  | CrossSellConfig
  | WinBackConfig
  | LoyaltyProgramConfig
  | NpsSurveyConfig
  // ─── Contenido y engagement ───
  | BlogSeoConfig
  | VideoContentConfig
  | LeadMagnetConfig
  | QuizInteractiveConfig
  | CalculatorToolConfig
  | EducationalCarouselConfig
  | EbookGuideConfig
  | ResourceTemplateConfig
  | WebinarReplayConfig
  | CaseStudyConfig
  // ─── Agentes de IA ───
  | AiAgentUnifiedConfig
  | AiWhatsappConfig
  | AiWebChatConfig
  | AiVoiceConfig
  | AiInstagramDmConfig
  | AiEmailConfig
  | ChatbotRulesConfig
  | AutomationWorkflowConfig
  | AiLeadScoringConfig
  | AiContentPersonalizationConfig
  | AiSegmentationConfig
  // ─── Tracking ───
  | MetaPixelConfig
  | GoogleTagManagerConfig
  | GoogleAnalyticsConfig
  | MetaOfflineDataConfig
  | UtmTrackingConfig
  | ServerPostbackConfig
  | CrmAttributionConfig
  | HeatmapsConfig
  | CallTrackingConfig
  | ConversionApiConfig
  // ─── Utilidades ───
  | ConditionalBranchConfig
  | MergeNodeConfig
  | KpiCheckpointConfig
  | LoopRecurrenceConfig
  | MilestoneNodeConfig
  | FixedCostNodeConfig

// ─── Resultados de simulación por nodo ──────────────────────────────────────

export interface NodeSimResult {
  visitorsIn: number
  visitorsConverted: number
  visitorsNotConverted: number
  revenue: number
  cost: number
  leads: number
  conversionRate: number  // calculado
  /** true si el nodo es alcanzable desde una fuente de tráfico a través de aristas conectadas */
  isInChain?: boolean
}

// ─── Resultados globales de simulación ──────────────────────────────────────

export interface GlobalSimResults {
  totalRevenue: number
  totalCost: number
  totalAdSpend: number      // Solo presupuesto de ads (para ROAS)
  netProfit: number
  roas: number              // Return on Ad Spend = revenue / adSpend
  roi: number               // %
  cpa: number               // Costo por Adquisición
  cpl: number               // Costo por Lead
  epc: number               // Earnings per Click
  aov: number               // Average Order Value
  totalVisitors: number
  totalLeads: number
  totalCustomers: number
  breakEvenVisitors: number // visitas necesarias para cubrir costos
  nodeResults: Record<string, NodeSimResult>
}

// ─── Datos del nodo para React Flow ─────────────────────────────────────────

export interface FunnelNodeData extends Record<string, unknown> {
  nodeType: FunnelNodeType
  label: string
  config: NodeConfig
  simResult?: NodeSimResult
}

// ─── Datos del edge para React Flow ─────────────────────────────────────────

export interface FunnelEdgeData extends Record<string, unknown> {
  pathType: PathType
}

// ─── Tipos React Flow tipados ────────────────────────────────────────────────

export type FunnelRFNode = Node<FunnelNodeData, 'funnelNode'>
export type FunnelRFEdge = Edge<FunnelEdgeData, 'funnelEdge'>

// ─── Historia para undo/redo ─────────────────────────────────────────────────

export interface HistorySnapshot {
  nodes: FunnelRFNode[]
  edges: FunnelRFEdge[]
}

// ─── Registro de ejecución de simulación ────────────────────────────────────

export interface SimRun {
  id: string
  timestamp: string       // ISO string
  projectName: string
  nodeCount: number
  results: GlobalSimResults
}

// ─── Proyecto ────────────────────────────────────────────────────────────────

export interface FunnelProject {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  nodes: FunnelRFNode[]
  edges: FunnelRFEdge[]
  products?: Product[]
}

// ─── Blueprint / Template ────────────────────────────────────────────────────

export type BlueprintCategory = 'ecommerce' | 'servicios' | 'infoproductos' | 'saas' | 'local' | 'general' | 'ia' | 'organico'

export interface Blueprint {
  id: string
  title: string
  description: string
  category: BlueprintCategory
  tags: string[]
  idealFor: string
  nodes: FunnelRFNode[]
  edges: FunnelRFEdge[]
}
