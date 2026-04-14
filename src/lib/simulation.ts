import type {
  FunnelRFNode,
  FunnelRFEdge,
  FunnelNodeType,
  NodeSimResult,
  GlobalSimResults,
  TrafficSourceConfig,
  LandingPageConfig,
  SalesPageConfig,
  CheckoutConfig,
  UpsellConfig,
  DownsellConfig,
  OrderBumpConfig,
  EmailSequenceConfig,
  WhatsAppSmsConfig,
  WebinarVslConfig,
  RetargetingConfig,
  AppointmentConfig,
  SplitConfig,
  OrganicTrafficConfig,
  PaidSocialConfig,
  AIAgentConfig,
  GenericConversionConfig,
  DelayConfig,
  RecurringRevenueConfig,
  PaidTrafficConfig,
  OrganicChannelConfig,
  TrafficEntrySource,
  TrafficEntryConfig,
  ApplicationPageConfig,
  TripwireConfig,
  CatalogStoreConfig,
  PricingPageConfig,
  FreeTrialSignupConfig,
  ThankYouOfferConfig,
  OutboundCallConfig,
  InboundCallConfig,
  SalesProposalConfig,
  ProductDemoConfig,
  TrialToPaidConfig,
  PhysicalPosConfig,
  DigitalContractConfig,
  SalesNegotiationConfig,
  EventSalesConfig,
  PushNotificationsConfig,
  DynamicRetargetingConfig,
  MultichannelNurturingConfig,
  CartAbandonmentSeqConfig,
  ReEngagementConfig,
  DripCampaignConfig,
  OnboardingSeqConfig,
  ReviewRequestConfig,
  ReferralProgramConfig,
  RenewalUpsellConfig,
  PostSaleSupportConfig,
  CustomerCommunityConfig,
  CrossSellConfig,
  WinBackConfig,
  LoyaltyProgramConfig,
  NpsSurveyConfig,
  BlogSeoConfig,
  VideoContentConfig,
  LeadMagnetConfig,
  QuizInteractiveConfig,
  CalculatorToolConfig,
  EducationalCarouselConfig,
  EbookGuideConfig,
  ResourceTemplateConfig,
  WebinarReplayConfig,
  CaseStudyConfig,
  AiAgentUnifiedConfig,
  AiWhatsappConfig,
  AiWebChatConfig,
  AiVoiceConfig,
  AiInstagramDmConfig,
  AiEmailConfig,
  ChatbotRulesConfig,
  AutomationWorkflowConfig,
  AiLeadScoringConfig,
  AiContentPersonalizationConfig,
  AiSegmentationConfig,
  ConditionalBranchConfig,
  KpiCheckpointConfig,
  LoopRecurrenceConfig,
  MilestoneNodeConfig,
  FixedCostNodeConfig,
} from './types'

// ─── Utilidades para Traffic Entry (exportadas para uso en la UI) ─────────────

/** Calcula los visitantes de una fuente individual */
export function computeSourceVisitors(source: TrafficEntrySource): number {
  if (source.type === 'paid') {
    const budget = source.budget ?? 0
    const costModel = source.costModel ?? 'cpc'
    if (costModel === 'cpc') {
      return source.cpc && source.cpc > 0 ? Math.floor(budget / source.cpc) : 0
    } else if (costModel === 'cpm') {
      const impressions = source.cpm && source.cpm > 0 ? (budget / source.cpm) * 1000 : 0
      return Math.floor(impressions * ((source.ctr ?? 0) / 100))
    } else if (costModel === 'cpv') {
      const views = source.cpv && source.cpv > 0 ? Math.floor(budget / source.cpv) : 0
      return Math.floor(views * ((source.ctr ?? 0) / 100))
    }
  } else {
    const src = source.source
    if (src === 'email') {
      return Math.floor((source.listSize ?? 0) * ((source.openRate ?? 0) / 100) * ((source.ctr ?? 0) / 100))
    } else if (['referrals', 'affiliates', 'jv_partners'].includes(src)) {
      return Math.floor(
        (source.activeReferrers ?? 0) * (source.referralsPerReferrer ?? 0) * ((source.referralConversionRate ?? 0) / 100)
      )
    } else if (src === 'blog_seo') {
      return source.reach ?? 0
    } else {
      return Math.floor((source.reach ?? 0) * ((source.ctr ?? 0) / 100))
    }
  }
  return 0
}

/** Recalcula los totales del Traffic Entry a partir de sus fuentes */
export function recomputeTrafficEntryTotals(config: TrafficEntryConfig): TrafficEntryConfig {
  const sources = config.sources ?? []
  const paid = sources.filter(s => s.type === 'paid')
  const organic = sources.filter(s => s.type === 'organic')
  const totalPaidVisitors = paid.reduce((sum, s) => sum + (s.visitors ?? 0), 0)
  const totalOrganicVisitors = organic.reduce((sum, s) => sum + (s.visitors ?? 0), 0)
  return {
    ...config,
    totalVisitors: totalPaidVisitors + totalOrganicVisitors,
    totalPaidVisitors,
    totalOrganicVisitors,
    totalBudget: paid.reduce((sum, s) => sum + (s.budget ?? 0), 0),
  }
}

// ─── Cálculo por tipo de nodo ─────────────────────────────────────────────────

function calculateTrafficSource(config: TrafficSourceConfig): NodeSimResult {
  let visitorsOut = 0
  let cost = 0

  if (config.costModel === 'organic') {
    visitorsOut = config.monthlyVisitors
    cost = 0
  } else if (config.costModel === 'cpc') {
    visitorsOut = config.cpc > 0 ? Math.floor(config.budget / config.cpc) : 0
    cost = config.budget
  } else {
    // CPM
    const impressions = config.cpm > 0 ? (config.budget / config.cpm) * 1000 : 0
    visitorsOut = Math.floor(impressions * (config.ctr / 100))
    cost = config.budget
  }

  return {
    visitorsIn: visitorsOut,
    visitorsConverted: visitorsOut,
    visitorsNotConverted: 0,
    revenue: 0,
    cost,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateLandingPage(visitorsIn: number, config: LandingPageConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: config.conversionRate,
  }
}

function calculateSalesPage(visitorsIn: number, config: SalesPageConfig, hasCheckoutDownstream = true): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  // Solo genera revenue en funnel simplificado (sin checkout después)
  const revenue = !hasCheckoutDownstream && config.price > 0 ? converted * config.price : 0
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue,
    cost: 0,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculateCheckout(visitorsIn: number, config: CheckoutConfig): NodeSimResult {
  const completionRate = 1 - config.abandonmentRate / 100
  const converted = Math.floor(visitorsIn * completionRate)
  const notConverted = visitorsIn - converted
  const grossRevenue = converted * config.price
  const fees = grossRevenue * (config.processorFee / 100)
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: grossRevenue,   // Revenue bruto; la comisión va como costo
    cost: fees,
    leads: 0,
    conversionRate: completionRate * 100,
  }
}

function calculateUpsell(visitorsIn: number, config: UpsellConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.acceptanceRate / 100))
  const notConverted = visitorsIn - converted
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: converted * config.price,
    cost: 0,
    leads: 0,
    conversionRate: config.acceptanceRate,
  }
}

function calculateDownsell(visitorsIn: number, config: DownsellConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.acceptanceRate / 100))
  const notConverted = visitorsIn - converted
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: converted * config.price,
    cost: 0,
    leads: 0,
    conversionRate: config.acceptanceRate,
  }
}

function calculateOrderBump(visitorsIn: number, config: OrderBumpConfig): NodeSimResult {
  // Order bump se muestra a todos los que llegan al checkout; el "si" agrega ingreso
  const accepted = Math.floor(visitorsIn * (config.acceptanceRate / 100))
  return {
    visitorsIn,
    visitorsConverted: visitorsIn, // todos pasan, la diferencia es el ingreso adicional
    visitorsNotConverted: 0,
    revenue: accepted * config.price,
    cost: 0,
    leads: 0,
    conversionRate: config.acceptanceRate,
  }
}

function calculateEmailSequence(visitorsIn: number, config: EmailSequenceConfig): NodeSimResult {
  const mode = config.mode ?? 'sequence'

  if (mode === 'single') {
    // Email individual: salida = abrieron el email.
    // CTR y conversión son sub-métricas informativas, no filtros de salida.
    const openers = Math.floor(visitorsIn * (config.openRate / 100))
    return {
      visitorsIn,
      visitorsConverted: openers,
      visitorsNotConverted: visitorsIn - openers,
      revenue: 0,
      cost: 0,
      leads: 0,
      conversionRate: visitorsIn > 0 ? (openers / visitorsIn) * 100 : 0,
    }
  }

  // Secuencia completa: probabilidad acumulada de hacer click en al menos
  // un email durante toda la secuencia.
  // P(click en un email) = openRate × CTR
  // P(no click en ninguno) = (1 − P)^emails
  // P(al menos uno) = 1 − (1 − P)^emails
  const perEmailProb = (config.openRate / 100) * (config.ctr / 100)
  const atLeastOnceProb = 1 - Math.pow(1 - perEmailProb, Math.max(1, config.emails))
  const engaged = Math.floor(visitorsIn * atLeastOnceProb)
  return {
    visitorsIn,
    visitorsConverted: engaged,
    visitorsNotConverted: visitorsIn - engaged,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (engaged / visitorsIn) * 100 : 0,
  }
}

function calculateWhatsAppSms(visitorsIn: number, config: WhatsAppSmsConfig): NodeSimResult {
  const delivered = Math.floor(visitorsIn * (config.deliveryRate / 100))
  const responded = Math.floor(delivered * (config.responseRate / 100))
  const converted = Math.floor(responded * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateWebinarVsl(visitorsIn: number, config: WebinarVslConfig, hasCheckoutDownstream = true): NodeSimResult {
  const attendees = Math.floor(visitorsIn * (config.attendanceRate / 100))
  const watchers = Math.floor(attendees * (config.watchRate / 100))
  const converted = Math.floor(watchers * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  // Solo genera revenue en funnel simplificado (sin checkout después)
  const revenue = !hasCheckoutDownstream && config.price > 0 ? converted * config.price : 0
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateRetargeting(visitorsIn: number, config: RetargetingConfig): NodeSimResult {
  const reached = Math.floor(visitorsIn * (config.captureRate / 100))
  const converted = Math.floor(reached * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  const cost = reached * config.cpc
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: 0,
    cost,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAppointment(visitorsIn: number, config: AppointmentConfig): NodeSimResult {
  const booked = Math.floor(visitorsIn * (config.bookingRate / 100))
  const showed = Math.floor(booked * (config.showRate / 100))
  const closed = Math.floor(showed * (config.closeRate / 100))
  const notConverted = visitorsIn - closed
  return {
    visitorsIn,
    visitorsConverted: closed,
    visitorsNotConverted: notConverted,
    revenue: closed * config.price,
    cost: 0,
    leads: booked,
    conversionRate: visitorsIn > 0 ? (closed / visitorsIn) * 100 : 0,
  }
}

// ─── New calculation functions ───────────────────────────────────────────────

function calculateOrganicTraffic(config: OrganicTrafficConfig): NodeSimResult {
  const engaged = Math.floor(config.reach * (config.engagementRate / 100))
  const visitorsOut = Math.floor(engaged * (config.ctr / 100))
  return {
    visitorsIn: visitorsOut,
    visitorsConverted: visitorsOut,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

function calculatePaidSocial(config: PaidSocialConfig): NodeSimResult {
  const impressions = config.cpm > 0 ? (config.budget / config.cpm) * 1000 : 0
  const visitorsOut = Math.floor(impressions * (config.ctr / 100))
  return {
    visitorsIn: visitorsOut,
    visitorsConverted: visitorsOut,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: config.budget,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateAIAgent(visitorsIn: number, config: AIAgentConfig): NodeSimResult {
  const sessions = Math.min(visitorsIn, config.sessionsPerMonth)
  const resolved = Math.floor(sessions * (config.resolutionRate / 100))
  const converted = Math.floor(sessions * (config.conversionRate / 100))
  const notConverted = sessions - converted
  const cost = sessions * config.costPerSession
  return {
    visitorsIn: sessions,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue: 0,
    cost,
    leads: resolved,
    conversionRate: sessions > 0 ? (converted / sessions) * 100 : 0,
  }
}

function calculateGenericConversion(visitorsIn: number, config: GenericConversionConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.conversionRate / 100))
  const notConverted = visitorsIn - converted
  const revenue = converted * (config.revenue ?? 0)
  const cost = config.cost ?? 0
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: notConverted,
    revenue,
    cost,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

// ─── Contenido y engagement ───────────────────────────────────────────────────

function calculateBlogSeo(visitorsIn: number, config: BlogSeoConfig): NodeSimResult {
  const effectiveIn = visitorsIn > 0 ? visitorsIn : config.monthlyVisits
  const converted = Math.floor(effectiveIn * (config.ctrToCta / 100))
  return {
    visitorsIn: effectiveIn,
    visitorsConverted: converted,
    visitorsNotConverted: effectiveIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: effectiveIn > 0 ? (converted / effectiveIn) * 100 : 0,
  }
}

function calculateVideoContent(visitorsIn: number, config: VideoContentConfig): NodeSimResult {
  const effectiveIn = visitorsIn > 0 ? visitorsIn : config.monthlyViews
  const converted = Math.floor(effectiveIn * (config.watchTimePct / 100) * (config.ctrToCta / 100))
  return {
    visitorsIn: effectiveIn,
    visitorsConverted: converted,
    visitorsNotConverted: effectiveIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: effectiveIn > 0 ? (converted / effectiveIn) * 100 : 0,
  }
}

function calculateLeadMagnet(visitorsIn: number, config: LeadMagnetConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.optInRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateQuizInteractive(visitorsIn: number, config: QuizInteractiveConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.startRate / 100) * (config.completionRate / 100) * (config.optInAtEnd / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateCalculatorTool(visitorsIn: number, config: CalculatorToolConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.nextStepConversion / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateEducationalCarousel(visitorsIn: number, config: EducationalCarouselConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.ctrToLink / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateEbookGuide(visitorsIn: number, config: EbookGuideConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.avgPagesPct / 100) * (config.ctrToOffer / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateResourceTemplate(visitorsIn: number, config: ResourceTemplateConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.downloadRate / 100) * (config.actualUseRate / 100) * (config.postUseConversion / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateWebinarReplay(visitorsIn: number, config: WebinarReplayConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.viewsPct / 100) * (config.watchTimePct / 100) * (config.ctrToOffer / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateCaseStudy(visitorsIn: number, config: CaseStudyConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.ctrToCta / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

// ─── Agentes de IA ────────────────────────────────────────────────────────────

function calculateAiWhatsapp(visitorsIn: number, config: AiWhatsappConfig): NodeSimResult {
  const cost = config.messagesPerMonth * config.costPerConversation
  const converted = Math.floor(visitorsIn * (config.autoResponseRate / 100) * (config.conversionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiWebChat(visitorsIn: number, config: AiWebChatConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.leadsGeneratedRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiVoice(visitorsIn: number, config: AiVoiceConfig): NodeSimResult {
  const cost = config.callsAttendedPerMonth * config.costPerCall
  const converted = Math.floor(visitorsIn * (config.bookingRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiInstagramDm(visitorsIn: number, config: AiInstagramDmConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.autoResponseRate / 100) * (config.linkConversionRate / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiEmail(visitorsIn: number, config: AiEmailConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.autoResponseRate / 100) * (config.autoFollowUpRate / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateChatbotRules(visitorsIn: number, config: ChatbotRulesConfig): NodeSimResult {
  const converted = Math.floor(
    visitorsIn * (config.flowCompletionRate / 100) * (config.leadsCapturedRate / 100)
  )
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAutomationWorkflow(visitorsIn: number, config: AutomationWorkflowConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.successRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: config.operatingCostPerMonth,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiLeadScoring(visitorsIn: number, config: AiLeadScoringConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.mqlRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: converted,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateAiContentPersonalization(visitorsIn: number, config: AiContentPersonalizationConfig): NodeSimResult {
  // Multiplier: boosts effective conversion rate for downstream nodes
  const multiplied = Math.floor(visitorsIn * (1 + config.conversionLift / 100))
  return {
    visitorsIn,
    visitorsConverted: multiplied,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (multiplied / visitorsIn) * 100 : 100,
  }
}

function calculateAiSegmentation(visitorsIn: number, _config: AiSegmentationConfig): NodeSimResult {
  // All pass through — segmentation routes them but doesn't filter
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function calculateConditionalBranch(visitorsIn: number, config: ConditionalBranchConfig): NodeSimResult {
  const yesConverted = Math.floor(visitorsIn * (config.yesPercent / 100))
  return {
    visitorsIn,
    visitorsConverted: yesConverted,
    visitorsNotConverted: visitorsIn - yesConverted,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: config.yesPercent,
  }
}

function calculateKpiCheckpoint(visitorsIn: number, _config: KpiCheckpointConfig): NodeSimResult {
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateLoopRecurrence(visitorsIn: number, config: LoopRecurrenceConfig): NodeSimResult {
  // Pass-through; retention and iteration info is shown in the form
  const retainedEach = config.retentionPerCycle / 100
  let totalFlow = 0
  let current = visitorsIn
  for (let i = 0; i < config.iterations; i++) {
    totalFlow += current
    current = Math.floor(current * retainedEach)
  }
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: totalFlow,
    conversionRate: 100,
  }
}

function calculateMilestoneNode(visitorsIn: number, _config: MilestoneNodeConfig): NodeSimResult {
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateFixedCostNode(visitorsIn: number, config: FixedCostNodeConfig): NodeSimResult {
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: config.monthlyCost,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateDelay(visitorsIn: number, config: DelayConfig): NodeSimResult {
  const surviving = Math.floor(visitorsIn * (1 - config.dropOffRate / 100))
  const dropped = visitorsIn - surviving
  return {
    visitorsIn,
    visitorsConverted: surviving,
    visitorsNotConverted: dropped,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (surviving / visitorsIn) * 100 : 0,
  }
}

function calculateRecurringRevenue(visitorsIn: number, config: RecurringRevenueConfig): NodeSimResult {
  // Project MRR over months accounting for monthly churn and growth
  // MRR per customer = config.mrr; customers = visitorsIn (if > 0) or treat mrr as total MRR
  const baseMrr = visitorsIn > 0 ? visitorsIn * config.mrr : config.mrr
  const churnFactor = 1 - config.churnRate / 100
  const growthFactor = 1 + (config.growthRate ?? 0) / 100
  let totalRevenue = 0
  let currentMrr = baseMrr
  for (let i = 0; i < config.months; i++) {
    totalRevenue += currentMrr
    currentMrr = currentMrr * churnFactor * growthFactor
  }
  return {
    visitorsIn,
    visitorsConverted: visitorsIn,
    visitorsNotConverted: 0,
    revenue: totalRevenue,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

// ─── Traffic Entry ────────────────────────────────────────────────────────────

function calculateTrafficEntry(config: TrafficEntryConfig): NodeSimResult {
  const totalVisitors = config.totalVisitors ?? 0
  const totalBudget = config.totalBudget ?? 0
  return {
    visitorsIn: totalVisitors,
    visitorsConverted: totalVisitors,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: totalBudget,
    leads: 0,
    conversionRate: 100,
  }
}

// ─── Nuevas fuentes de tráfico especializadas ─────────────────────────────────

function calculatePaidTraffic(config: PaidTrafficConfig): NodeSimResult {
  let visitorsOut = 0
  const cost = config.budget

  if (config.costModel === 'cpc') {
    visitorsOut = config.cpc > 0 ? Math.floor(config.budget / config.cpc) : 0
  } else if (config.costModel === 'cpm') {
    const impressions = config.cpm > 0 ? (config.budget / config.cpm) * 1000 : 0
    visitorsOut = Math.floor(impressions * (config.ctr / 100))
  } else if (config.costModel === 'cpv') {
    const views = config.cpv > 0 ? Math.floor(config.budget / config.cpv) : 0
    visitorsOut = Math.floor(views * (config.ctr / 100))
  }

  return {
    visitorsIn: visitorsOut,
    visitorsConverted: visitorsOut,
    visitorsNotConverted: 0,
    revenue: 0,
    cost,
    leads: 0,
    conversionRate: 100,
  }
}

function calculateOrganicChannel(config: OrganicChannelConfig): NodeSimResult {
  let visitorsOut = 0

  if (config.channel === 'emailList') {
    // Visitas = tamaño de lista × open rate × CTR
    visitorsOut = Math.floor(config.listSize * (config.openRate / 100) * (config.ctr / 100))
  } else if (config.channel === 'referrals') {
    // Visitas = referidores activos × referidos por referidor × conversión
    visitorsOut = Math.floor(
      config.activeReferrers * config.referralsPerReferrer * (config.referralConversionRate / 100)
    )
  } else if (config.channel === 'blog') {
    // Blog/SEO: el alcance ya son visitas directas
    visitorsOut = config.reach
  } else {
    // Canal estándar: alcance × CTR
    visitorsOut = Math.floor(config.reach * (config.ctr / 100))
  }

  return {
    visitorsIn: visitorsOut,
    visitorsConverted: visitorsOut,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: 100,
  }
}

// ─── Follow-up y nurturing ───────────────────────────────────────────────────

function calculatePushNotifications(visitorsIn: number, config: PushNotificationsConfig): NodeSimResult {
  const optIned = Math.floor(visitorsIn * (config.optInRate / 100))
  const delivered = Math.floor(optIned * (config.deliveryRate / 100))
  const clicked = Math.floor(delivered * (config.ctr / 100))
  return {
    visitorsIn,
    visitorsConverted: clicked,
    visitorsNotConverted: visitorsIn - clicked,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (clicked / visitorsIn) * 100 : 0,
  }
}

function calculateDynamicRetargeting(visitorsIn: number, config: DynamicRetargetingConfig): NodeSimResult {
  const clicks = config.cpc > 0 ? Math.floor(config.budget / config.cpc) : 0
  const converted = Math.floor(clicks * (config.postClickConversion / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - Math.min(converted, visitorsIn),
    revenue: 0,
    cost: config.budget,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

function calculateMultichannelNurturing(visitorsIn: number, config: MultichannelNurturingConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.conversionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: config.monthlyCost,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculateCartAbandonmentSeq(visitorsIn: number, config: CartAbandonmentSeqConfig): NodeSimResult {
  const recovered = Math.floor(visitorsIn * (config.recoveryRate / 100))
  const revenue = recovered * config.avgCartValue
  return {
    visitorsIn,
    visitorsConverted: recovered,
    visitorsNotConverted: visitorsIn - recovered,
    revenue,
    cost: 0,
    leads: 0,
    conversionRate: config.recoveryRate,
  }
}

function calculateReEngagement(visitorsIn: number, config: ReEngagementConfig): NodeSimResult {
  const reactivated = Math.floor(visitorsIn * (config.reactivationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: reactivated,
    visitorsNotConverted: visitorsIn - reactivated,
    revenue: 0,
    cost: reactivated * config.costPerReactivation,
    leads: 0,
    conversionRate: config.reactivationRate,
  }
}

function calculateDripCampaign(visitorsIn: number, config: DripCampaignConfig): NodeSimResult {
  const engaged = Math.floor(visitorsIn * (config.sustainedEngagement / 100))
  const converted = Math.floor(engaged * (config.eventualConversion / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
  }
}

// ─── Post-venta y retención ───────────────────────────────────────────────────

function calculateOnboardingSeq(visitorsIn: number, config: OnboardingSeqConfig): NodeSimResult {
  const completed = Math.floor(visitorsIn * (config.completionRate / 100))
  const activated = Math.floor(completed * (config.activationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: activated,
    visitorsNotConverted: visitorsIn - activated,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (activated / visitorsIn) * 100 : 0,
  }
}

function calculateReviewRequest(visitorsIn: number, config: ReviewRequestConfig): NodeSimResult {
  const reviews = Math.floor(visitorsIn * (config.responseRate / 100))
  return {
    visitorsIn,
    visitorsConverted: visitorsIn, // todos pasan
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: reviews,                // reseñas generadas
    conversionRate: 100,
  }
}

function calculateReferralProgram(visitorsIn: number, config: ReferralProgramConfig): NodeSimResult {
  const newCustomers = Math.floor(visitorsIn * config.invitationsPerCustomer * (config.referralConversionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: newCustomers,
    visitorsNotConverted: 0,
    revenue: 0,
    cost: newCustomers * config.rewardCost,
    leads: newCustomers,
    conversionRate: visitorsIn > 0 ? (newCustomers / visitorsIn) * 100 : 0,
  }
}

function calculateRenewalUpsell(visitorsIn: number, config: RenewalUpsellConfig): NodeSimResult {
  const renewals = Math.floor(visitorsIn * (1 - config.churnRate / 100))
  const upgrades = Math.floor(visitorsIn * (config.upgradeRate / 100))
  const revenue = (renewals * config.renewalPrice) + (upgrades * config.upgradePrice)
  return {
    visitorsIn,
    visitorsConverted: renewals,
    visitorsNotConverted: visitorsIn - renewals,
    revenue,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (renewals / visitorsIn) * 100 : 0,
  }
}

function calculatePostSaleSupport(visitorsIn: number, config: PostSaleSupportConfig): NodeSimResult {
  const resolved = Math.floor(visitorsIn * (config.resolutionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: resolved,
    visitorsNotConverted: visitorsIn - resolved,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: config.resolutionRate,
  }
}

function calculateCustomerCommunity(visitorsIn: number, config: CustomerCommunityConfig): NodeSimResult {
  const active = Math.floor(visitorsIn * (config.activeMembersRate / 100))
  return {
    visitorsIn,
    visitorsConverted: active,
    visitorsNotConverted: visitorsIn - active,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: config.activeMembersRate,
  }
}

function calculateCrossSell(visitorsIn: number, config: CrossSellConfig): NodeSimResult {
  const buyers = Math.floor(visitorsIn * (config.acceptanceRate / 100))
  return {
    visitorsIn,
    visitorsConverted: buyers,
    visitorsNotConverted: visitorsIn - buyers,
    revenue: buyers * config.price,
    cost: 0,
    leads: 0,
    conversionRate: config.acceptanceRate,
  }
}

function calculateWinBack(visitorsIn: number, config: WinBackConfig): NodeSimResult {
  const reactivated = Math.floor(visitorsIn * (config.reactivationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: reactivated,
    visitorsNotConverted: visitorsIn - reactivated,
    revenue: 0,
    cost: reactivated * config.reactivationCost,
    leads: 0,
    conversionRate: config.reactivationRate,
  }
}

function calculateLoyaltyProgram(visitorsIn: number, config: LoyaltyProgramConfig): NodeSimResult {
  const participants = Math.floor(visitorsIn * (config.participationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: participants,
    visitorsNotConverted: visitorsIn - participants,
    revenue: 0,
    cost: participants * config.programCostPerCustomer,
    leads: 0,
    conversionRate: config.participationRate,
  }
}

function calculateNpsSurvey(visitorsIn: number, config: NpsSurveyConfig): NodeSimResult {
  const responses = Math.floor(visitorsIn * (config.responseRate / 100))
  return {
    visitorsIn,
    visitorsConverted: visitorsIn, // todos pasan
    visitorsNotConverted: 0,
    revenue: 0,
    cost: 0,
    leads: responses,              // respuestas capturadas
    conversionRate: 100,
  }
}

// ─── Páginas de conversión ────────────────────────────────────────────────────

function calculateApplicationPage(visitorsIn: number, config: ApplicationPageConfig): NodeSimResult {
  const completed = Math.floor(visitorsIn * (config.completionRate / 100))
  const qualified = Math.floor(completed * (config.qualificationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: qualified,
    visitorsNotConverted: visitorsIn - qualified,
    revenue: 0,
    cost: 0,
    leads: qualified,
    conversionRate: visitorsIn > 0 ? (qualified / visitorsIn) * 100 : 0,
  }
}

function calculateTripwire(visitorsIn: number, config: TripwireConfig): NodeSimResult {
  const buyers = Math.floor(visitorsIn * (config.conversionRate / 100))
  const grossRevenue = buyers * config.price
  const fees = grossRevenue * (config.processorFee / 100)
  return {
    visitorsIn,
    visitorsConverted: buyers,
    visitorsNotConverted: visitorsIn - buyers,
    revenue: grossRevenue,
    cost: fees,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculateCatalogStore(visitorsIn: number, config: CatalogStoreConfig): NodeSimResult {
  const notBounced = Math.floor(visitorsIn * (1 - config.bounceRate / 100))
  const addedToCart = Math.floor(notBounced * (config.addToCartRate / 100))
  return {
    visitorsIn,
    visitorsConverted: addedToCart,
    visitorsNotConverted: visitorsIn - addedToCart,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (addedToCart / visitorsIn) * 100 : 0,
  }
}

function calculatePricingPage(visitorsIn: number, config: PricingPageConfig): NodeSimResult {
  const converted = Math.floor(visitorsIn * (config.conversionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: converted,
    visitorsNotConverted: visitorsIn - converted,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculateFreeTrialSignup(visitorsIn: number, config: FreeTrialSignupConfig): NodeSimResult {
  const signed = Math.floor(visitorsIn * (config.signupRate / 100))
  const activated = Math.floor(signed * (config.activationRate / 100))
  return {
    visitorsIn,
    visitorsConverted: activated,
    visitorsNotConverted: visitorsIn - activated,
    revenue: 0,
    cost: 0,
    leads: signed,
    conversionRate: visitorsIn > 0 ? (activated / visitorsIn) * 100 : 0,
  }
}

function calculateThankYouOffer(visitorsIn: number, config: ThankYouOfferConfig): NodeSimResult {
  const buyers = Math.floor(visitorsIn * (config.conversionRate / 100))
  const grossRevenue = buyers * config.price
  const fees = grossRevenue * (config.processorFee / 100)
  return {
    visitorsIn,
    visitorsConverted: buyers,
    visitorsNotConverted: visitorsIn - buyers,
    revenue: grossRevenue,
    cost: fees,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

// ─── Ventas y cierre ──────────────────────────────────────────────────────────

function calculateOutboundCall(visitorsIn: number, config: OutboundCallConfig): NodeSimResult {
  const contacted = Math.floor(visitorsIn * (config.contactRate / 100))
  const conversed = Math.floor(contacted * (config.conversationRate / 100))
  const closed = Math.floor(conversed * (config.closeRate / 100))
  return {
    visitorsIn,
    visitorsConverted: closed,
    visitorsNotConverted: visitorsIn - closed,
    revenue: closed * config.avgTicket,
    cost: 0,
    leads: contacted,
    conversionRate: visitorsIn > 0 ? (closed / visitorsIn) * 100 : 0,
  }
}

function calculateInboundCall(visitorsIn: number, config: InboundCallConfig): NodeSimResult {
  const answered = Math.floor(visitorsIn * (config.answeredRate / 100))
  const closed = Math.floor(answered * (config.closeRate / 100))
  return {
    visitorsIn,
    visitorsConverted: closed,
    visitorsNotConverted: visitorsIn - closed,
    revenue: closed * config.avgTicket,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (closed / visitorsIn) * 100 : 0,
  }
}

function calculateSalesProposal(visitorsIn: number, config: SalesProposalConfig): NodeSimResult {
  const opened = Math.floor(visitorsIn * (config.openRate / 100))
  const accepted = Math.floor(opened * (config.acceptanceRate / 100))
  return {
    visitorsIn,
    visitorsConverted: accepted,
    visitorsNotConverted: visitorsIn - accepted,
    revenue: accepted * config.avgPrice,
    cost: 0,
    leads: 0,
    conversionRate: visitorsIn > 0 ? (accepted / visitorsIn) * 100 : 0,
  }
}

function calculateProductDemo(visitorsIn: number, config: ProductDemoConfig, hasPaymentDownstream = true): NodeSimResult {
  const showed = Math.floor(visitorsIn * (config.showRate / 100))
  if (hasPaymentDownstream) {
    // Filtro: qualifica hacia el nodo de pago downstream
    const qualified = Math.floor(showed * (config.followUpRate / 100))
    return {
      visitorsIn,
      visitorsConverted: qualified,
      visitorsNotConverted: visitorsIn - qualified,
      revenue: 0,
      cost: 0,
      leads: 0,
      conversionRate: visitorsIn > 0 ? (qualified / visitorsIn) * 100 : 0,
    }
  } else {
    // Sin nodo de pago downstream: cierra directamente
    const closed = Math.floor(showed * (config.closeRate / 100))
    return {
      visitorsIn,
      visitorsConverted: closed,
      visitorsNotConverted: visitorsIn - closed,
      revenue: closed * config.avgPrice,
      cost: 0,
      leads: 0,
      conversionRate: visitorsIn > 0 ? (closed / visitorsIn) * 100 : 0,
    }
  }
}

function calculateTrialToPaid(visitorsIn: number, config: TrialToPaidConfig): NodeSimResult {
  const buyers = Math.floor(visitorsIn * (config.conversionRate / 100))
  return {
    visitorsIn,
    visitorsConverted: buyers,
    visitorsNotConverted: visitorsIn - buyers,
    revenue: buyers * config.price,
    cost: 0,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculatePhysicalPos(visitorsIn: number, config: PhysicalPosConfig): NodeSimResult {
  // Si no hay entrada (nodo fuente), usa walk-ins como visitantes
  const effectiveIn = visitorsIn > 0 ? visitorsIn : config.walkInsPerMonth
  const buyers = Math.floor(effectiveIn * (config.conversionRate / 100))
  return {
    visitorsIn: effectiveIn,
    visitorsConverted: buyers,
    visitorsNotConverted: effectiveIn - buyers,
    revenue: buyers * config.avgTicket,
    cost: 0,
    leads: 0,
    conversionRate: config.conversionRate,
  }
}

function calculateDigitalContract(visitorsIn: number, config: DigitalContractConfig): NodeSimResult {
  const signed = Math.floor(visitorsIn * (config.signedRate / 100))
  return {
    visitorsIn,
    visitorsConverted: signed,
    visitorsNotConverted: visitorsIn - signed,
    revenue: signed * config.contractValue,
    cost: 0,
    leads: 0,
    conversionRate: config.signedRate,
  }
}

function calculateSalesNegotiation(visitorsIn: number, config: SalesNegotiationConfig): NodeSimResult {
  const won = Math.floor(visitorsIn * (config.winRate / 100))
  return {
    visitorsIn,
    visitorsConverted: won,
    visitorsNotConverted: visitorsIn - won,
    revenue: 0,
    cost: 0,
    leads: 0,
    conversionRate: config.winRate,
  }
}

function calculateEventSales(visitorsIn: number, config: EventSalesConfig): NodeSimResult {
  const leadsContacted = Math.floor(visitorsIn * (config.leadsContactedRate / 100))
  const followed = Math.floor(leadsContacted * (config.followUpRate / 100))
  const closed = Math.floor(followed * (config.closeRate / 100))
  return {
    visitorsIn,
    visitorsConverted: closed,
    visitorsNotConverted: visitorsIn - closed,
    revenue: closed * config.avgTicket,
    cost: 0,
    leads: leadsContacted,
    conversionRate: visitorsIn > 0 ? (closed / visitorsIn) * 100 : 0,
  }
}

// ─── Pre-pase: nodos que tienen un nodo de pago aguas abajo ──────────────────

/**
 * Retorna un Set con los IDs de todos los nodos que tienen al menos un nodo
 * de pago (checkout, upsell, downsell, orderBump, tripwire) en su camino
 * descendente. Usado para decidir si salesPage/webinarVsl generan revenue.
 */
function findNodesWithPaymentDownstream(nodes: FunnelRFNode[], edges: FunnelRFEdge[]): Set<string> {
  const paymentNodeTypes = new Set([
    'checkout', 'upsell', 'downsell', 'orderBump',
    'tripwire', 'thankYouOffer', 'outboundCall', 'inboundCall',
    'salesProposal', 'trialToPaid', 'physicalPos', 'digitalContract', 'eventSales',
    'cartAbandonmentSeq', 'renewalUpsell', 'crossSell',
  ])

  // Grafo inverso: nodo → padres
  const incoming: Record<string, string[]> = {}
  for (const node of nodes) incoming[node.id] = []
  for (const edge of edges) {
    if (incoming[edge.target]) incoming[edge.target].push(edge.source)
  }

  // BFS hacia atrás desde todos los nodos de pago
  const result = new Set<string>()
  const queue: string[] = []

  for (const node of nodes) {
    if (paymentNodeTypes.has(node.data.nodeType)) {
      result.add(node.id)
      queue.push(node.id)
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    for (const parentId of (incoming[nodeId] ?? [])) {
      if (!result.has(parentId)) {
        result.add(parentId)
        queue.push(parentId)
      }
    }
  }

  return result
}

// ─── Motor principal de simulación ───────────────────────────────────────────

export function runSimulation(
  nodes: FunnelRFNode[],
  edges: FunnelRFEdge[]
): GlobalSimResults {
  // Build node ID set for orphan-edge filtering
  const nodeIdSet = new Set(nodes.map(n => n.id))

  // Filter out orphan edges (source or target node no longer exists) THEN deduplicate.
  // Orphan edges inflate inDegree in Kahn's algorithm, causing downstream nodes to
  // never be queued and therefore be processed with visitorsIn = 0 (zero revenue).
  const seenEdgeKeys = new Set<string>()
  const dedupedEdges = edges.filter(e => {
    if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) return false
    const key = `${e.source}||${e.sourceHandle ?? ''}||${e.target}`
    if (seenEdgeKeys.has(key)) return false
    seenEdgeKeys.add(key)
    return true
  })
  edges = dedupedEdges

  const nodeResults: Record<string, NodeSimResult> = {}

  // Pre-pase: detectar nodos con checkout/pago aguas abajo
  const nodesWithPaymentDownstream = findNodesWithPaymentDownstream(nodes, edges)

  // Mapa de nodo → edges salientes
  const outgoingEdges: Record<string, FunnelRFEdge[]> = {}
  // Mapa de nodo → flujo de visitantes entrantes (acumulado)
  const incomingFlow: Record<string, { yes: number; no: number; default: number; branches: Record<string, number> }> = {}

  // Inicializar estructuras
  for (const node of nodes) {
    outgoingEdges[node.id] = []
    incomingFlow[node.id] = { yes: 0, no: 0, default: 0, branches: {} }
  }
  for (const edge of edges) {
    outgoingEdges[edge.source]?.push(edge)
  }

  // ── Calcular qué nodos son alcanzables desde fuentes con salida (BFS) ────
  // Un nodo está "en cadena" si:
  //   - Es una fuente de tráfico CON al menos una arista saliente, O
  //   - Es alcanzable desde una fuente con salida a través de aristas
  const organicSourceTypeSet = new Set([
    'trafficSource', 'reels', 'organicPost', 'podcast', 'influencer',
    'community', 'pr', 'marketplace', 'qrOffline',
    'linkedinAds', 'twitterAds', 'pinterestAds', 'youtubeAds',
    'paidTraffic', 'organicTraffic', 'trafficEntry',
  ])
  const chainNodes = new Set<string>()
  const bfsQueue: string[] = []
  for (const node of nodes) {
    if (organicSourceTypeSet.has(node.data.nodeType) && outgoingEdges[node.id].length > 0) {
      chainNodes.add(node.id)
      bfsQueue.push(node.id)
    }
  }
  while (bfsQueue.length > 0) {
    const nid = bfsQueue.shift()!
    for (const edge of (outgoingEdges[nid] ?? [])) {
      if (!chainNodes.has(edge.target)) {
        chainNodes.add(edge.target)
        bfsQueue.push(edge.target)
      }
    }
  }

  // Ordenamiento topológico (Kahn's algorithm) para manejar el grafo sin ciclos
  const inDegree: Record<string, number> = {}
  for (const node of nodes) inDegree[node.id] = 0
  for (const edge of edges) {
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
  }

  const queue: string[] = []
  for (const node of nodes) {
    if (inDegree[node.id] === 0 || organicSourceTypeSet.has(node.data.nodeType)) {
      queue.push(node.id)
    }
  }

  const visited = new Set<string>()
  const processingOrder: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    processingOrder.push(nodeId)

    for (const edge of (outgoingEdges[nodeId] ?? [])) {
      inDegree[edge.target] = (inDegree[edge.target] ?? 1) - 1
      if (inDegree[edge.target] <= 0 && !visited.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  }

  // Añadir nodos no visitados (por ciclos) al final
  for (const node of nodes) {
    if (!visited.has(node.id)) processingOrder.push(node.id)
  }

  // Procesar nodos en orden topológico
  for (const nodeId of processingOrder) {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) continue

    const { nodeType, config } = node.data
    const flow = incomingFlow[nodeId]

    // Calcular visitorsIn según el tipo de nodo
    const isSourceNode = organicSourceTypeSet.has(nodeType)
      || nodeType === 'recurringRevenueNode'

    const visitorsIn = isSourceNode
      ? 0  // se calcula interno
      : flow.yes + flow.no + flow.default + Object.values(flow.branches).reduce((a, b) => a + b, 0)

    let result: NodeSimResult

    switch (nodeType as FunnelNodeType) {
      case 'trafficSource':
        result = calculateTrafficSource(config as TrafficSourceConfig)
        break
      case 'landingPage':
        result = calculateLandingPage(visitorsIn, config as LandingPageConfig)
        break
      case 'salesPage':
        result = calculateSalesPage(visitorsIn, config as SalesPageConfig, nodesWithPaymentDownstream.has(nodeId))
        break
      case 'checkout':
        result = calculateCheckout(visitorsIn, config as CheckoutConfig)
        break
      case 'upsell':
        result = calculateUpsell(visitorsIn, config as UpsellConfig)
        break
      case 'downsell':
        result = calculateDownsell(visitorsIn, config as DownsellConfig)
        break
      case 'orderBump':
        result = calculateOrderBump(visitorsIn, config as OrderBumpConfig)
        break
      case 'emailSequence':
        result = calculateEmailSequence(visitorsIn, config as EmailSequenceConfig)
        break
      case 'whatsappSms':
        result = calculateWhatsAppSms(visitorsIn, config as WhatsAppSmsConfig)
        break
      case 'webinarVsl':
        result = calculateWebinarVsl(visitorsIn, config as WebinarVslConfig, nodesWithPaymentDownstream.has(nodeId))
        break
      case 'retargeting':
        result = calculateRetargeting(visitorsIn, config as RetargetingConfig)
        break
      case 'appointment':
        result = calculateAppointment(visitorsIn, config as AppointmentConfig)
        break
      case 'split': {
        const splitConfig = config as SplitConfig
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        // Distribuir a ramas
        for (const branch of splitConfig.branches) {
          const branchFlow = Math.floor(visitorsIn * (branch.percentage / 100))
          // Propagamos en la siguiente fase via outgoingEdges
          for (const edge of (outgoingEdges[nodeId] ?? [])) {
            if (edge.sourceHandle === branch.id) {
              const targetFlow = incomingFlow[edge.target]
              if (targetFlow) {
                targetFlow.branches[branch.id] = (targetFlow.branches[branch.id] ?? 0) + branchFlow
              }
            }
          }
        }
        result.isInChain = chainNodes.has(nodeId)
        nodeResults[nodeId] = result
        continue  // ya propagamos manualmente, saltar propagación estándar
      }
      case 'result':
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        break

      // ─── Nuevas fuentes especializadas ───
      case 'trafficEntry':
        result = calculateTrafficEntry(config as TrafficEntryConfig)
        break
      case 'paidTraffic':
        result = calculatePaidTraffic(config as PaidTrafficConfig)
        break
      case 'organicTraffic':
        result = calculateOrganicChannel(config as OrganicChannelConfig)
        break

      // ─── Organic traffic sources (legacy) ───
      case 'reels':
      case 'organicPost':
      case 'podcast':
      case 'influencer':
      case 'community':
      case 'pr':
      case 'marketplace':
      case 'qrOffline':
        result = calculateOrganicTraffic(config as OrganicTrafficConfig)
        break

      // ─── Paid social (legacy) ───
      case 'linkedinAds':
      case 'twitterAds':
      case 'pinterestAds':
      case 'youtubeAds':
        result = calculatePaidSocial(config as PaidSocialConfig)
        break

      // ─── AI agents ───
      case 'aiAgent': {
        const cfg = config as AiAgentUnifiedConfig
        const cost = cfg.volumePerMonth * (cfg.costPerUnit ?? 0)
        const converted = Math.floor(visitorsIn * (cfg.autoResponseRate / 100) * (cfg.conversionRate / 100))
        result = {
          visitorsIn,
          visitorsConverted: converted,
          visitorsNotConverted: visitorsIn - converted,
          revenue: 0,
          cost,
          leads: converted,
          conversionRate: visitorsIn > 0 ? (converted / visitorsIn) * 100 : 0,
        }
        break
      }
      case 'aiWhatsapp':
        result = calculateAiWhatsapp(visitorsIn, config as AiWhatsappConfig)
        break
      case 'aiWebChat':
        result = calculateAiWebChat(visitorsIn, config as AiWebChatConfig)
        break
      case 'aiVoice':
        result = calculateAiVoice(visitorsIn, config as AiVoiceConfig)
        break
      case 'aiInstagramDm':
        result = calculateAiInstagramDm(visitorsIn, config as AiInstagramDmConfig)
        break
      case 'aiEmail':
        result = calculateAiEmail(visitorsIn, config as AiEmailConfig)
        break
      case 'chatbotRules':
        result = calculateChatbotRules(visitorsIn, config as ChatbotRulesConfig)
        break

      // ─── Tracking nodes — pass-through ───
      case 'metaPixel':
      case 'googleTagManager':
      case 'googleAnalytics':
      case 'metaOfflineData':
      case 'utmTracking':
      case 'serverPostback':
      case 'crmAttribution':
      case 'heatmaps':
      case 'callTracking':
      case 'conversionApi':
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        break

      // ─── Delay ───
      case 'delayWait':
        result = calculateDelay(visitorsIn, config as DelayConfig)
        break

      // ─── Recurring revenue ───
      case 'recurringRevenueNode':
        result = calculateRecurringRevenue(visitorsIn, config as RecurringRevenueConfig)
        break

      // ─── Contenido y engagement ───
      case 'blogSeo':
        result = calculateBlogSeo(visitorsIn, config as BlogSeoConfig)
        break
      case 'videoContent':
        result = calculateVideoContent(visitorsIn, config as VideoContentConfig)
        break
      case 'educationalCarousel':
        result = calculateEducationalCarousel(visitorsIn, config as EducationalCarouselConfig)
        break

      // ─── Páginas de conversión ───
      case 'applicationPage':
        result = calculateApplicationPage(visitorsIn, config as ApplicationPageConfig)
        break
      case 'tripwire':
        result = calculateTripwire(visitorsIn, config as TripwireConfig)
        break
      case 'catalogStore':
        result = calculateCatalogStore(visitorsIn, config as CatalogStoreConfig)
        break
      case 'pricingPage':
        result = calculatePricingPage(visitorsIn, config as PricingPageConfig)
        break
      case 'freeTrialSignup':
        result = calculateFreeTrialSignup(visitorsIn, config as FreeTrialSignupConfig)
        break
      case 'thankYouOffer':
        result = calculateThankYouOffer(visitorsIn, config as ThankYouOfferConfig)
        break

      // ─── Ventas y cierre ───
      case 'outboundCall':
        result = calculateOutboundCall(visitorsIn, config as OutboundCallConfig)
        break
      case 'inboundCall':
        result = calculateInboundCall(visitorsIn, config as InboundCallConfig)
        break
      case 'salesProposal':
        result = calculateSalesProposal(visitorsIn, config as SalesProposalConfig)
        break
      case 'productDemo':
        result = calculateProductDemo(visitorsIn, config as ProductDemoConfig, nodesWithPaymentDownstream.has(nodeId))
        break
      case 'trialToPaid':
        result = calculateTrialToPaid(visitorsIn, config as TrialToPaidConfig)
        break
      case 'physicalPos':
        result = calculatePhysicalPos(visitorsIn, config as PhysicalPosConfig)
        break
      case 'digitalContract':
        result = calculateDigitalContract(visitorsIn, config as DigitalContractConfig)
        break
      case 'salesNegotiation':
        result = calculateSalesNegotiation(visitorsIn, config as SalesNegotiationConfig)
        break
      case 'eventSales':
        result = calculateEventSales(visitorsIn, config as EventSalesConfig)
        break

      case 'leadMagnet':
        result = calculateLeadMagnet(visitorsIn, config as LeadMagnetConfig)
        break
      case 'quizInteractive':
        result = calculateQuizInteractive(visitorsIn, config as QuizInteractiveConfig)
        break
      case 'calculatorTool':
        result = calculateCalculatorTool(visitorsIn, config as CalculatorToolConfig)
        break
      case 'ebookGuide':
        result = calculateEbookGuide(visitorsIn, config as EbookGuideConfig)
        break
      case 'resourceTemplate':
        result = calculateResourceTemplate(visitorsIn, config as ResourceTemplateConfig)
        break
      case 'webinarReplay':
        result = calculateWebinarReplay(visitorsIn, config as WebinarReplayConfig)
        break
      case 'caseStudy':
        result = calculateCaseStudy(visitorsIn, config as CaseStudyConfig)
        break
      // ─── Follow-up y nurturing ───
      case 'pushNotifications':
        result = calculatePushNotifications(visitorsIn, config as PushNotificationsConfig)
        break
      case 'dynamicRetargeting':
        result = calculateDynamicRetargeting(visitorsIn, config as DynamicRetargetingConfig)
        break
      case 'multichannelNurturing':
        result = calculateMultichannelNurturing(visitorsIn, config as MultichannelNurturingConfig)
        break
      case 'cartAbandonmentSeq':
        result = calculateCartAbandonmentSeq(visitorsIn, config as CartAbandonmentSeqConfig)
        break
      case 'reEngagement':
        result = calculateReEngagement(visitorsIn, config as ReEngagementConfig)
        break
      case 'dripCampaign':
        result = calculateDripCampaign(visitorsIn, config as DripCampaignConfig)
        break

      // ─── Post-venta y retención ───
      case 'onboardingSeq':
        result = calculateOnboardingSeq(visitorsIn, config as OnboardingSeqConfig)
        break
      case 'reviewRequest':
        result = calculateReviewRequest(visitorsIn, config as ReviewRequestConfig)
        break
      case 'referralProgram':
        result = calculateReferralProgram(visitorsIn, config as ReferralProgramConfig)
        break
      case 'renewalUpsell':
        result = calculateRenewalUpsell(visitorsIn, config as RenewalUpsellConfig)
        break
      case 'postSaleSupport':
        result = calculatePostSaleSupport(visitorsIn, config as PostSaleSupportConfig)
        break
      case 'customerCommunity':
        result = calculateCustomerCommunity(visitorsIn, config as CustomerCommunityConfig)
        break
      case 'crossSell':
        result = calculateCrossSell(visitorsIn, config as CrossSellConfig)
        break
      case 'winBack':
        result = calculateWinBack(visitorsIn, config as WinBackConfig)
        break
      case 'loyaltyProgram':
        result = calculateLoyaltyProgram(visitorsIn, config as LoyaltyProgramConfig)
        break
      case 'npsSurvey':
        result = calculateNpsSurvey(visitorsIn, config as NpsSurveyConfig)
        break

      case 'automationWorkflow':
        result = calculateAutomationWorkflow(visitorsIn, config as AutomationWorkflowConfig)
        break
      case 'aiLeadScoring':
        result = calculateAiLeadScoring(visitorsIn, config as AiLeadScoringConfig)
        break
      case 'aiContentPersonalization':
        result = calculateAiContentPersonalization(visitorsIn, config as AiContentPersonalizationConfig)
        break
      case 'aiSegmentation':
        result = calculateAiSegmentation(visitorsIn, config as AiSegmentationConfig)
        break
      case 'conditionalBranch':
        result = calculateConditionalBranch(visitorsIn, config as ConditionalBranchConfig)
        break
      case 'mergeNode':
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        break
      case 'kpiCheckpoint':
        result = calculateKpiCheckpoint(visitorsIn, config as KpiCheckpointConfig)
        break
      case 'milestoneNode':
        result = calculateMilestoneNode(visitorsIn, config as MilestoneNodeConfig)
        break
      case 'fixedCostNode':
        result = calculateFixedCostNode(visitorsIn, config as FixedCostNodeConfig)
        break
      case 'loopRecurrence':
        result = calculateLoopRecurrence(visitorsIn, config as LoopRecurrenceConfig)
        break

      // ─── Non-simulation utilities ───
      case 'stickyNote':
      case 'groupContainer':
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        break

      // ─── A/B Split Test (same logic as split) ───
      case 'abSplitTest': {
        const splitConfig = config as import('./types').SplitConfig
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
        for (const branch of splitConfig.branches) {
          const branchFlow = Math.floor(visitorsIn * (branch.percentage / 100))
          for (const edge of (outgoingEdges[nodeId] ?? [])) {
            if (edge.sourceHandle === branch.id) {
              const targetFlow = incomingFlow[edge.target]
              if (targetFlow) {
                targetFlow.branches[branch.id] = (targetFlow.branches[branch.id] ?? 0) + branchFlow
              }
            }
          }
        }
        result.isInChain = chainNodes.has(nodeId)
        nodeResults[nodeId] = result
        continue
      }

      default:
        result = {
          visitorsIn,
          visitorsConverted: visitorsIn,
          visitorsNotConverted: 0,
          revenue: 0,
          cost: 0,
          leads: 0,
          conversionRate: 100,
        }
    }

    result.isInChain = chainNodes.has(nodeId)
    nodeResults[nodeId] = result

    // Propagar flujo a nodos conectados
    for (const edge of (outgoingEdges[nodeId] ?? [])) {
      const targetFlow = incomingFlow[edge.target]
      if (!targetFlow) continue

      const pathType = edge.data?.pathType ?? 'default'
      const sourceHandle = edge.sourceHandle ?? 'output'

      if (pathType === 'yes' || sourceHandle === 'output-yes') {
        targetFlow.yes += result.visitorsConverted
      } else if (pathType === 'no' || sourceHandle === 'output-no') {
        targetFlow.no += result.visitorsNotConverted
      } else if (pathType === 'rejection' || sourceHandle === 'output-rejection') {
        targetFlow.no += result.visitorsNotConverted
      } else if (sourceHandle?.startsWith('output-branch-')) {
        const branchId = sourceHandle.replace('output-', '')
        targetFlow.branches[branchId] = (targetFlow.branches[branchId] ?? 0) + result.visitorsConverted
      } else {
        // default: pasa todo
        targetFlow.default += result.visitorsConverted
      }
    }
  }

  // ─── Calcular métricas globales ──────────────────────────────────────────

  let totalRevenue = 0
  let totalCost = 0
  let totalAdSpend = 0
  let totalLeads = 0
  let totalCustomers = 0
  let totalVisitors = 0

  // Nodos de tráfico (fuentes de visitantes y gasto publicitario)
  const trafficSourceTypeSet = new Set([
    'trafficSource', 'reels', 'organicPost', 'podcast', 'influencer',
    'community', 'pr', 'marketplace', 'qrOffline',
    'linkedinAds', 'twitterAds', 'pinterestAds', 'youtubeAds',
    'paidTraffic', 'organicTraffic', 'trafficEntry',
  ])

  // Nodos que generan ventas (contados como compradores)
  const salesNodeTypes: FunnelNodeType[] = [
    'checkout', 'salesPage', 'upsell', 'downsell', 'orderBump', 'webinarVsl', 'appointment',
    'tripwire', 'applicationPage', 'thankYouOffer', 'productDemo',
    'outboundCall', 'inboundCall', 'salesProposal', 'trialToPaid',
    'physicalPos', 'eventSales', 'crossSell', 'renewalUpsell', 'recurringRevenueNode',
  ]
  const leadNodeTypes: FunnelNodeType[] = [
    'landingPage', 'emailSequence', 'appointment',
    'leadMagnet', 'quizInteractive', 'applicationPage', 'freeTrialSignup',
    'aiWhatsapp', 'aiWebChat', 'chatbotRules',
  ]

  for (const node of nodes) {
    const result = nodeResults[node.id]
    if (!result) continue

    totalRevenue += result.revenue
    totalCost += result.cost

    if (trafficSourceTypeSet.has(node.data.nodeType)) {
      totalVisitors += result.visitorsConverted
      totalAdSpend += result.cost  // Solo el costo de tráfico cuenta como ad spend para ROAS
    }
    if (leadNodeTypes.includes(node.data.nodeType)) {
      totalLeads += result.leads > 0 ? result.leads : result.visitorsConverted
    }
    if (salesNodeTypes.includes(node.data.nodeType) && result.revenue > 0) {
      totalCustomers += result.visitorsConverted
    }
  }

  // ROAS = Revenue / Ad Spend (no sobre costo total)
  const netProfit = totalRevenue - totalCost
  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0
  const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0
  const cpa = totalCustomers > 0 ? totalCost / totalCustomers : 0
  const cpl = totalLeads > 0 ? totalCost / totalLeads : 0
  const epc = totalVisitors > 0 ? totalRevenue / totalVisitors : 0
  const aov = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  // Break-even: cuántos visitantes necesito para que revenue = cost
  // Asumiendo que el revenue es proporcional a los visitantes
  const revenuePerVisitor = totalVisitors > 0 ? totalRevenue / totalVisitors : 0
  const fixedCostPerVisitor = totalVisitors > 0 ? totalCost / totalVisitors : 0
  const breakEvenVisitors = revenuePerVisitor > fixedCostPerVisitor && revenuePerVisitor > 0
    ? Math.ceil(totalCost / revenuePerVisitor)
    : 0

  return {
    totalRevenue,
    totalCost,
    totalAdSpend,
    netProfit,
    roas,
    roi,
    cpa,
    cpl,
    epc,
    aov,
    totalVisitors,
    totalLeads,
    totalCustomers,
    breakEvenVisitors,
    nodeResults,
  }
}

// ─── Topological order helper ────────────────────────────────────────────────

export function getNodeSimOrder(nodes: FunnelRFNode[], edges: FunnelRFEdge[]): string[] {
  const inDegree: Record<string, number> = {}
  const outgoingEdges: Record<string, FunnelRFEdge[]> = {}

  for (const node of nodes) {
    inDegree[node.id] = 0
    outgoingEdges[node.id] = []
  }
  for (const edge of edges) {
    outgoingEdges[edge.source]?.push(edge)
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
  }

  const sourceTypes = new Set([
    'trafficSource', 'reels', 'organicPost', 'podcast', 'influencer',
    'community', 'pr', 'marketplace', 'qrOffline',
    'linkedinAds', 'twitterAds', 'pinterestAds', 'youtubeAds',
    'paidTraffic', 'organicTraffic', 'trafficEntry',
  ])
  const queue: string[] = []
  for (const node of nodes) {
    if (inDegree[node.id] === 0 || sourceTypes.has(node.data.nodeType)) {
      queue.push(node.id)
    }
  }

  const visited = new Set<string>()
  const order: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    order.push(nodeId)

    for (const edge of (outgoingEdges[nodeId] ?? [])) {
      inDegree[edge.target] = (inDegree[edge.target] ?? 1) - 1
      if (inDegree[edge.target] <= 0 && !visited.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  }

  // Append any unvisited nodes (cycles)
  for (const node of nodes) {
    if (!visited.has(node.id)) order.push(node.id)
  }

  return order
}
