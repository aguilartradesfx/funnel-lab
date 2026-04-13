'use client'

import { useCallback, useState } from 'react'
import { useViewport } from '@xyflow/react'
import { X, Trash2, Copy, Info, ChevronDown, Unlink, Eye, Pencil, ArrowRight, TrendingUp, Users, DollarSign } from 'lucide-react'
import type {
  FunnelNodeType,
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
  PaidTrafficConfig,
  OrganicChannelConfig,
  TrafficEntryConfig,
  TrafficEntrySource,
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
  MetaPixelConfig,
  GoogleTagManagerConfig,
  GoogleAnalyticsConfig,
  MetaOfflineDataConfig,
  UtmTrackingConfig,
  ServerPostbackConfig,
  CrmAttributionConfig,
  HeatmapsConfig,
  CallTrackingConfig,
  ConversionApiConfig,
  DelayConfig,
  ConditionalBranchConfig,
  KpiCheckpointConfig,
  LoopRecurrenceConfig,
  MilestoneNodeConfig,
  FixedCostNodeConfig,
  RecurringRevenueConfig,
  OrganicTrafficConfig,
  PaidSocialConfig,
  NoteConfig,
} from '@/lib/types'
import { computeSourceVisitors, recomputeTrafficEntryTotals } from '@/lib/simulation'
import { NODE_DEFINITIONS, getNodeColor } from '@/lib/nodeDefinitions'
import { useFunnelStore, useSelectedNode } from '@/stores/funnelStore'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

// ─── Componentes de campo ─────────────────────────────────────────────────

interface FieldProps {
  label: string
  tooltip?: string
  benchmark?: string
  children: React.ReactNode
}

function FieldWrapper({ label, tooltip, benchmark, children }: FieldProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <label className="text-[12px] font-medium text-slate-400">{label}</label>
        {(tooltip || benchmark) && (
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
          >
            <Info size={12} />
          </button>
        )}
      </div>
      {showTooltip && (tooltip || benchmark) && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-[11px] text-slate-300 leading-relaxed animate-fade-in">
          {tooltip && <p>{tooltip}</p>}
          {benchmark && (
            <p className="mt-1 text-orange-400 font-medium">
              📊 {benchmark}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

interface NumberInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
}

function NumberInput({ value, onChange, min = 0, max, step = 1, prefix, suffix }: NumberInputProps) {
  return (
    <div className="flex items-center gap-1">
      {prefix && (
        <span className="text-[12px] text-slate-500 font-mono flex-shrink-0 w-4">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="funnel-input text-right font-mono text-sm flex-1"
      />
      {suffix && (
        <span className="text-[12px] text-slate-500 flex-shrink-0">{suffix}</span>
      )}
    </div>
  )
}

interface SliderInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  color?: string
}

function SliderInput({ value, onChange, min = 0, max = 100, step = 0.5, color = '#f97316' }: SliderInputProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <div className="relative h-4 flex items-center">
      <div className="relative w-full h-1.5 rounded-full bg-slate-700">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 pointer-events-none shadow-sm"
          style={{
            left: `calc(${pct}% - 7px)`,
            backgroundColor: color,
            borderColor: '#141414',
          }}
        />
      </div>
    </div>
  )
}

interface SelectInputProps {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}

function SelectInput({ value, onChange, options }: SelectInputProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="funnel-input appearance-none pr-7"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
      />
    </div>
  )
}

function PercentField({
  label, tooltip, benchmark, value, onChange, min = 0, max = 100, step = 0.5,
}: {
  label: string; tooltip?: string; benchmark?: string
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <FieldWrapper label={label} tooltip={tooltip} benchmark={benchmark}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <NumberInput value={value} onChange={onChange} min={min} max={max} step={step} suffix="%" />
        </div>
        <SliderInput value={value} onChange={onChange} min={min} max={max} step={step} />
      </div>
    </FieldWrapper>
  )
}

function CurrencyField({
  label, tooltip, benchmark, value, onChange, min = 0, max, step = 1,
}: {
  label: string; tooltip?: string; benchmark?: string
  value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <FieldWrapper label={label} tooltip={tooltip} benchmark={benchmark}>
      <NumberInput value={value} onChange={onChange} min={min} max={max} step={step} prefix="$" />
    </FieldWrapper>
  )
}

// ─── Selector de producto ─────────────────────────────────────────────────

function ProductSelector({
  productId,
  useManualPrice,
  price,
  onChange,
  priceLabel = 'Precio del producto',
  priceBenchmark,
}: {
  productId?: string
  useManualPrice?: boolean
  price: number
  onChange: (patch: { productId?: string; useManualPrice?: boolean; price?: number }) => void
  priceLabel?: string
  priceBenchmark?: string
}) {
  const products = useFunnelStore(s => s.products)
  const selectedProduct = products.find(p => p.id === productId)
  const isAutoMode = !!selectedProduct && !useManualPrice

  const handleProductChange = (id: string) => {
    if (id === '') {
      onChange({ productId: undefined, useManualPrice: true })
    } else {
      const p = products.find(p => p.id === id)
      if (p) onChange({ productId: id, useManualPrice: false, price: p.price })
    }
  }

  const handleToggleManual = (manual: boolean) => {
    if (!manual && selectedProduct) {
      onChange({ useManualPrice: false, price: selectedProduct.price })
    } else {
      onChange({ useManualPrice: true })
    }
  }

  return (
    <div className="space-y-3">
      {/* Dropdown de producto (solo si hay productos) */}
      {products.length > 0 && (
        <FieldWrapper label="Seleccionar producto">
          <div className="relative">
            <select
              value={productId ?? ''}
              onChange={e => handleProductChange(e.target.value)}
              className="funnel-input appearance-none pr-7"
            >
              <option value="">Sin producto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ${p.price.toLocaleString()}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </FieldWrapper>
      )}

      {/* Toggle precio manual (solo si hay producto seleccionado) */}
      {selectedProduct && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-slate-400">Añadir precio manual</span>
          <button
            onClick={() => handleToggleManual(!useManualPrice)}
            className={cn(
              'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
              useManualPrice ? 'bg-orange-500' : 'bg-slate-700'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
              useManualPrice ? 'translate-x-4' : 'translate-x-0.5'
            )} />
          </button>
        </div>
      )}

      {/* Campo de precio */}
      {isAutoMode ? (
        <FieldWrapper label={priceLabel}>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span className="text-[12px] text-slate-500">$</span>
            <span className="text-[13px] font-mono font-semibold text-emerald-400 flex-1">
              {selectedProduct.price.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-600 italic truncate max-w-[90px]">{selectedProduct.name}</span>
          </div>
        </FieldWrapper>
      ) : (
        <CurrencyField
          label={priceLabel}
          benchmark={priceBenchmark}
          value={price}
          onChange={v => onChange({ price: v })}
        />
      )}
    </div>
  )
}

// ─── Formularios por tipo de nodo ─────────────────────────────────────────

// ─── Traffic Entry ────────────────────────────────────────────────────────────

const PAID_SOURCES = [
  { value: 'facebook_ads',   label: 'Facebook Ads',            emoji: '📘' },
  { value: 'instagram_ads',  label: 'Instagram Ads',           emoji: '📷' },
  { value: 'google_search',  label: 'Google Ads (Search)',     emoji: '🔍' },
  { value: 'google_display', label: 'Google Ads (Display)',    emoji: '🌐' },
  { value: 'google_youtube', label: 'Google Ads (YouTube)',    emoji: '▶️' },
  { value: 'tiktok_ads',     label: 'TikTok Ads',             emoji: '🎵' },
  { value: 'linkedin_ads',   label: 'LinkedIn Ads',            emoji: '💼' },
  { value: 'twitter_ads',    label: 'Twitter/X Ads',           emoji: '𝕏' },
  { value: 'pinterest_ads',  label: 'Pinterest Ads',           emoji: '📌' },
  { value: 'snapchat_ads',   label: 'Snapchat Ads',            emoji: '👻' },
  { value: 'whatsapp_ads',   label: 'WhatsApp Ads',            emoji: '💬' },
  { value: 'bing_ads',       label: 'Bing Ads',                emoji: '🔎' },
  { value: 'email_ads',      label: 'Email Ads',               emoji: '📧' },
  { value: 'video_ads',      label: 'Video Ads',               emoji: '🎬' },
  { value: 'paid_custom',    label: 'Fuente pagada personalizada', emoji: '💰' },
]

const ORGANIC_SOURCES = [
  { value: 'facebook',       label: 'Facebook',                emoji: '📘' },
  { value: 'instagram',      label: 'Instagram',               emoji: '📷' },
  { value: 'tiktok',         label: 'TikTok',                  emoji: '🎵' },
  { value: 'youtube',        label: 'YouTube',                 emoji: '▶️' },
  { value: 'linkedin',       label: 'LinkedIn',                emoji: '💼' },
  { value: 'twitter_x',      label: 'Twitter/X',               emoji: '𝕏' },
  { value: 'pinterest',      label: 'Pinterest',               emoji: '📌' },
  { value: 'snapchat',       label: 'Snapchat',                emoji: '👻' },
  { value: 'whatsapp',       label: 'WhatsApp',                emoji: '💬' },
  { value: 'email',          label: 'Email',                   emoji: '📧' },
  { value: 'blog_seo',       label: 'Blog / SEO',              emoji: '✍️' },
  { value: 'podcast',        label: 'Podcast',                 emoji: '🎙️' },
  { value: 'articles_pr',    label: 'Artículos / PR',          emoji: '📰' },
  { value: 'referrals',      label: 'Referidos',               emoji: '🤝' },
  { value: 'affiliates',     label: 'Afiliados',               emoji: '💎' },
  { value: 'jv_partners',    label: 'JV Partners',             emoji: '🤝' },
  { value: 'community',      label: 'Comunidad / Foro',        emoji: '👥' },
  { value: 'organic_custom', label: 'Fuente orgánica personalizada', emoji: '🌱' },
]

const SOURCE_DEFAULTS: Record<string, Partial<TrafficEntrySource>> = {
  facebook_ads:   { type: 'paid', budget: 500,  costModel: 'cpc', cpc: 0.80, cpm: 8.50,  cpv: 0,    ctr: 1.5 },
  instagram_ads:  { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 1.00, cpm: 9.00,  cpv: 0,    ctr: 1.2 },
  google_search:  { type: 'paid', budget: 500,  costModel: 'cpc', cpc: 2.50, cpm: 0,     cpv: 0,    ctr: 3.5 },
  google_display: { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 0.60, cpm: 3.50,  cpv: 0,    ctr: 0.5 },
  google_youtube: { type: 'paid', budget: 300,  costModel: 'cpv', cpc: 0.10, cpm: 6.00,  cpv: 0.10, ctr: 0.8 },
  tiktok_ads:     { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 0.50, cpm: 6.00,  cpv: 0,    ctr: 1.2 },
  linkedin_ads:   { type: 'paid', budget: 500,  costModel: 'cpc', cpc: 5.00, cpm: 30.00, cpv: 0,    ctr: 0.8 },
  twitter_ads:    { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 1.50, cpm: 6.50,  cpv: 0,    ctr: 1.0 },
  pinterest_ads:  { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 1.00, cpm: 5.00,  cpv: 0,    ctr: 1.5 },
  snapchat_ads:   { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 0.80, cpm: 5.00,  cpv: 0,    ctr: 1.0 },
  whatsapp_ads:   { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 0.50, cpm: 5.00,  cpv: 0,    ctr: 2.0 },
  bing_ads:       { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 1.50, cpm: 4.00,  cpv: 0,    ctr: 2.5 },
  email_ads:      { type: 'paid', budget: 200,  costModel: 'cpc', cpc: 0.30, cpm: 5.00,  cpv: 0,    ctr: 2.0 },
  video_ads:      { type: 'paid', budget: 300,  costModel: 'cpv', cpc: 0.10, cpm: 8.00,  cpv: 0.10, ctr: 1.0 },
  paid_custom:    { type: 'paid', budget: 300,  costModel: 'cpc', cpc: 1.00, cpm: 8.00,  cpv: 0,    ctr: 1.5 },
  facebook:       { type: 'organic', reach: 5000,  ctr: 1.5, engagementRate: 2.0 },
  instagram:      { type: 'organic', reach: 10000, ctr: 2.0, engagementRate: 3.5 },
  tiktok:         { type: 'organic', reach: 15000, ctr: 1.8, engagementRate: 6.0 },
  youtube:        { type: 'organic', reach: 8000,  ctr: 3.0, engagementRate: 4.0 },
  linkedin:       { type: 'organic', reach: 3000,  ctr: 2.5, engagementRate: 2.5 },
  twitter_x:      { type: 'organic', reach: 5000,  ctr: 1.5, engagementRate: 2.0 },
  pinterest:      { type: 'organic', reach: 6000,  ctr: 1.5, engagementRate: 2.0 },
  snapchat:       { type: 'organic', reach: 3000,  ctr: 1.0, engagementRate: 2.0 },
  whatsapp:       { type: 'organic', reach: 500,   ctr: 15,  engagementRate: 0   },
  email:          { type: 'organic', listSize: 5000, openRate: 25, ctr: 3.0 },
  blog_seo:       { type: 'organic', reach: 5000 },
  podcast:        { type: 'organic', reach: 2000,  ctr: 5.0, engagementRate: 0   },
  articles_pr:    { type: 'organic', reach: 3000,  ctr: 2.0, engagementRate: 0   },
  referrals:      { type: 'organic', activeReferrers: 10, referralsPerReferrer: 3, referralConversionRate: 20 },
  affiliates:     { type: 'organic', activeReferrers: 5,  referralsPerReferrer: 10, referralConversionRate: 15 },
  jv_partners:    { type: 'organic', activeReferrers: 3,  referralsPerReferrer: 20, referralConversionRate: 20 },
  community:      { type: 'organic', reach: 2000,  ctr: 5.0, engagementRate: 5.0 },
  organic_custom: { type: 'organic', reach: 3000,  ctr: 2.0, engagementRate: 3.0 },
}

function makeNewSource(sourceKey: string, name: string): TrafficEntrySource {
  const defaults = SOURCE_DEFAULTS[sourceKey] ?? { type: 'paid', budget: 300, costModel: 'cpc', cpc: 1.0, ctr: 1.5 }
  const base: TrafficEntrySource = {
    id: Math.random().toString(36).slice(2),
    name,
    source: sourceKey,
    type: defaults.type ?? 'paid',
    budget: defaults.budget,
    costModel: defaults.costModel,
    cpc: defaults.cpc,
    cpm: defaults.cpm,
    cpv: defaults.cpv,
    ctr: defaults.ctr,
    reach: defaults.reach,
    engagementRate: defaults.engagementRate,
    listSize: defaults.listSize,
    openRate: defaults.openRate,
    activeReferrers: defaults.activeReferrers,
    referralsPerReferrer: defaults.referralsPerReferrer,
    referralConversionRate: defaults.referralConversionRate,
    visitors: 0,
  }
  base.visitors = computeSourceVisitors(base)
  return base
}

function SourceForm({
  source,
  onSave,
  onCancel,
}: {
  source: TrafficEntrySource
  onSave: (s: TrafficEntrySource) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<TrafficEntrySource>(source)

  const update = (patch: Partial<TrafficEntrySource>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch }
      next.visitors = computeSourceVisitors(next)
      return next
    })
  }

  const handleSourceChange = (src: string) => {
    const defaults = SOURCE_DEFAULTS[src] ?? {}
    const isOrganic = ORGANIC_SOURCES.some(o => o.value === src)
    const next: TrafficEntrySource = {
      ...draft,
      source: src,
      type: isOrganic ? 'organic' : 'paid',
      ...defaults,
    }
    next.visitors = computeSourceVisitors(next)
    setDraft(next)
  }

  const allSources = [...PAID_SOURCES, ...ORGANIC_SOURCES]
  const isPaid = draft.type === 'paid'
  const src = draft.source
  const isEmail = src === 'email'
  const isReferral = ['referrals', 'affiliates', 'jv_partners'].includes(src)
  const isBlog = src === 'blog_seo'

  return (
    <div className="space-y-3">
      {/* Nombre */}
      <FieldWrapper label="Nombre de la campaña">
        <input
          type="text"
          value={draft.name}
          onChange={e => update({ name: e.target.value })}
          className="funnel-input"
          placeholder="Ej: Facebook Q1"
        />
      </FieldWrapper>

      {/* Fuente */}
      <FieldWrapper label="Fuente de tráfico">
        <div className="relative">
          <select
            value={draft.source}
            onChange={e => handleSourceChange(e.target.value)}
            className="funnel-input appearance-none pr-7"
          >
            <optgroup label="─── Tráfico Pagado ───">
              {PAID_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
              ))}
            </optgroup>
            <optgroup label="─── Tráfico Orgánico ───">
              {ORGANIC_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </FieldWrapper>

      {isPaid && (
        <>
          <CurrencyField label="Presupuesto mensual" value={draft.budget ?? 0} onChange={v => update({ budget: v })} min={0} step={100} />
          <FieldWrapper label="Modelo de costo">
            <SelectInput
              value={draft.costModel ?? 'cpc'}
              onChange={v => update({ costModel: v as TrafficEntrySource['costModel'] })}
              options={[
                { value: 'cpc', label: 'CPC — Costo por clic' },
                { value: 'cpm', label: 'CPM — Costo por mil impresiones' },
                { value: 'cpv', label: 'CPV — Costo por vista' },
              ]}
            />
          </FieldWrapper>
          {draft.costModel === 'cpc' && (
            <CurrencyField label="Costo por clic (CPC)" value={draft.cpc ?? 0} onChange={v => update({ cpc: v })} min={0.01} step={0.01} />
          )}
          {draft.costModel === 'cpm' && (
            <>
              <CurrencyField label="CPM" value={draft.cpm ?? 0} onChange={v => update({ cpm: v })} min={0.1} step={0.5} />
              <PercentField label="CTR (%)" value={draft.ctr ?? 0} onChange={v => update({ ctr: v })} min={0.1} max={20} step={0.1} />
            </>
          )}
          {draft.costModel === 'cpv' && (
            <>
              <CurrencyField label="Costo por vista (CPV)" value={draft.cpv ?? 0} onChange={v => update({ cpv: v })} min={0.01} step={0.01} />
              <PercentField label="CTR (%)" value={draft.ctr ?? 0} onChange={v => update({ ctr: v })} min={0.1} max={20} step={0.1} />
            </>
          )}
        </>
      )}

      {!isPaid && isEmail && (
        <>
          <FieldWrapper label="Tamaño de lista" tooltip="Suscriptores totales">
            <NumberInput value={draft.listSize ?? 0} onChange={v => update({ listSize: v })} min={0} step={100} />
          </FieldWrapper>
          <PercentField label="Open rate" value={draft.openRate ?? 0} onChange={v => update({ openRate: v })} />
          <PercentField label="CTR en el email" value={draft.ctr ?? 0} onChange={v => update({ ctr: v })} />
        </>
      )}

      {!isPaid && isReferral && (
        <>
          <FieldWrapper label={src === 'affiliates' ? 'Afiliados activos' : 'Referidores activos'}>
            <NumberInput value={draft.activeReferrers ?? 0} onChange={v => update({ activeReferrers: v })} min={0} step={1} />
          </FieldWrapper>
          <FieldWrapper label={src === 'affiliates' ? 'Conversiones por afiliado' : 'Referidos por persona'}>
            <NumberInput value={draft.referralsPerReferrer ?? 0} onChange={v => update({ referralsPerReferrer: v })} min={0} step={1} />
          </FieldWrapper>
          <PercentField label="Tasa de conversión" value={draft.referralConversionRate ?? 0} onChange={v => update({ referralConversionRate: v })} />
        </>
      )}

      {!isPaid && isBlog && (
        <FieldWrapper label="Visitas mensuales (SEO)" tooltip="Visitantes orgánicos directos">
          <NumberInput value={draft.reach ?? 0} onChange={v => update({ reach: v })} min={0} step={100} />
        </FieldWrapper>
      )}

      {!isPaid && !isEmail && !isReferral && !isBlog && (
        <>
          <FieldWrapper label="Alcance mensual" tooltip="Impresiones o reproducciones estimadas">
            <NumberInput value={draft.reach ?? 0} onChange={v => update({ reach: v })} min={0} step={1000} />
          </FieldWrapper>
          <PercentField label="CTR a link / CTA" value={draft.ctr ?? 0} onChange={v => update({ ctr: v })} max={50} step={0.1} />
        </>
      )}

      {/* Visitantes estimados */}
      <FieldWrapper label="Visitantes estimados / mes">
        <NumberInput value={draft.visitors} onChange={v => setDraft(prev => ({ ...prev, visitors: v }))} min={0} step={10} />
      </FieldWrapper>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(draft)}
          className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-[12px] font-semibold transition-colors"
        >
          Guardar fuente
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[12px] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function TrafficEntryForm({ config, onChange }: { config: TrafficEntryConfig; onChange: (c: Partial<TrafficEntryConfig>) => void }) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const sources = config.sources ?? []

  const openAdd = () => {
    setEditingIndex(null)
    setView('form')
  }

  const openEdit = (index: number) => {
    setEditingIndex(index)
    setView('form')
  }

  const handleSave = (saved: TrafficEntrySource) => {
    let newSources: TrafficEntrySource[]
    if (editingIndex === null) {
      newSources = [...sources, saved]
    } else {
      newSources = sources.map((s, i) => i === editingIndex ? saved : s)
    }
    const updated = recomputeTrafficEntryTotals({ ...config, sources: newSources })
    onChange(updated)
    setView('list')
    setEditingIndex(null)
  }

  const handleDelete = (index: number) => {
    const newSources = sources.filter((_, i) => i !== index)
    const updated = recomputeTrafficEntryTotals({ ...config, sources: newSources })
    onChange(updated)
  }

  const handleDuplicate = (index: number) => {
    const orig = sources[index]
    const dup: TrafficEntrySource = {
      ...orig,
      id: Math.random().toString(36).slice(2),
      name: `${orig.name} (copia)`,
    }
    const newSources = [...sources.slice(0, index + 1), dup, ...sources.slice(index + 1)]
    const updated = recomputeTrafficEntryTotals({ ...config, sources: newSources })
    onChange(updated)
  }

  const defaultSource = makeNewSource('facebook_ads', 'Facebook Ads')

  if (view === 'form') {
    const editing = editingIndex !== null ? sources[editingIndex] : defaultSource
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => { setView('list'); setEditingIndex(null) }} className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowRight size={14} className="rotate-180" />
          </button>
          <span className="text-[12px] font-semibold text-slate-300">
            {editingIndex !== null ? 'Editar fuente' : 'Agregar fuente'}
          </span>
        </div>
        <SourceForm
          source={editing}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditingIndex(null) }}
        />
      </div>
    )
  }

  // List view
  const paidSources = sources.filter(s => s.type === 'paid')
  const organicSources = sources.filter(s => s.type === 'organic')
  const allSources = [...PAID_SOURCES, ...ORGANIC_SOURCES]

  return (
    <div className="space-y-4">
      {/* Nombre del entry */}
      <FieldWrapper label="Nombre del grupo">
        <input
          type="text"
          value={config.name ?? 'Fuente de tráfico'}
          onChange={e => onChange({ name: e.target.value })}
          className="funnel-input"
          placeholder="Ej: Tráfico frío, Retargeting..."
        />
      </FieldWrapper>

      {/* Lista de fuentes */}
      {sources.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-[12px] text-slate-500">Sin fuentes aún.</p>
          <p className="text-[11px] text-slate-600">Agregá al menos una fuente de tráfico.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((src, i) => {
            const meta = allSources.find(s => s.value === src.source)
            return (
              <div
                key={src.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/40"
              >
                <span className="text-[15px] flex-shrink-0 mt-0.5">{meta?.emoji ?? (src.type === 'paid' ? '💰' : '🌱')}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-slate-200 truncate">{src.name}</span>
                    <span className={cn(
                      'text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                      src.type === 'paid'
                        ? 'bg-orange-950 text-orange-400'
                        : 'bg-emerald-950 text-emerald-400'
                    )}>
                      {src.type === 'paid' ? 'Pagado' : 'Orgánico'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400 font-mono">{(src.visitors ?? 0).toLocaleString()} visitas</span>
                    {src.type === 'paid' && src.budget && (
                      <span className="text-[11px] text-slate-600">${src.budget.toLocaleString()}/mes</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(i)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => handleDuplicate(i)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    <Copy size={11} />
                  </button>
                  <button onClick={() => handleDelete(i)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón agregar */}
      <button
        onClick={openAdd}
        className="w-full py-2 rounded-lg border border-dashed border-slate-600 hover:border-orange-500/50 hover:bg-orange-500/5 text-slate-500 hover:text-orange-400 text-[12px] transition-all flex items-center justify-center gap-1.5"
      >
        <Users size={12} />
        + Agregar fuente
      </button>

      {/* Totales */}
      {sources.length > 0 && (
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 space-y-1.5">
          {paidSources.length > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-500">Visitas pagadas</span>
              <span className="text-[11px] font-mono text-orange-300">{(config.totalPaidVisitors ?? 0).toLocaleString()}</span>
            </div>
          )}
          {organicSources.length > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-500">Visitas orgánicas</span>
              <span className="text-[11px] font-mono text-emerald-300">{(config.totalOrganicVisitors ?? 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-700/50 pt-1.5 mt-1">
            <span className="text-[12px] font-semibold text-slate-300">Total visitas</span>
            <span className="text-[12px] font-bold font-mono text-slate-100">{(config.totalVisitors ?? 0).toLocaleString()}</span>
          </div>
          {(config.totalBudget ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-500">Budget total</span>
              <span className="text-[11px] font-mono text-slate-300">${(config.totalBudget ?? 0).toLocaleString()}/mes</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Defaults inteligentes por plataforma (tráfico pagado) ───────────────────

const PAID_PLATFORM_DEFAULTS: Record<string, { cpc: number; cpm: number; cpv: number; ctr: number; costModel: 'cpc' | 'cpm' | 'cpv' }> = {
  meta:          { cpc: 0.80, cpm: 8.50,  cpv: 0.10, ctr: 1.5, costModel: 'cpc' },
  googleSearch:  { cpc: 2.50, cpm: 0,     cpv: 0.10, ctr: 3.5, costModel: 'cpc' },
  googleDisplay: { cpc: 0.60, cpm: 3.50,  cpv: 0.10, ctr: 0.5, costModel: 'cpc' },
  youtube:       { cpc: 0.10, cpm: 6.00,  cpv: 0.10, ctr: 0.8, costModel: 'cpv' },
  tiktok:        { cpc: 0.50, cpm: 6.00,  cpv: 0.10, ctr: 1.2, costModel: 'cpc' },
  linkedin:      { cpc: 5.00, cpm: 30.00, cpv: 0.10, ctr: 0.8, costModel: 'cpc' },
  twitter:       { cpc: 1.50, cpm: 6.50,  cpv: 0.10, ctr: 1.0, costModel: 'cpc' },
  pinterest:     { cpc: 1.00, cpm: 5.00,  cpv: 0.10, ctr: 1.5, costModel: 'cpc' },
  other:         { cpc: 1.00, cpm: 8.00,  cpv: 0.10, ctr: 1.5, costModel: 'cpc' },
}

const ORGANIC_CHANNEL_DEFAULTS: Record<string, { reach: number; ctr: number; engagementRate: number }> = {
  instagram:  { reach: 10000, ctr: 2.0, engagementRate: 3.5 },
  facebook:   { reach: 5000,  ctr: 1.5, engagementRate: 2.0 },
  tiktok:     { reach: 15000, ctr: 1.8, engagementRate: 6.0 },
  youtube:    { reach: 8000,  ctr: 3.0, engagementRate: 4.0 },
  linkedin:   { reach: 3000,  ctr: 2.5, engagementRate: 2.5 },
  blog:       { reach: 5000,  ctr: 100, engagementRate: 0   },
  podcast:    { reach: 2000,  ctr: 5.0, engagementRate: 0   },
  pinterest:  { reach: 6000,  ctr: 1.5, engagementRate: 2.0 },
  emailList:  { reach: 0,     ctr: 3.0, engagementRate: 0   },
  whatsapp:   { reach: 500,   ctr: 15,  engagementRate: 0   },
  community:  { reach: 2000,  ctr: 5.0, engagementRate: 5.0 },
  referrals:  { reach: 0,     ctr: 0,   engagementRate: 0   },
  other:      { reach: 3000,  ctr: 2.0, engagementRate: 3.0 },
}

function PaidTrafficForm({ config, onChange }: { config: PaidTrafficConfig; onChange: (c: Partial<PaidTrafficConfig>) => void }) {
  const handlePlatformChange = (platform: PaidTrafficConfig['platform']) => {
    const defaults = PAID_PLATFORM_DEFAULTS[platform] ?? PAID_PLATFORM_DEFAULTS.other
    onChange({ platform, ...defaults })
  }

  return (
    <div className="space-y-4">
      <FieldWrapper label="Plataforma">
        <SelectInput
          value={config.platform}
          onChange={v => handlePlatformChange(v as PaidTrafficConfig['platform'])}
          options={NODE_DEFINITIONS.paidTraffic.fields.find(f => f.key === 'platform')?.options ?? []}
        />
      </FieldWrapper>

      {config.platform === 'other' && (
        <FieldWrapper label="Nombre de la plataforma">
          <input
            type="text"
            value={config.platformLabel ?? ''}
            onChange={e => onChange({ platformLabel: e.target.value })}
            className="funnel-input"
            placeholder="Ej: Snapchat, Reddit..."
          />
        </FieldWrapper>
      )}

      <FieldWrapper label="Modelo de costo">
        <SelectInput
          value={config.costModel}
          onChange={v => onChange({ costModel: v as PaidTrafficConfig['costModel'] })}
          options={NODE_DEFINITIONS.paidTraffic.fields.find(f => f.key === 'costModel')?.options ?? []}
        />
      </FieldWrapper>

      <CurrencyField
        label="Presupuesto mensual"
        tooltip="Inversión mensual en publicidad"
        benchmark="Mínimo recomendado: $300-500/mes"
        value={config.budget}
        onChange={v => onChange({ budget: v })}
        min={0} step={100}
      />

      {config.costModel === 'cpc' && (
        <CurrencyField
          label="CPC (costo por clic)"
          tooltip="Cuánto pagás por cada clic en tu anuncio"
          benchmark="Meta: $0.80 | Google Search: $2.50 | TikTok: $0.50 | LinkedIn: $5.00"
          value={config.cpc}
          onChange={v => onChange({ cpc: v })}
          min={0.01} step={0.01}
        />
      )}

      {config.costModel === 'cpm' && (
        <>
          <CurrencyField
            label="CPM (costo por mil impresiones)"
            tooltip="Costo por cada 1,000 impresiones de tu anuncio"
            benchmark="Meta: $8.50 | TikTok: $6.00 | LinkedIn: $30.00 | Pinterest: $5.00"
            value={config.cpm}
            onChange={v => onChange({ cpm: v })}
            min={0.1} step={0.5}
          />
          <PercentField
            label="CTR (tasa de clics)"
            tooltip="Porcentaje de impresiones que generan un clic"
            benchmark="Meta: 1.5% | Google Display: 0.5% | TikTok: 1.2%"
            value={config.ctr}
            onChange={v => onChange({ ctr: v })}
            min={0.1} max={20} step={0.1}
          />
        </>
      )}

      {config.costModel === 'cpv' && (
        <>
          <CurrencyField
            label="CPV (costo por vista)"
            tooltip="Cuánto pagás por cada vista del video"
            benchmark="YouTube: $0.10 promedio"
            value={config.cpv}
            onChange={v => onChange({ cpv: v })}
            min={0.01} step={0.01}
          />
          <PercentField
            label="CTR (vistas que hacen clic)"
            tooltip="Porcentaje de espectadores que hacen clic al CTA del video"
            benchmark="YouTube: 0.8% promedio"
            value={config.ctr}
            onChange={v => onChange({ ctr: v })}
            min={0.1} max={20} step={0.1}
          />
        </>
      )}

      {/* Preview de visitas estimadas */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 space-y-1">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide">Visitas estimadas</p>
        <p className="text-[18px] font-mono font-bold text-orange-400">
          {(() => {
            if (config.costModel === 'cpc') return Math.floor((config.budget ?? 0) / (config.cpc || 1)).toLocaleString()
            if (config.costModel === 'cpm') return Math.floor(((config.budget / (config.cpm || 1)) * 1000) * ((config.ctr || 0) / 100)).toLocaleString()
            if (config.costModel === 'cpv') return Math.floor((config.budget / (config.cpv || 1)) * ((config.ctr || 0) / 100)).toLocaleString()
            return '0'
          })()}
        </p>
        <p className="text-[11px] text-slate-600">visitantes / mes</p>
      </div>
    </div>
  )
}

function OrganicTrafficForm({ config, onChange }: { config: OrganicChannelConfig; onChange: (c: Partial<OrganicChannelConfig>) => void }) {
  const handleChannelChange = (channel: OrganicChannelConfig['channel']) => {
    const defaults = ORGANIC_CHANNEL_DEFAULTS[channel] ?? ORGANIC_CHANNEL_DEFAULTS.other
    onChange({ channel, reach: defaults.reach, ctr: defaults.ctr, engagementRate: defaults.engagementRate })
  }

  const isEmailList = config.channel === 'emailList'
  const isReferrals = config.channel === 'referrals'
  const isBlog = config.channel === 'blog'

  return (
    <div className="space-y-4">
      <FieldWrapper label="Canal">
        <SelectInput
          value={config.channel}
          onChange={v => handleChannelChange(v as OrganicChannelConfig['channel'])}
          options={NODE_DEFINITIONS.organicTraffic.fields.find(f => f.key === 'channel')?.options ?? []}
        />
      </FieldWrapper>

      {config.channel === 'other' && (
        <FieldWrapper label="Nombre del canal">
          <input
            type="text"
            value={config.channelLabel ?? ''}
            onChange={e => onChange({ channelLabel: e.target.value })}
            className="funnel-input"
            placeholder="Ej: Snapchat, Twitch..."
          />
        </FieldWrapper>
      )}

      {isEmailList ? (
        <>
          <FieldWrapper label="Tamaño de la lista" tooltip="Cantidad de suscriptores en tu lista de email" benchmark="Lista activa media: 1,000-10,000 suscriptores">
            <NumberInput value={config.listSize} onChange={v => onChange({ listSize: v })} min={0} step={100} />
          </FieldWrapper>
          <PercentField
            label="Open rate"
            tooltip="Porcentaje de suscriptores que abren tus emails"
            benchmark="LATAM promedio: 22-32%"
            value={config.openRate}
            onChange={v => onChange({ openRate: v })}
          />
          <PercentField
            label="CTR (clic en el email)"
            tooltip="Porcentaje de aperturas que generan un clic al link"
            benchmark="Promedio: 2-5%"
            value={config.ctr}
            onChange={v => onChange({ ctr: v })}
          />
        </>
      ) : isReferrals ? (
        <>
          <FieldWrapper label="Referidores activos" tooltip="Personas que están activamente refiriendo">
            <NumberInput value={config.activeReferrers} onChange={v => onChange({ activeReferrers: v })} min={0} step={1} />
          </FieldWrapper>
          <FieldWrapper label="Referidos por referidor" tooltip="Promedio de personas que cada referidor trae por mes">
            <NumberInput value={config.referralsPerReferrer} onChange={v => onChange({ referralsPerReferrer: v })} min={0} step={1} />
          </FieldWrapper>
          <PercentField
            label="Conversión del referido"
            tooltip="Porcentaje de referidos que se convierten en visitantes del funnel"
            value={config.referralConversionRate}
            onChange={v => onChange({ referralConversionRate: v })}
          />
        </>
      ) : isBlog ? (
        <FieldWrapper label="Visitas mensuales (SEO)" tooltip="Visitantes orgánicos directos desde búsquedas y artículos" benchmark="Blog nuevo: 500-2K/mes | Blog establecido: 5K-50K/mes">
          <NumberInput value={config.reach} onChange={v => onChange({ reach: v })} min={0} step={100} />
        </FieldWrapper>
      ) : (
        <>
          <FieldWrapper label="Alcance mensual" tooltip="Impresiones o reproducciones estimadas por mes" benchmark="Instagram Reels: 10K | TikTok: 15K | YouTube: 8K | LinkedIn: 3K">
            <NumberInput value={config.reach} onChange={v => onChange({ reach: v })} min={0} step={1000} />
          </FieldWrapper>
          <PercentField
            label="Engagement rate"
            tooltip="Porcentaje del alcance que interactúa con el contenido"
            benchmark="Instagram: 2-5% | TikTok: 5-9% | LinkedIn: 1-3%"
            value={config.engagementRate}
            onChange={v => onChange({ engagementRate: v })}
          />
          <PercentField
            label="CTR a link / perfil"
            tooltip="Porcentaje del alcance que hace clic al link en bio o CTA"
            benchmark="Instagram: 2% | TikTok: 1.8% | YouTube: 3% | Podcast: 5%"
            value={config.ctr}
            onChange={v => onChange({ ctr: v })}
            max={50} step={0.1}
          />
        </>
      )}

      {/* Preview de visitas estimadas */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 space-y-1">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide">Visitas estimadas</p>
        <p className="text-[18px] font-mono font-bold text-emerald-400">
          {(() => {
            if (isEmailList) return Math.floor((config.listSize ?? 0) * ((config.openRate ?? 0) / 100) * ((config.ctr ?? 0) / 100)).toLocaleString()
            if (isReferrals) return Math.floor((config.activeReferrers ?? 0) * (config.referralsPerReferrer ?? 0) * ((config.referralConversionRate ?? 0) / 100)).toLocaleString()
            if (isBlog) return (config.reach ?? 0).toLocaleString()
            return Math.floor((config.reach ?? 0) * ((config.ctr ?? 0) / 100)).toLocaleString()
          })()}
        </p>
        <p className="text-[11px] text-slate-600">visitantes / mes</p>
      </div>
    </div>
  )
}

function TrafficSourceForm({ config, onChange }: { config: TrafficSourceConfig; onChange: (c: Partial<TrafficSourceConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Plataforma">
        <SelectInput
          value={config.platform}
          onChange={v => onChange({ platform: v as TrafficSourceConfig['platform'] })}
          options={NODE_DEFINITIONS.trafficSource.fields.find(f => f.key === 'platform')?.options ?? []}
        />
      </FieldWrapper>
      <FieldWrapper label="Modelo de costo">
        <SelectInput
          value={config.costModel}
          onChange={v => onChange({ costModel: v as TrafficSourceConfig['costModel'] })}
          options={NODE_DEFINITIONS.trafficSource.fields.find(f => f.key === 'costModel')?.options ?? []}
        />
      </FieldWrapper>
      {config.costModel === 'organic' ? (
        <FieldWrapper
          label="Visitantes mensuales"
          tooltip="Visitantes orgánicos estimados por mes"
          benchmark="Depende del SEO, redes sociales y autoridad del sitio"
        >
          <NumberInput value={config.monthlyVisitors} onChange={v => onChange({ monthlyVisitors: v })} min={0} step={100} />
        </FieldWrapper>
      ) : (
        <>
          <CurrencyField
            label="Presupuesto mensual"
            tooltip="Cuánto invertís por mes en esta fuente de tráfico"
            benchmark="Presupuesto mínimo recomendado para Facebook: $300-500/mes"
            value={config.budget}
            onChange={v => onChange({ budget: v })}
            min={0} step={100}
          />
          {config.costModel === 'cpc' ? (
            <CurrencyField
              label="CPC (costo por clic)"
              tooltip="Costo promedio por cada clic en tu anuncio"
              benchmark="Facebook: $0.30-$1.50 | Google: $0.50-$5.00 | TikTok: $0.20-$1.00"
              value={config.cpc}
              onChange={v => onChange({ cpc: v })}
              min={0.01} step={0.01}
            />
          ) : (
            <>
              <CurrencyField
                label="CPM (costo por mil impresiones)"
                tooltip="Costo por cada 1,000 impresiones de tu anuncio"
                benchmark="Facebook: $8-15 | Instagram: $10-20 | TikTok: $6-12"
                value={config.cpm}
                onChange={v => onChange({ cpm: v })}
                min={0.1} step={0.5}
              />
              <PercentField
                label="CTR (tasa de clics)"
                tooltip="Porcentaje de personas que hacen clic al ver tu anuncio"
                benchmark="Facebook: 1-3% | Google Search: 3-7% | TikTok: 1-2%"
                value={config.ctr}
                onChange={v => onChange({ ctr: v })}
                min={0.1} max={30} step={0.1}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

function LandingPageForm({ config, onChange }: { config: LandingPageConfig; onChange: (c: Partial<LandingPageConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de conversión"
        tooltip="Porcentaje de visitantes que completan el formulario / se suscriben"
        benchmark="Promedio: 20-40% | Top performers: 50-70%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <PercentField
        label="Tasa de rebote"
        tooltip="Porcentaje de visitantes que salen sin interactuar (informativo)"
        benchmark="Promedio: 50-70% | Bueno: menos de 40%"
        value={config.bounceRate}
        onChange={v => onChange({ bounceRate: v })}
      />
    </div>
  )
}

function SalesPageForm({ config, onChange }: { config: SalesPageConfig; onChange: (c: Partial<SalesPageConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de conversión"
        tooltip="Porcentaje de visitantes que compran en esta página"
        benchmark="Sales pages: 1-5% | Con video: 3-8% | Alta ticket: 1-2%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
        max={30} step={0.1}
      />
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<SalesPageConfig>)}
        priceLabel="Precio del producto"
        priceBenchmark="Infoproductos: $27-$497 | Software: $37-$197/mes"
      />
    </div>
  )
}

function CheckoutForm({ config, onChange }: { config: CheckoutConfig; onChange: (c: Partial<CheckoutConfig>) => void }) {
  return (
    <div className="space-y-4">
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<CheckoutConfig>)}
        priceLabel="Precio del producto"
      />
      <PercentField
        label="Tasa de abandono"
        tooltip="Porcentaje que llega al checkout pero no paga"
        benchmark="E-commerce promedio: 65-75% | Con recuperación: 50-60%"
        value={config.abandonmentRate}
        onChange={v => onChange({ abandonmentRate: v })}
      />
      <PercentField
        label="Comisión del procesador"
        tooltip="Porcentaje que cobra Stripe, PayPal, etc."
        benchmark="Stripe: 2.9% | PayPal: 3.5% | Hotmart: 9.9%"
        value={config.processorFee}
        onChange={v => onChange({ processorFee: v })}
        max={20} step={0.1}
      />
    </div>
  )
}

function UpsellForm({ config, onChange }: { config: UpsellConfig; onChange: (c: Partial<UpsellConfig>) => void }) {
  return (
    <div className="space-y-4">
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<UpsellConfig>)}
        priceLabel="Precio del upsell"
        priceBenchmark="Típico: 2-3x el precio principal"
      />
      <PercentField label="Tasa de aceptación" tooltip="% de compradores que aceptan" benchmark="Promedio: 15-35% | Con video: 25-40%" value={config.acceptanceRate} onChange={v => onChange({ acceptanceRate: v })} />
    </div>
  )
}

function DownsellForm({ config, onChange }: { config: DownsellConfig; onChange: (c: Partial<DownsellConfig>) => void }) {
  return (
    <div className="space-y-4">
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<DownsellConfig>)}
        priceLabel="Precio del downsell"
        priceBenchmark="Típico: 1/3 a 1/2 del upsell rechazado"
      />
      <PercentField label="Tasa de aceptación" tooltip="% que acepta la oferta alternativa" benchmark="Promedio: 25-45%" value={config.acceptanceRate} onChange={v => onChange({ acceptanceRate: v })} />
    </div>
  )
}

function OrderBumpForm({ config, onChange }: { config: OrderBumpConfig; onChange: (c: Partial<OrderBumpConfig>) => void }) {
  return (
    <div className="space-y-4">
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<OrderBumpConfig>)}
        priceLabel="Precio del order bump"
        priceBenchmark="Típico: $7-$67. Bajo precio, alta percepción de valor"
      />
      <PercentField label="Tasa de aceptación" tooltip="% de compradores que marcan el checkbox" benchmark="Promedio: 20-40%" value={config.acceptanceRate} onChange={v => onChange({ acceptanceRate: v })} />
    </div>
  )
}

function EmailSequenceForm({ config, onChange }: { config: EmailSequenceConfig; onChange: (c: Partial<EmailSequenceConfig>) => void }) {
  const mode = config.mode ?? 'sequence'
  const isSequence = mode === 'sequence'

  return (
    <div className="space-y-4">
      {/* Toggle de modo */}
      <div className="flex rounded-lg overflow-hidden border border-slate-700 text-[11px] font-semibold">
        <button
          onClick={() => onChange({ mode: 'sequence' })}
          className={cn(
            'flex-1 py-2 transition-colors',
            isSequence
              ? 'bg-orange-500/15 text-orange-400 border-r border-orange-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-r border-slate-700'
          )}
        >
          Secuencia completa
        </button>
        <button
          onClick={() => onChange({ mode: 'single' })}
          className={cn(
            'flex-1 py-2 transition-colors',
            !isSequence
              ? 'bg-orange-500/15 text-orange-400'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          Email individual
        </button>
      </div>

      {/* Descripción del modo */}
      <p className="text-[11px] text-slate-600 leading-relaxed -mt-1">
        {isSequence
          ? 'Un nodo representa toda la secuencia automatizada.'
          : 'Cada nodo es un email puntual — encadená varios para parametrizar cada uno por separado.'}
      </p>

      {/* Asunto del email (solo en modo single) */}
      {!isSequence && (
        <FieldWrapper label="Asunto / nombre del email">
          <input
            type="text"
            value={config.subject ?? ''}
            onChange={e => onChange({ subject: e.target.value })}
            className="funnel-input"
            placeholder="Ej: Email 1 — Bienvenida"
          />
        </FieldWrapper>
      )}

      {/* Cantidad de emails (solo en modo sequence) */}
      {isSequence && (
        <FieldWrapper label="Cantidad de emails" tooltip="Número de emails en la secuencia" benchmark="Típico: 5-14 emails | Welcome series: 3-5">
          <NumberInput value={config.emails} onChange={v => onChange({ emails: v })} min={1} max={100} step={1} />
        </FieldWrapper>
      )}

      <PercentField
        label="Tasa de apertura"
        tooltip={isSequence
          ? '% de suscriptores que abren cada email de la secuencia'
          : '% de destinatarios que abren el email — determina cuántas personas pasan al siguiente paso'}
        benchmark="Promedio: 20-30% | Lista caliente: 30-50%"
        value={config.openRate}
        onChange={v => onChange({ openRate: v })}
      />
      <PercentField
        label="CTR (clic en el link)"
        tooltip={isSequence
          ? '% de aperturas que hacen clic — se combina con el open rate en la fórmula acumulada'
          : '% de los que abrieron que hacen clic (métrica informativa)'}
        benchmark="Promedio: 2-5% | Segmentado: 10-20%"
        value={config.ctr}
        onChange={v => onChange({ ctr: v })}
        max={50} step={0.1}
      />
      {isSequence && (
        <PercentField
          label="Conversión de la secuencia"
          tooltip="% de quienes clickearon que terminan comprando (referencia — la conversión real ocurre en el nodo de checkout)"
          benchmark="Promedio: 2-8%"
          value={config.conversionRate}
          onChange={v => onChange({ conversionRate: v })}
          max={50} step={0.1}
        />
      )}
    </div>
  )
}

function WhatsAppSmsForm({ config, onChange }: { config: WhatsAppSmsConfig; onChange: (c: Partial<WhatsAppSmsConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de entrega" benchmark="WhatsApp: 90-98% | SMS: 85-95%" value={config.deliveryRate} onChange={v => onChange({ deliveryRate: v })} />
      <PercentField label="Tasa de respuesta" benchmark="WhatsApp: 35-60% | SMS: 20-40%" value={config.responseRate} onChange={v => onChange({ responseRate: v })} />
      <PercentField label="Tasa de conversión" benchmark="10-30% para conversaciones directas" value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} />
    </div>
  )
}

function WebinarVslForm({ config, onChange }: { config: WebinarVslConfig; onChange: (c: Partial<WebinarVslConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de asistencia" benchmark="Vivo: 20-40% | Evergreen: 40-70%" value={config.attendanceRate} onChange={v => onChange({ attendanceRate: v })} />
      <PercentField label="Watch rate (hasta la oferta)" benchmark="VSL: 40-70% | Webinar: 50-80%" value={config.watchRate} onChange={v => onChange({ watchRate: v })} />
      <PercentField label="Tasa de conversión" benchmark="VSL frío: 2-5% | Webinar: 5-15%" value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} max={50} step={0.5} />
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<WebinarVslConfig>)}
        priceLabel="Precio del producto"
      />
    </div>
  )
}

function RetargetingForm({ config, onChange }: { config: RetargetingConfig; onChange: (c: Partial<RetargetingConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de captura" tooltip="% de no-conversores alcanzados" benchmark="Pixel bien configurado: 60-80%" value={config.captureRate} onChange={v => onChange({ captureRate: v })} />
      <CurrencyField label="CPC de retargeting" benchmark="Facebook: $0.15-$0.60 | Google: $0.25-$1.00" value={config.cpc} onChange={v => onChange({ cpc: v })} min={0.01} step={0.01} />
      <PercentField label="Tasa de conversión" benchmark="2-4x más efectivo que tráfico frío: 5-20%" value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} max={50} step={0.5} />
    </div>
  )
}

function AppointmentForm({ config, onChange }: { config: AppointmentConfig; onChange: (c: Partial<AppointmentConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de booking" benchmark="Landing optimizada: 10-30%" value={config.bookingRate} onChange={v => onChange({ bookingRate: v })} />
      <PercentField label="Tasa de presentación" benchmark="Con recordatorios WhatsApp: 65-80%" value={config.showRate} onChange={v => onChange({ showRate: v })} />
      <PercentField label="Tasa de cierre" benchmark="Promedio: 20-30% | Buen vendedor: 35-50%" value={config.closeRate} onChange={v => onChange({ closeRate: v })} />
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<AppointmentConfig>)}
        priceLabel="Precio del servicio"
        priceBenchmark="Alto ticket: $500-$10,000+ | Consultoría: $100-$500"
      />
    </div>
  )
}

// ─── Páginas de conversión ─────────────────────────────────────────────────

function ApplicationPageForm({ config, onChange }: { config: ApplicationPageConfig; onChange: (c: Partial<ApplicationPageConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de completado del formulario (%)"
        benchmark="Formularios cortos: 45-60% | Largos: 20-35%"
        value={config.completionRate}
        onChange={v => onChange({ completionRate: v })}
      />
      <PercentField
        label="Tasa de calificados (%)"
        tooltip="% de aplicantes que cumplen los criterios"
        benchmark="Programa premium: 40-70%"
        value={config.qualificationRate}
        onChange={v => onChange({ qualificationRate: v })}
      />
      <FieldWrapper label="Número de campos del formulario">
        <NumberInput value={config.formFields} onChange={v => onChange({ formFields: Math.round(v) })} min={1} max={30} step={1} />
      </FieldWrapper>
    </div>
  )
}

function TripwireForm({ config, onChange }: { config: TripwireConfig; onChange: (c: Partial<TripwireConfig>) => void }) {
  return (
    <div className="space-y-4">
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<TripwireConfig>)}
        priceLabel="Precio del tripwire ($)"
        priceBenchmark="Típico: $7 – $27"
      />
      <PercentField
        label="Tasa de conversión (%)"
        benchmark="Tripwire bien posicionado: 5-12%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <PercentField
        label="Comisión del procesador (%)"
        benchmark="Stripe / PayPal: 2.9-3.5%"
        value={config.processorFee}
        onChange={v => onChange({ processorFee: v })}
      />
    </div>
  )
}

function CatalogStoreForm({ config, onChange }: { config: CatalogStoreConfig; onChange: (c: Partial<CatalogStoreConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Productos vistos promedio" benchmark="E-commerce: 3-6 páginas de producto">
        <NumberInput value={config.avgProductsViewed} onChange={v => onChange({ avgProductsViewed: v })} min={1} max={50} step={0.5} />
      </FieldWrapper>
      <PercentField
        label="Tasa de add to cart (%)"
        benchmark="E-commerce: 6-12%"
        value={config.addToCartRate}
        onChange={v => onChange({ addToCartRate: v })}
      />
      <CurrencyField
        label="AOV estimado ($)"
        benchmark="Depende del catálogo"
        value={config.aov}
        onChange={v => onChange({ aov: v })}
      />
      <PercentField
        label="Bounce rate (%)"
        benchmark="E-commerce: 35-55%"
        value={config.bounceRate}
        onChange={v => onChange({ bounceRate: v })}
      />
    </div>
  )
}

function PricingPageForm({ config, onChange }: { config: PricingPageConfig; onChange: (c: Partial<PricingPageConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de conversión total (%)"
        benchmark="SaaS pricing: 5-15%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <FieldWrapper label="Plan más elegido">
        <SelectInput
          value={config.popularPlan}
          onChange={v => onChange({ popularPlan: v as PricingPageConfig['popularPlan'] })}
          options={[
            { value: 'basic', label: 'Básico' },
            { value: 'pro', label: 'Pro' },
            { value: 'premium', label: 'Premium' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
        />
      </FieldWrapper>
      <PercentField
        label="% que elige plan anual"
        benchmark="Con descuento anual: 25-45%"
        value={config.annualPct}
        onChange={v => onChange({ annualPct: v })}
      />
      <FieldWrapper label="Tiempo promedio en página (seg)">
        <NumberInput value={config.avgTimeOnPage} onChange={v => onChange({ avgTimeOnPage: Math.round(v) })} min={10} max={600} step={10} suffix="s" />
      </FieldWrapper>
    </div>
  )
}

function FreeTrialSignupForm({ config, onChange }: { config: FreeTrialSignupConfig; onChange: (c: Partial<FreeTrialSignupConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de signup (%)"
        benchmark="SaaS free trial: 10-20%"
        value={config.signupRate}
        onChange={v => onChange({ signupRate: v })}
      />
      <PercentField
        label="Tasa de activación (%)"
        tooltip="% que realmente usa el producto durante el trial"
        benchmark="Producto intuitivo: 35-55%"
        value={config.activationRate}
        onChange={v => onChange({ activationRate: v })}
      />
      <FieldWrapper label="Duración del trial (días)">
        <NumberInput value={config.trialDays} onChange={v => onChange({ trialDays: Math.round(v) })} min={1} max={90} step={1} suffix="días" />
      </FieldWrapper>
    </div>
  )
}

function ThankYouOfferForm({ config, onChange }: { config: ThankYouOfferConfig; onChange: (c: Partial<ThankYouOfferConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de conversión a oferta (%)"
        benchmark="Thank you offer: 8-20%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<ThankYouOfferConfig>)}
        priceLabel="Precio de la oferta ($)"
        priceBenchmark="Bump post-compra: $27-$97"
      />
      <PercentField
        label="Engagement con contenido (%)"
        benchmark="Página de gracias optimizada: 55-75%"
        value={config.contentEngagementRate}
        onChange={v => onChange({ contentEngagementRate: v })}
      />
      <PercentField
        label="Comisión del procesador (%)"
        benchmark="Stripe / PayPal: 2.9-3.5%"
        value={config.processorFee}
        onChange={v => onChange({ processorFee: v })}
      />
    </div>
  )
}

// ─── Follow-up y nurturing ─────────────────────────────────────────────────

function PushNotificationsForm({ config, onChange }: { config: PushNotificationsConfig; onChange: (c: Partial<PushNotificationsConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de opt-in (%)" benchmark="Web push: 35-55% | Mobile: 50-65%" value={config.optInRate} onChange={v => onChange({ optInRate: v })} />
      <PercentField label="Tasa de entrega (%)" benchmark="iOS: 85-95% | Android: 90-98%" value={config.deliveryRate} onChange={v => onChange({ deliveryRate: v })} />
      <PercentField label="CTR (%)" benchmark="Push web: 4-8% | Mobile: 5-12%" value={config.ctr} onChange={v => onChange({ ctr: v })} />
      <PercentField label="Conversión post-click (%)" benchmark="Con landing optimizada: 6-12%" value={config.postClickConversion} onChange={v => onChange({ postClickConversion: v })} />
    </div>
  )
}

function DynamicRetargetingForm({ config, onChange }: { config: DynamicRetargetingConfig; onChange: (c: Partial<DynamicRetargetingConfig>) => void }) {
  return (
    <div className="space-y-4">
      <CurrencyField label="Budget de retargeting ($)" benchmark="Depende del volumen de audiencia" value={config.budget} onChange={v => onChange({ budget: v })} />
      <FieldWrapper label="CPC ($)" benchmark="Retargeting: $0.20-$0.80">
        <NumberInput value={config.cpc} onChange={v => onChange({ cpc: v })} min={0.01} max={50} step={0.01} prefix="$" />
      </FieldWrapper>
      <PercentField label="CTR (%)" benchmark="Retargeting dinámico: 2-4%" value={config.ctr} onChange={v => onChange({ ctr: v })} />
      <PercentField label="Conversión post-click (%)" benchmark="Retargeting: 4-8%" value={config.postClickConversion} onChange={v => onChange({ postClickConversion: v })} />
      <FieldWrapper label="Ventana de atribución (días)">
        <SelectInput
          value={String(config.attributionWindow)}
          onChange={v => onChange({ attributionWindow: Number(v) as DynamicRetargetingConfig['attributionWindow'] })}
          options={[
            { value: '1', label: '1 día' },
            { value: '7', label: '7 días' },
            { value: '14', label: '14 días' },
            { value: '28', label: '28 días' },
          ]}
        />
      </FieldWrapper>
    </div>
  )
}

function MultichannelNurturingForm({ config, onChange }: { config: MultichannelNurturingConfig; onChange: (c: Partial<MultichannelNurturingConfig>) => void }) {
  const CHANNELS = [
    { id: 'email', label: 'Email' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'sms', label: 'SMS' },
  ]
  const toggleChannel = (id: string) => {
    const current = config.activeChannels ?? []
    const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id]
    if (next.length > 0) onChange({ activeChannels: next })
  }
  return (
    <div className="space-y-4">
      <FieldWrapper label="Canales activos">
        <div className="flex gap-2">
          {CHANNELS.map(ch => {
            const active = (config.activeChannels ?? []).includes(ch.id)
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors ${active ? 'bg-orange-500/20 border-orange-500/60 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                {ch.label}
              </button>
            )
          })}
        </div>
      </FieldWrapper>
      <FieldWrapper label="Touchpoints hasta conversión">
        <NumberInput value={config.touchpoints} onChange={v => onChange({ touchpoints: Math.round(v) })} min={1} max={30} step={1} />
      </FieldWrapper>
      <PercentField label="Tasa de conversión combinada (%)" benchmark="Nurturing multicanal: 8-18%" value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} />
      <FieldWrapper label="Duración del nurturing (días)">
        <NumberInput value={config.nurturingDays} onChange={v => onChange({ nurturingDays: Math.round(v) })} min={1} max={365} step={1} suffix="días" />
      </FieldWrapper>
      <CurrencyField label="Costo operativo mensual ($)" value={config.monthlyCost} onChange={v => onChange({ monthlyCost: v })} />
    </div>
  )
}

function CartAbandonmentSeqForm({ config, onChange }: { config: CartAbandonmentSeqConfig; onChange: (c: Partial<CartAbandonmentSeqConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Emails/mensajes en la secuencia">
        <NumberInput value={config.emailCount} onChange={v => onChange({ emailCount: Math.round(v) })} min={1} max={10} step={1} />
      </FieldWrapper>
      <PercentField
        label="Tasa de apertura (%)"
        tooltip="Los emails de carrito abandonado tienen open rates más altos que emails normales"
        benchmark="Carrito abandonado: 40-55%"
        value={config.openRate}
        onChange={v => onChange({ openRate: v })}
      />
      <PercentField
        label="Tasa de recuperación (%)"
        tooltip="% de carritos abandonados que se recuperan. Promedio industria: 5-15%"
        benchmark="Con 3 emails: 8-12%"
        value={config.recoveryRate}
        onChange={v => onChange({ recoveryRate: v })}
      />
      <CurrencyField label="Valor promedio del carrito ($)" value={config.avgCartValue} onChange={v => onChange({ avgCartValue: v })} />
    </div>
  )
}

function ReEngagementForm({ config, onChange }: { config: ReEngagementConfig; onChange: (c: Partial<ReEngagementConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Contactos inactivos alcanzados">
        <NumberInput value={config.inactiveReached} onChange={v => onChange({ inactiveReached: Math.round(v) })} min={0} max={1000000} step={100} />
      </FieldWrapper>
      <PercentField label="Tasa de reactivación (%)" benchmark="Re-engagement: 4-8%" value={config.reactivationRate} onChange={v => onChange({ reactivationRate: v })} />
      <FieldWrapper label="Costo por reactivación ($)" benchmark="Email: $1-3 | Ads: $3-10">
        <NumberInput value={config.costPerReactivation} onChange={v => onChange({ costPerReactivation: v })} min={0} max={100} step={0.5} prefix="$" />
      </FieldWrapper>
      <FieldWrapper label="Canal">
        <SelectInput
          value={config.reactivationChannel}
          onChange={v => onChange({ reactivationChannel: v as ReEngagementConfig['reactivationChannel'] })}
          options={[
            { value: 'email', label: 'Email' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'sms', label: 'SMS' },
            { value: 'ads', label: 'Ads' },
          ]}
        />
      </FieldWrapper>
    </div>
  )
}

function DripCampaignForm({ config, onChange }: { config: DripCampaignConfig; onChange: (c: Partial<DripCampaignConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Duración total">
        <SelectInput
          value={config.duration}
          onChange={v => onChange({ duration: v as DripCampaignConfig['duration'] })}
          options={[
            { value: '2weeks', label: '2 semanas' },
            { value: '1month', label: '1 mes' },
            { value: '2months', label: '2 meses' },
            { value: '3months', label: '3 meses' },
            { value: '6months', label: '6 meses' },
          ]}
        />
      </FieldWrapper>
      <FieldWrapper label="Número total de emails">
        <NumberInput value={config.emailCount} onChange={v => onChange({ emailCount: Math.round(v) })} min={1} max={60} step={1} />
      </FieldWrapper>
      <PercentField label="Open rate promedio (%)" benchmark="Lista educativa: 20-28%" value={config.openRate} onChange={v => onChange({ openRate: v })} />
      <PercentField label="CTR promedio (%)" benchmark="Drip educativo: 2-4%" value={config.ctr} onChange={v => onChange({ ctr: v })} />
      <PercentField
        label="Engagement sostenido (%)"
        tooltip="% de personas que siguen abriendo emails al final de la secuencia"
        benchmark="Secuencia larga: 35-50%"
        value={config.sustainedEngagement}
        onChange={v => onChange({ sustainedEngagement: v })}
      />
      <PercentField label="Conversión eventual (%)" benchmark="Drip largo: 4-8%" value={config.eventualConversion} onChange={v => onChange({ eventualConversion: v })} />
    </div>
  )
}

// ─── Post-venta y retención ─────────────────────────────────────────────────

function OnboardingSeqForm({ config, onChange }: { config: OnboardingSeqConfig; onChange: (c: Partial<OnboardingSeqConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de completado del onboarding (%)" benchmark="Con emails de seguimiento: 55-70%" value={config.completionRate} onChange={v => onChange({ completionRate: v })} />
      <FieldWrapper label="Time to value (días)" tooltip="Tiempo hasta que el cliente percibe valor real">
        <NumberInput value={config.timeToValueDays} onChange={v => onChange({ timeToValueDays: Math.round(v) })} min={1} max={90} step={1} suffix="días" />
      </FieldWrapper>
      <PercentField
        label="Tasa de activación (%)"
        tooltip="% que completa las acciones clave del producto"
        benchmark="Producto bien diseñado: 40-60%"
        value={config.activationRate}
        onChange={v => onChange({ activationRate: v })}
      />
      <FieldWrapper label="Pasos del onboarding">
        <NumberInput value={config.onboardingSteps} onChange={v => onChange({ onboardingSteps: Math.round(v) })} min={1} max={20} step={1} />
      </FieldWrapper>
    </div>
  )
}

function ReviewRequestForm({ config, onChange }: { config: ReviewRequestConfig; onChange: (c: Partial<ReviewRequestConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de respuesta (%)" benchmark="Con pedido directo post-compra: 12-20%" value={config.responseRate} onChange={v => onChange({ responseRate: v })} />
      <FieldWrapper label="Rating promedio" benchmark="Producto bueno: 4.2-4.8">
        <div className="space-y-1.5">
          <NumberInput value={config.avgRating} onChange={v => onChange({ avgRating: Math.min(5, Math.max(1, v)) })} min={1} max={5} step={0.1} suffix="/ 5" />
          <SliderInput value={config.avgRating} onChange={v => onChange({ avgRating: v })} min={1} max={5} step={0.1} />
        </div>
      </FieldWrapper>
      <FieldWrapper label="Plataforma">
        <SelectInput
          value={config.platform}
          onChange={v => onChange({ platform: v as ReviewRequestConfig['platform'] })}
          options={[
            { value: 'google', label: 'Google' },
            { value: 'trustpilot', label: 'TrustPilot' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'appstore', label: 'App Store' },
            { value: 'other', label: 'Otra' },
          ]}
        />
      </FieldWrapper>
    </div>
  )
}

function ReferralProgramForm({ config, onChange }: { config: ReferralProgramConfig; onChange: (c: Partial<ReferralProgramConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Invitaciones enviadas por cliente" benchmark="Programa activo: 2-5 invitaciones">
        <NumberInput value={config.invitationsPerCustomer} onChange={v => onChange({ invitationsPerCustomer: v })} min={0.5} max={20} step={0.5} />
      </FieldWrapper>
      <PercentField label="Tasa de conversión del referido (%)" benchmark="Referido por amigo: 12-20%" value={config.referralConversionRate} onChange={v => onChange({ referralConversionRate: v })} />
      <PercentField
        label="Reducción de CAC (%)"
        tooltip="Cuánto se reduce tu costo de adquisición por cada referido"
        benchmark="Referidos bien configurados: 25-40%"
        value={config.cacReduction}
        onChange={v => onChange({ cacReduction: v })}
      />
      <CurrencyField label="Costo del reward ($)" benchmark="Descuento o gift card: $5-$25" value={config.rewardCost} onChange={v => onChange({ rewardCost: v })} />
    </div>
  )
}

function RenewalUpsellForm({ config, onChange }: { config: RenewalUpsellConfig; onChange: (c: Partial<RenewalUpsellConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Churn mensual (%)" benchmark="SaaS saludable: 2-5%" value={config.churnRate} onChange={v => onChange({ churnRate: v })} />
      <PercentField label="Tasa de upgrade (%)" benchmark="Con oferta activa: 6-12%" value={config.upgradeRate} onChange={v => onChange({ upgradeRate: v })} />
      <CurrencyField label="Precio de renovación ($)" value={config.renewalPrice} onChange={v => onChange({ renewalPrice: v })} />
      <CurrencyField label="Precio del upgrade ($)" value={config.upgradePrice} onChange={v => onChange({ upgradePrice: v })} />
      <PercentField label="LTV incremento (%)" benchmark="Con buen upsell: 30-50%" value={config.ltvIncrease} onChange={v => onChange({ ltvIncrease: v })} />
    </div>
  )
}

function PostSaleSupportForm({ config, onChange }: { config: PostSaleSupportConfig; onChange: (c: Partial<PostSaleSupportConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Tickets por mes">
        <NumberInput value={config.ticketsPerMonth} onChange={v => onChange({ ticketsPerMonth: Math.round(v) })} min={0} max={10000} step={10} />
      </FieldWrapper>
      <PercentField label="Tasa de resolución (%)" benchmark="Soporte bien equipado: 80-92%" value={config.resolutionRate} onChange={v => onChange({ resolutionRate: v })} />
      <FieldWrapper label="CSAT / NPS score (1-10)" benchmark="Buen soporte: 7.5-9">
        <div className="space-y-1.5">
          <NumberInput value={config.csatScore} onChange={v => onChange({ csatScore: Math.min(10, Math.max(1, v)) })} min={1} max={10} step={0.1} suffix="/ 10" />
          <SliderInput value={config.csatScore} onChange={v => onChange({ csatScore: v })} min={1} max={10} step={0.1} />
        </div>
      </FieldWrapper>
      <PercentField
        label="Impacto en recompra (%)"
        tooltip="Cuánto aumenta la probabilidad de recompra por buen soporte"
        benchmark="Soporte excelente: 12-20%"
        value={config.repurchaseImpact}
        onChange={v => onChange({ repurchaseImpact: v })}
      />
    </div>
  )
}

function CustomerCommunityForm({ config, onChange }: { config: CustomerCommunityConfig; onChange: (c: Partial<CustomerCommunityConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Miembros activos (%)" benchmark="Comunidad activa: 25-40%" value={config.activeMembersRate} onChange={v => onChange({ activeMembersRate: v })} />
      <PercentField label="Engagement mensual (%)" benchmark="Comunidad saludable: 12-20%" value={config.monthlyEngagement} onChange={v => onChange({ monthlyEngagement: v })} />
      <PercentField
        label="Retention lift (%)"
        tooltip="Cuánto mejora la retención por tener comunidad activa"
        benchmark="Comunidad fuerte: 15-25%"
        value={config.retentionLift}
        onChange={v => onChange({ retentionLift: v })}
      />
      <PercentField label="Referrals desde comunidad (%)" benchmark="Comunidad evangélica: 3-8%" value={config.communityReferrals} onChange={v => onChange({ communityReferrals: v })} />
    </div>
  )
}

function CrossSellForm({ config, onChange }: { config: CrossSellConfig; onChange: (c: Partial<CrossSellConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de aceptación (%)" benchmark="Cross-sell a cliente: 10-18%" value={config.acceptanceRate} onChange={v => onChange({ acceptanceRate: v })} />
      <ProductSelector
        productId={config.productId}
        useManualPrice={config.useManualPrice}
        price={config.price}
        onChange={patch => onChange(patch as Partial<CrossSellConfig>)}
        priceLabel="Precio del producto cross-sell ($)"
        priceBenchmark="Complementario: 20-60% del precio principal"
      />
    </div>
  )
}

function WinBackForm({ config, onChange }: { config: WinBackConfig; onChange: (c: Partial<WinBackConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de reactivación (%)" benchmark="Win-back: 6-12%" value={config.reactivationRate} onChange={v => onChange({ reactivationRate: v })} />
      <CurrencyField label="Costo de reactivación ($)" benchmark="Email/SMS: $5-20" value={config.reactivationCost} onChange={v => onChange({ reactivationCost: v })} />
      <CurrencyField label="LTV restaurado ($)" benchmark="Depende del producto/servicio" value={config.restoredLtv} onChange={v => onChange({ restoredLtv: v })} />
    </div>
  )
}

function LoyaltyProgramForm({ config, onChange }: { config: LoyaltyProgramConfig; onChange: (c: Partial<LoyaltyProgramConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de participación (%)" benchmark="Programa con incentivo real: 35-50%" value={config.participationRate} onChange={v => onChange({ participationRate: v })} />
      <PercentField label="Tasa de redención de puntos (%)" benchmark="Programa activo: 20-35%" value={config.redemptionRate} onChange={v => onChange({ redemptionRate: v })} />
      <PercentField label="Lift en frecuencia de compra (%)" benchmark="Lealtad bien implementada: 15-25%" value={config.purchaseFrequencyLift} onChange={v => onChange({ purchaseFrequencyLift: v })} />
      <FieldWrapper label="Costo del programa por cliente ($)" benchmark="SaaS: $3-8/mes | Retail: $1-5/mes">
        <NumberInput value={config.programCostPerCustomer} onChange={v => onChange({ programCostPerCustomer: v })} min={0} max={100} step={0.5} prefix="$" suffix="/mes" />
      </FieldWrapper>
    </div>
  )
}

function NpsSurveyForm({ config, onChange }: { config: NpsSurveyConfig; onChange: (c: Partial<NpsSurveyConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField label="Tasa de respuesta (%)" benchmark="Email NPS: 20-30%" value={config.responseRate} onChange={v => onChange({ responseRate: v })} />
      <FieldWrapper label="NPS score promedio (-100 a 100)" benchmark="Bueno: >30 | Excelente: >50">
        <div className="space-y-1.5">
          <NumberInput value={config.npsScore} onChange={v => onChange({ npsScore: Math.min(100, Math.max(-100, Math.round(v))) })} min={-100} max={100} step={1} />
          <SliderInput value={config.npsScore} onChange={v => onChange({ npsScore: Math.round(v) })} min={-100} max={100} step={1} />
        </div>
      </FieldWrapper>
      <PercentField label="Detractores identificados (%)" benchmark="Producto en mejora: 10-20%" value={config.detractorsRate} onChange={v => onChange({ detractorsRate: v })} />
      <PercentField label="Acción tomada sobre detractores (%)" benchmark="Con equipo de CS: 45-60%" value={config.detractorActionRate} onChange={v => onChange({ detractorActionRate: v })} />
    </div>
  )
}

// ─── Ventas y cierre ───────────────────────────────────────────────────────

function OutboundCallForm({ config, onChange }: { config: OutboundCallConfig; onChange: (c: Partial<OutboundCallConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Llamadas por día">
        <NumberInput value={config.callsPerDay} onChange={v => onChange({ callsPerDay: Math.round(v) })} min={1} max={500} step={1} />
      </FieldWrapper>
      <PercentField
        label="Tasa de contacto (%)"
        tooltip="% que contesta el teléfono"
        benchmark="Cold call: 15-30%"
        value={config.contactRate}
        onChange={v => onChange({ contactRate: v })}
      />
      <PercentField
        label="Tasa de conversación (%)"
        tooltip="% de contactados que escucha el pitch"
        benchmark="Con buena apertura: 35-50%"
        value={config.conversationRate}
        onChange={v => onChange({ conversationRate: v })}
      />
      <PercentField
        label="Tasa de cierre (%)"
        benchmark="Promedio: 10-20% | Buen vendedor: 25-40%"
        value={config.closeRate}
        onChange={v => onChange({ closeRate: v })}
      />
      <CurrencyField
        label="Ticket promedio ($)"
        benchmark="Depende del producto"
        value={config.avgTicket}
        onChange={v => onChange({ avgTicket: v })}
      />
    </div>
  )
}

function InboundCallForm({ config, onChange }: { config: InboundCallConfig; onChange: (c: Partial<InboundCallConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de atendidas (%)"
        benchmark="Con equipo disponible: 80-90%"
        value={config.answeredRate}
        onChange={v => onChange({ answeredRate: v })}
      />
      <PercentField
        label="Tasa de cierre (%)"
        benchmark="Inbound: 25-40%"
        value={config.closeRate}
        onChange={v => onChange({ closeRate: v })}
      />
      <CurrencyField
        label="Ticket promedio ($)"
        value={config.avgTicket}
        onChange={v => onChange({ avgTicket: v })}
      />
    </div>
  )
}

function SalesProposalForm({ config, onChange }: { config: SalesProposalConfig; onChange: (c: Partial<SalesProposalConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de apertura (%)"
        benchmark="Con seguimiento: 75-90%"
        value={config.openRate}
        onChange={v => onChange({ openRate: v })}
      />
      <PercentField
        label="Tasa de aceptación (%)"
        benchmark="Propuesta B2B: 20-35%"
        value={config.acceptanceRate}
        onChange={v => onChange({ acceptanceRate: v })}
      />
      <CurrencyField
        label="Precio promedio de propuesta ($)"
        value={config.avgPrice}
        onChange={v => onChange({ avgPrice: v })}
      />
      <FieldWrapper label="Tiempo promedio a cierre (días)">
        <NumberInput value={config.avgDaysToClose} onChange={v => onChange({ avgDaysToClose: Math.round(v) })} min={1} max={365} step={1} suffix="días" />
      </FieldWrapper>
    </div>
  )
}

function ProductDemoForm({ config, onChange }: { config: ProductDemoConfig; onChange: (c: Partial<ProductDemoConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Show rate (%)"
        tooltip="% que se presenta a la demo agendada"
        benchmark="Con recordatorio: 65-80%"
        value={config.showRate}
        onChange={v => onChange({ showRate: v })}
      />
      <PercentField
        label="Tasa de follow-up efectivo (%)"
        benchmark="Seguimiento activo: 45-60%"
        value={config.followUpRate}
        onChange={v => onChange({ followUpRate: v })}
      />
      <PercentField
        label="Tasa de cierre post-demo (%)"
        benchmark="SaaS demo: 15-30%"
        value={config.closeRate}
        onChange={v => onChange({ closeRate: v })}
      />
      <CurrencyField
        label="Precio promedio ($)"
        value={config.avgPrice}
        onChange={v => onChange({ avgPrice: v })}
      />
    </div>
  )
}

function TrialToPaidForm({ config, onChange }: { config: TrialToPaidConfig; onChange: (c: Partial<TrialToPaidConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de conversión trial → pago (%)"
        benchmark="SaaS B2C: 15-25% | B2B: 20-40%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <CurrencyField
        label="Precio del plan ($)"
        value={config.price}
        onChange={v => onChange({ price: v })}
      />
      <FieldWrapper label="Tipo de precio">
        <SelectInput
          value={config.priceType}
          onChange={v => onChange({ priceType: v as TrialToPaidConfig['priceType'] })}
          options={[
            { value: 'monthly', label: 'Mensual' },
            { value: 'annual', label: 'Anual' },
            { value: 'oneTime', label: 'Pago único' },
          ]}
        />
      </FieldWrapper>
      <FieldWrapper label="Tiempo promedio a conversión (días)">
        <NumberInput value={config.avgDaysToConvert} onChange={v => onChange({ avgDaysToConvert: Math.round(v) })} min={1} max={90} step={1} suffix="días" />
      </FieldWrapper>
    </div>
  )
}

function PhysicalPosForm({ config, onChange }: { config: PhysicalPosConfig; onChange: (c: Partial<PhysicalPosConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Walk-ins estimados / mes" benchmark="Depende de la ubicación y tráfico peatonal">
        <NumberInput value={config.walkInsPerMonth} onChange={v => onChange({ walkInsPerMonth: Math.round(v) })} min={0} max={100000} step={10} />
      </FieldWrapper>
      <PercentField
        label="Tasa de conversión (%)"
        benchmark="Retail: 20-40% | Con asesor: 30-60%"
        value={config.conversionRate}
        onChange={v => onChange({ conversionRate: v })}
      />
      <CurrencyField
        label="Ticket promedio ($)"
        value={config.avgTicket}
        onChange={v => onChange({ avgTicket: v })}
      />
      <PercentField
        label="Repeat rate (%)"
        tooltip="% que vuelve a comprar"
        benchmark="Comercio local: 15-30%"
        value={config.repeatRate}
        onChange={v => onChange({ repeatRate: v })}
      />
    </div>
  )
}

function DigitalContractForm({ config, onChange }: { config: DigitalContractConfig; onChange: (c: Partial<DigitalContractConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Tasa de firmados (%)"
        benchmark="Con propuesta previa aceptada: 60-75%"
        value={config.signedRate}
        onChange={v => onChange({ signedRate: v })}
      />
      <CurrencyField
        label="Valor del contrato ($)"
        value={config.contractValue}
        onChange={v => onChange({ contractValue: v })}
      />
      <FieldWrapper label="Tiempo promedio a firma (días)">
        <NumberInput value={config.avgDaysToSign} onChange={v => onChange({ avgDaysToSign: Math.round(v) })} min={1} max={90} step={1} suffix="días" />
      </FieldWrapper>
    </div>
  )
}

function SalesNegotiationForm({ config, onChange }: { config: SalesNegotiationConfig; onChange: (c: Partial<SalesNegotiationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <PercentField
        label="Win rate (%)"
        benchmark="B2B negociación: 25-40%"
        value={config.winRate}
        onChange={v => onChange({ winRate: v })}
      />
      <PercentField
        label="Descuento promedio negociado (%)"
        benchmark="Normal: 5-15%"
        value={config.avgDiscountPct}
        onChange={v => onChange({ avgDiscountPct: v })}
      />
      <FieldWrapper label="Ciclo de venta promedio (días)">
        <NumberInput value={config.salesCycleDays} onChange={v => onChange({ salesCycleDays: Math.round(v) })} min={1} max={365} step={1} suffix="días" />
      </FieldWrapper>
    </div>
  )
}

function EventSalesForm({ config, onChange }: { config: EventSalesConfig; onChange: (c: Partial<EventSalesConfig>) => void }) {
  return (
    <div className="space-y-4">
      <FieldWrapper label="Asistentes al evento">
        <NumberInput value={config.attendees} onChange={v => onChange({ attendees: Math.round(v) })} min={1} max={100000} step={10} />
      </FieldWrapper>
      <PercentField
        label="Leads escaneados / contactados (%)"
        benchmark="Evento presencial: 10-20%"
        value={config.leadsContactedRate}
        onChange={v => onChange({ leadsContactedRate: v })}
      />
      <PercentField
        label="Tasa de follow-up (%)"
        benchmark="Con seguimiento activo: 50-70%"
        value={config.followUpRate}
        onChange={v => onChange({ followUpRate: v })}
      />
      <PercentField
        label="Tasa de cierre post-evento (%)"
        benchmark="Evento B2B: 8-15%"
        value={config.closeRate}
        onChange={v => onChange({ closeRate: v })}
      />
      <CurrencyField
        label="Ticket promedio ($)"
        value={config.avgTicket}
        onChange={v => onChange({ avgTicket: v })}
      />
    </div>
  )
}

function SplitForm({ config, onChange }: { config: SplitConfig; onChange: (c: Partial<SplitConfig>) => void }) {
  const updateBranch = (index: number, field: 'label' | 'percentage', value: string | number) => {
    const branches = config.branches.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    )
    // Normalizar para que sumen 100
    onChange({ branches })
  }

  const addBranch = () => {
    if (config.branches.length >= 4) return
    const newBranches = [
      ...config.branches,
      { id: `branch-${config.branches.length}`, label: `Rama ${String.fromCharCode(65 + config.branches.length)}`, percentage: 0 },
    ]
    onChange({ branches: newBranches })
  }

  const removeBranch = (index: number) => {
    if (config.branches.length <= 2) return
    const newBranches = config.branches.filter((_, i) => i !== index)
    onChange({ branches: newBranches })
  }

  const total = config.branches.reduce((s, b) => s + b.percentage, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-slate-400">Ramas</span>
        <span className={cn('text-[11px] font-mono font-bold', total === 100 ? 'text-emerald-400' : 'text-orange-400')}>
          Total: {total}%
        </span>
      </div>
      {config.branches.map((branch, i) => (
        <div key={branch.id} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={branch.label}
              onChange={e => updateBranch(i, 'label', e.target.value)}
              className="funnel-input flex-1 text-sm"
              placeholder="Nombre de rama"
            />
            {config.branches.length > 2 && (
              <button
                onClick={() => removeBranch(i)}
                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            <SliderInput
              value={branch.percentage}
              onChange={v => updateBranch(i, 'percentage', Math.round(v))}
              min={0} max={100} step={1}
            />
            <div className="flex items-center gap-1">
              <NumberInput
                value={branch.percentage}
                onChange={v => updateBranch(i, 'percentage', Math.round(v))}
                min={0} max={100} step={1}
                suffix="%"
              />
            </div>
          </div>
        </div>
      ))}
      {config.branches.length < 4 && (
        <button
          onClick={addBranch}
          className="w-full py-2 rounded-lg border border-dashed border-slate-700 text-[12px] text-slate-500
                     hover:border-orange-500/40 hover:text-orange-400 transition-colors"
        >
          + Agregar rama
        </button>
      )}
    </div>
  )
}

// ─── Vista de resultados de simulación ───────────────────────────────────

function NodeResultsView({ nodeType, simResult }: {
  nodeType: FunnelNodeType
  simResult: NonNullable<import('@/lib/types').NodeSimResult>
}) {
  const isSourceNode = !NODE_DEFINITIONS[nodeType]?.hasInput
  const lostVisitors = simResult.visitorsIn - simResult.visitorsConverted
  const lostPct = simResult.visitorsIn > 0
    ? ((lostVisitors / simResult.visitorsIn) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-3">
      {/* Flujo de tráfico */}
      {simResult.visitorsIn > 0 && (
        <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Flujo de tráfico</p>

          {/* Visitas que entran */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-[12px] text-slate-400 flex-1">Entran</span>
            <span className="text-[13px] font-bold text-slate-200 font-mono">{formatNumber(simResult.visitorsIn)}</span>
          </div>

          {/* Arrow + conversion */}
          {!isSourceNode && (
            <div className="pl-4 flex items-center gap-2">
              <ArrowRight size={11} className="text-slate-600" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${simResult.conversionRate}%`,
                    backgroundColor: simResult.conversionRate > 20 ? '#22c55e' : simResult.conversionRate > 5 ? '#f97316' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono w-10 text-right">
                {formatPercent(simResult.conversionRate)}
              </span>
            </div>
          )}

          {/* Visitas que salen (convierten) */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[12px] text-slate-400 flex-1">Salen / Convierten</span>
            <span className="text-[13px] font-bold text-emerald-400 font-mono">{formatNumber(simResult.visitorsConverted)}</span>
          </div>

          {/* Pérdida */}
          {!isSourceNode && lostVisitors > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400/60 flex-shrink-0" />
              <span className="text-[12px] text-slate-500 flex-1">Se pierden</span>
              <span className="text-[12px] font-semibold text-red-400/80 font-mono">{formatNumber(lostVisitors)} ({lostPct}%)</span>
            </div>
          )}
        </div>
      )}

      {/* Revenue y costos */}
      {(simResult.revenue > 0 || simResult.cost > 0) && (
        <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Financiero</p>
          {simResult.revenue > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-[12px] text-slate-400 flex-1">Ingresos</span>
              <span className="text-[13px] font-bold text-emerald-400 font-mono">{formatCurrency(simResult.revenue)}</span>
            </div>
          )}
          {simResult.cost > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign size={11} className="text-red-400" />
              <span className="text-[12px] text-slate-400 flex-1">Costo</span>
              <span className="text-[13px] font-bold text-red-400 font-mono">{formatCurrency(simResult.cost)}</span>
            </div>
          )}
          {simResult.revenue > 0 && simResult.cost > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
              <span className="text-[12px] text-slate-400 flex-1">Neto</span>
              <span className={cn('text-[13px] font-bold font-mono', simResult.revenue - simResult.cost >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(simResult.revenue - simResult.cost)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leads */}
      {simResult.leads > 0 && (
        <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Leads</p>
          <div className="flex items-center gap-2">
            <Users size={11} className="text-purple-400" />
            <span className="text-[12px] text-slate-400 flex-1">Leads capturados</span>
            <span className="text-[13px] font-bold text-purple-400 font-mono">{formatNumber(simResult.leads)}</span>
          </div>
        </div>
      )}

      {simResult.visitorsIn === 0 && simResult.revenue === 0 && (
        <p className="text-[12px] text-slate-500 italic text-center py-4">
          Este nodo no recibió tráfico en esta simulación.
        </p>
      )}
    </div>
  )
}

// ─── Formularios: Contenido y engagement ────────────────────────────────────

function BlogSeoForm({ config, onChange }: { config: BlogSeoConfig; onChange: (p: Partial<BlogSeoConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Visitas orgánicas/mes" benchmark="Blog activo: 2k-50k visitas/mes">
        <NumberInput value={config.monthlyVisits} onChange={v => onChange({ monthlyVisits: v })} min={0} step={500} />
      </FieldWrapper>
      <FieldWrapper label="Tiempo en página (seg)" benchmark="Buen blog: >90 seg">
        <NumberInput value={config.avgTimeOnPage} onChange={v => onChange({ avgTimeOnPage: v })} min={0} step={10} />
      </FieldWrapper>
      <FieldWrapper label="Scroll depth (%)" benchmark="Buen blog: 50-70%">
        <SliderInput value={config.scrollDepth} onChange={v => onChange({ scrollDepth: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CTR a CTA interno (%)" benchmark="Blog con CTA: 3-7%">
        <SliderInput value={config.ctrToCta} onChange={v => onChange({ ctrToCta: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function VideoContentForm({ config, onChange }: { config: VideoContentConfig; onChange: (p: Partial<VideoContentConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Plataforma">
        <select
          value={config.videoPlatform}
          onChange={e => onChange({ videoPlatform: e.target.value as VideoContentConfig['videoPlatform'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="wistia">Wistia</option>
          <option value="other">Otra</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Views mensuales" benchmark="Canal nuevo: 1k-10k; establecido: 50k+">
        <NumberInput value={config.monthlyViews} onChange={v => onChange({ monthlyViews: v })} min={0} step={500} />
      </FieldWrapper>
      <FieldWrapper label="Watch time promedio (%)" benchmark="YouTube: 40-60%">
        <SliderInput value={config.watchTimePct} onChange={v => onChange({ watchTimePct: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CTR a CTA (%)" benchmark="YouTube: 3-8%">
        <SliderInput value={config.ctrToCta} onChange={v => onChange({ ctrToCta: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Suscripciones generadas (%)" benchmark="Típico: 1-5%">
        <SliderInput value={config.subscriptionRate} onChange={v => onChange({ subscriptionRate: v })} min={0} max={20} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function LeadMagnetForm({ config, onChange }: { config: LeadMagnetConfig; onChange: (p: Partial<LeadMagnetConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Tipo de lead magnet">
        <select
          value={config.magnetType}
          onChange={e => onChange({ magnetType: e.target.value as LeadMagnetConfig['magnetType'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="pdf">PDF / Ebook</option>
          <option value="video">Video</option>
          <option value="template">Template</option>
          <option value="checklist">Checklist</option>
          <option value="minicurso">Mini-curso</option>
          <option value="herramienta">Herramienta</option>
          <option value="otro">Otro</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Tasa de opt-in (%)" benchmark="Lead magnet relevante: 30-60%">
        <SliderInput value={config.optInRate} onChange={v => onChange({ optInRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Calidad del lead (1-10)" benchmark="Lead calificado: 7+">
        <SliderInput value={config.leadQualityScore} onChange={v => onChange({ leadQualityScore: v })} min={1} max={10} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function QuizInteractiveForm({ config, onChange }: { config: QuizInteractiveConfig; onChange: (p: Partial<QuizInteractiveConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Tasa de inicio (%)" benchmark="Quiz atractivo: 50-70%">
        <SliderInput value={config.startRate} onChange={v => onChange({ startRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Tasa de completado (%)" benchmark="Quiz corto: 60-80%">
        <SliderInput value={config.completionRate} onChange={v => onChange({ completionRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Segmentos resultantes">
        <NumberInput value={config.segments} onChange={v => onChange({ segments: v })} min={1} max={20} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Opt-in al final (%)" benchmark="Quiz con resultado: 40-60%">
        <SliderInput value={config.optInAtEnd} onChange={v => onChange({ optInAtEnd: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

function CalculatorToolForm({ config, onChange }: { config: CalculatorToolConfig; onChange: (p: Partial<CalculatorToolConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Usos mensuales">
        <NumberInput value={config.monthlyUses} onChange={v => onChange({ monthlyUses: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Tiempo de uso promedio (seg)" benchmark="Calculadora compleja: 2-5 min">
        <NumberInput value={config.avgUsageTimeSec} onChange={v => onChange({ avgUsageTimeSec: v })} min={0} step={10} />
      </FieldWrapper>
      <FieldWrapper label="Conversión a siguiente paso (%)" benchmark="Herramienta con resultado: 10-20%">
        <SliderInput value={config.nextStepConversion} onChange={v => onChange({ nextStepConversion: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function EducationalCarouselForm({ config, onChange }: { config: EducationalCarouselConfig; onChange: (p: Partial<EducationalCarouselConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Swipes promedio" benchmark="Carrusel efectivo: 6-8 slides">
        <SliderInput value={config.avgSwipes} onChange={v => onChange({ avgSwipes: v })} min={1} max={10} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Saves (%)" benchmark="Carrusel educativo: 3-8%">
        <SliderInput value={config.saveRate} onChange={v => onChange({ saveRate: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Shares (%)" benchmark="Contenido viral: 2-5%">
        <SliderInput value={config.shareRate} onChange={v => onChange({ shareRate: v })} min={0} max={20} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="CTR a link (%)" benchmark="Carrusel con CTA: 1-3%">
        <SliderInput value={config.ctrToLink} onChange={v => onChange({ ctrToLink: v })} min={0} max={20} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function EbookGuideForm({ config, onChange }: { config: EbookGuideConfig; onChange: (p: Partial<EbookGuideConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Páginas leídas promedio (%)" benchmark="Ebook relevante: 30-50%">
        <SliderInput value={config.avgPagesPct} onChange={v => onChange({ avgPagesPct: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CTR a oferta dentro del ebook (%)" benchmark="Ebook bien diseñado: 4-8%">
        <SliderInput value={config.ctrToOffer} onChange={v => onChange({ ctrToOffer: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function ResourceTemplateForm({ config, onChange }: { config: ResourceTemplateConfig; onChange: (p: Partial<ResourceTemplateConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Tasa de descarga / opt-in (%)" benchmark="Template útil: 30-55%">
        <SliderInput value={config.downloadRate} onChange={v => onChange({ downloadRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Uso real del recurso (%)" benchmark="Template práctico: 25-40%">
        <SliderInput value={config.actualUseRate} onChange={v => onChange({ actualUseRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversión post-uso (%)" benchmark="Template con CTA: 6-12%">
        <SliderInput value={config.postUseConversion} onChange={v => onChange({ postUseConversion: v })} min={0} max={50} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function WebinarReplayForm({ config, onChange }: { config: WebinarReplayConfig; onChange: (p: Partial<WebinarReplayConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="% de registrados que ven el replay" benchmark="Típico: 20-35%">
        <SliderInput value={config.viewsPct} onChange={v => onChange({ viewsPct: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Watch time (%)" benchmark="Webinar de 60 min: 35-50% ve hasta CTA">
        <SliderInput value={config.watchTimePct} onChange={v => onChange({ watchTimePct: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CTR a oferta (%)" benchmark="Webinar de valor: 5-10%">
        <SliderInput value={config.ctrToOffer} onChange={v => onChange({ ctrToOffer: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Conversión final (%)" benchmark="Replay vs live: 50-70% de la conversión en vivo">
        <SliderInput value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} min={0} max={50} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function CaseStudyForm({ config, onChange }: { config: CaseStudyConfig; onChange: (p: Partial<CaseStudyConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Tiempo de lectura promedio (seg)" benchmark="Case study B2B: 3-5 min">
        <NumberInput value={config.avgReadTimeSec} onChange={v => onChange({ avgReadTimeSec: v })} min={0} step={30} />
      </FieldWrapper>
      <FieldWrapper label="CTR a CTA (%)" benchmark="Case study detallado: 6-12%">
        <SliderInput value={config.ctrToCta} onChange={v => onChange({ ctrToCta: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

// ─── Formularios: Agentes de IA ──────────────────────────────────────────────

function AiWhatsappForm({ config, onChange }: { config: AiWhatsappConfig; onChange: (p: Partial<AiWhatsappConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Mensajes recibidos/mes">
        <NumberInput value={config.messagesPerMonth} onChange={v => onChange({ messagesPerMonth: v })} min={0} step={50} />
      </FieldWrapper>
      <FieldWrapper label="Respuesta automática (%)" benchmark="Agente bien entrenado: 80-90%">
        <SliderInput value={config.autoResponseRate} onChange={v => onChange({ autoResponseRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Handoff a humano (%)" benchmark="Consultas complejas: 10-20%">
        <SliderInput value={config.humanHandoffRate} onChange={v => onChange({ humanHandoffRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversión (%)" benchmark="Agente de ventas: 10-18%">
        <SliderInput value={config.conversionRate} onChange={v => onChange({ conversionRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Costo por conversación ($)" benchmark="WhatsApp Business API: $0.03-0.08">
        <NumberInput value={config.costPerConversation} onChange={v => onChange({ costPerConversation: v })} min={0} step={0.01} />
      </FieldWrapper>
    </div>
  )
}

function AiWebChatForm({ config, onChange }: { config: AiWebChatConfig; onChange: (p: Partial<AiWebChatConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Sesiones/mes">
        <NumberInput value={config.sessionsPerMonth} onChange={v => onChange({ sessionsPerMonth: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Resolución automática (%)" benchmark="Chatbot IA bien entrenado: 65-80%">
        <SliderInput value={config.autoResolutionRate} onChange={v => onChange({ autoResolutionRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Escalación a humano (%)" benchmark="Típico: 15-25%">
        <SliderInput value={config.humanEscalationRate} onChange={v => onChange({ humanEscalationRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Leads generados (%)" benchmark="Chat de ventas: 12-20%">
        <SliderInput value={config.leadsGeneratedRate} onChange={v => onChange({ leadsGeneratedRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="CSAT score (1-5)" benchmark="Buen servicio: 4+">
        <SliderInput value={config.csatScore} onChange={v => onChange({ csatScore: v })} min={1} max={5} step={0.1} />
      </FieldWrapper>
    </div>
  )
}

function AiVoiceForm({ config, onChange }: { config: AiVoiceConfig; onChange: (p: Partial<AiVoiceConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Llamadas atendidas/mes">
        <NumberInput value={config.callsAttendedPerMonth} onChange={v => onChange({ callsAttendedPerMonth: v })} min={0} step={25} />
      </FieldWrapper>
      <FieldWrapper label="Duración promedio (seg)" benchmark="Llamada de calificación: 90-180 seg">
        <NumberInput value={config.avgCallDurationSec} onChange={v => onChange({ avgCallDurationSec: v })} min={0} step={15} />
      </FieldWrapper>
      <FieldWrapper label="Resolución (%)" benchmark="Agente de voz entrenado: 55-70%">
        <SliderInput value={config.resolutionRate} onChange={v => onChange({ resolutionRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Booking rate (%)" benchmark="Llamada de ventas: 15-25%">
        <SliderInput value={config.bookingRate} onChange={v => onChange({ bookingRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Costo por llamada ($)" benchmark="Voz IA: $0.08-0.25/min">
        <NumberInput value={config.costPerCall} onChange={v => onChange({ costPerCall: v })} min={0} step={0.01} />
      </FieldWrapper>
    </div>
  )
}

function AiInstagramDmForm({ config, onChange }: { config: AiInstagramDmConfig; onChange: (p: Partial<AiInstagramDmConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="DMs procesados/mes">
        <NumberInput value={config.dmsProcessedPerMonth} onChange={v => onChange({ dmsProcessedPerMonth: v })} min={0} step={50} />
      </FieldWrapper>
      <FieldWrapper label="Respuesta automática (%)" benchmark="Agente DM: 75-90%">
        <SliderInput value={config.autoResponseRate} onChange={v => onChange({ autoResponseRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversión a link (%)" benchmark="DM de venta: 15-25%">
        <SliderInput value={config.linkConversionRate} onChange={v => onChange({ linkConversionRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Engagement post-respuesta (%)" benchmark="Seguidor calificado: 20-35%">
        <SliderInput value={config.postResponseEngagement} onChange={v => onChange({ postResponseEngagement: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

function AiEmailForm({ config, onChange }: { config: AiEmailConfig; onChange: (p: Partial<AiEmailConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Emails procesados/mes">
        <NumberInput value={config.emailsProcessedPerMonth} onChange={v => onChange({ emailsProcessedPerMonth: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Respuesta automática (%)" benchmark="IA de soporte: 70-85%">
        <SliderInput value={config.autoResponseRate} onChange={v => onChange({ autoResponseRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Follow-up automático (%)" benchmark="Secuencia IA: 35-50%">
        <SliderInput value={config.autoFollowUpRate} onChange={v => onChange({ autoFollowUpRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Resolución (%)" benchmark="Email IA bien entrenado: 50-65%">
        <SliderInput value={config.resolutionRate} onChange={v => onChange({ resolutionRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

function ChatbotRulesForm({ config, onChange }: { config: ChatbotRulesConfig; onChange: (p: Partial<ChatbotRulesConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Interacciones/mes">
        <NumberInput value={config.interactionsPerMonth} onChange={v => onChange({ interactionsPerMonth: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Completado del flujo (%)" benchmark="Chatbot bien diseñado: 50-65%">
        <SliderInput value={config.flowCompletionRate} onChange={v => onChange({ flowCompletionRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Fallback (no entendido) (%)" benchmark="Chatbot robusto: < 20%">
        <SliderInput value={config.fallbackRate} onChange={v => onChange({ fallbackRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Leads capturados (%)" benchmark="Chatbot de ventas: 20-35%">
        <SliderInput value={config.leadsCapturedRate} onChange={v => onChange({ leadsCapturedRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function AutomationWorkflowForm({ config, onChange }: { config: AutomationWorkflowConfig; onChange: (p: Partial<AutomationWorkflowConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Ejecuciones/mes">
        <NumberInput value={config.executionsPerMonth} onChange={v => onChange({ executionsPerMonth: v })} min={0} step={500} />
      </FieldWrapper>
      <FieldWrapper label="Tasa de éxito (%)" benchmark="Workflow bien configurado: 90-98%">
        <SliderInput value={config.successRate} onChange={v => onChange({ successRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Tiempo ahorrado (hrs/mes)" benchmark="Automatización básica: 20-50 hrs">
        <NumberInput value={config.timeSavedHrsPerMonth} onChange={v => onChange({ timeSavedHrsPerMonth: v })} min={0} step={5} />
      </FieldWrapper>
      <FieldWrapper label="Costo operativo mensual ($)" benchmark="Make/Zapier Pro: $20-60/mes">
        <NumberInput value={config.operatingCostPerMonth} onChange={v => onChange({ operatingCostPerMonth: v })} min={0} step={5} />
      </FieldWrapper>
    </div>
  )
}

function AiLeadScoringForm({ config, onChange }: { config: AiLeadScoringConfig; onChange: (p: Partial<AiLeadScoringConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Precisión del score (%)" benchmark="Modelo bien entrenado: 70-85%">
        <SliderInput value={config.scoringPrecision} onChange={v => onChange({ scoringPrecision: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="MQL generados (%)" tooltip="% de leads que califican como Marketing Qualified Lead" benchmark="Típico: 25-40%">
        <SliderInput value={config.mqlRate} onChange={v => onChange({ mqlRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Tiempo de respuesta promedio (min)" benchmark="Equipo ágil: < 5 min">
        <NumberInput value={config.avgResponseTimeMin} onChange={v => onChange({ avgResponseTimeMin: v })} min={0} step={1} />
      </FieldWrapper>
    </div>
  )
}

function AiContentPersonalizationForm({ config, onChange }: { config: AiContentPersonalizationConfig; onChange: (p: Partial<AiContentPersonalizationConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Variantes generadas" benchmark="A/B efectivo: 3-8 variantes">
        <NumberInput value={config.variantsGenerated} onChange={v => onChange({ variantsGenerated: v })} min={1} max={20} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CTR lift vs genérico (%)" benchmark="Personalización IA: +15-35%">
        <SliderInput value={config.ctrLift} onChange={v => onChange({ ctrLift: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversión lift vs genérico (%)" benchmark="Personalización IA: +10-20%">
        <SliderInput value={config.conversionLift} onChange={v => onChange({ conversionLift: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

function AiSegmentationForm({ config, onChange }: { config: AiSegmentationConfig; onChange: (p: Partial<AiSegmentationConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Segmentos creados" benchmark="Segmentación efectiva: 3-8 segmentos">
        <NumberInput value={config.segmentsCreated} onChange={v => onChange({ segmentsCreated: v })} min={1} max={20} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Precisión de segmentación (%)" benchmark="Modelo entrenado: 75-90%">
        <SliderInput value={config.segmentationPrecision} onChange={v => onChange({ segmentationPrecision: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <p className="text-[11px] text-slate-500 italic">
        Todos los contactos pasan. Conecta a un nodo Split para rutear cada segmento.
      </p>
    </div>
  )
}

// ─── Formularios: Tracking ───────────────────────────────────────────────────

const META_EVENTS = ['ViewContent', 'AddToCart', 'Purchase', 'Lead', 'CompleteRegistration']

function MetaPixelForm({ config, onChange }: { config: MetaPixelConfig; onChange: (p: Partial<MetaPixelConfig>) => void }) {
  const toggleEvent = (ev: string) => {
    const current = config.trackedEvents ?? []
    const updated = current.includes(ev) ? current.filter(e => e !== ev) : [...current, ev]
    onChange({ trackedEvents: updated })
  }
  return (
    <div className="space-y-3">
      <FieldWrapper label="Eventos trackeados">
        <div className="flex flex-wrap gap-1.5">
          {META_EVENTS.map(ev => (
            <button
              key={ev}
              onClick={() => toggleEvent(ev)}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                (config.trackedEvents ?? []).includes(ev)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-[#1a1a1a] border-[#333] text-slate-400 hover:border-[#555]'
              }`}
            >
              {ev}
            </button>
          ))}
        </div>
      </FieldWrapper>
      <FieldWrapper label="Match quality score (%)" benchmark="Pixel bien configurado: 80-90%">
        <SliderInput value={config.matchQualityScore} onChange={v => onChange({ matchQualityScore: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="CAPI habilitado">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ capiEnabled: !config.capiEnabled })}
            className={`w-10 h-5 rounded-full transition-colors relative ${config.capiEnabled ? 'bg-orange-500' : 'bg-[#333]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.capiEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-[12px] text-slate-400">{config.capiEnabled ? 'Activado' : 'Desactivado'}</span>
        </div>
      </FieldWrapper>
    </div>
  )
}

function GoogleTagManagerForm({ config, onChange }: { config: GoogleTagManagerConfig; onChange: (p: Partial<GoogleTagManagerConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Tags activos">
        <NumberInput value={config.activeTags} onChange={v => onChange({ activeTags: v })} min={0} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Triggers configurados">
        <NumberInput value={config.configuredTriggers} onChange={v => onChange({ configuredTriggers: v })} min={0} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Cobertura en páginas (%)" benchmark="GTM bien implementado: 95-100%">
        <SliderInput value={config.gtmPagesCoverage} onChange={v => onChange({ gtmPagesCoverage: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

function GoogleAnalyticsForm({ config, onChange }: { config: GoogleAnalyticsConfig; onChange: (p: Partial<GoogleAnalyticsConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Modelo de atribución">
        <select
          value={config.gaAttributionModel}
          onChange={e => onChange({ gaAttributionModel: e.target.value as GoogleAnalyticsConfig['gaAttributionModel'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="lastClick">Last click</option>
          <option value="firstClick">First click</option>
          <option value="dataDriven">Data-driven</option>
          <option value="linear">Linear</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Eventos configurados">
        <NumberInput value={config.gaConfiguredEvents} onChange={v => onChange({ gaConfiguredEvents: v })} min={0} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversiones">
        <NumberInput value={config.gaConversions} onChange={v => onChange({ gaConversions: v })} min={0} step={1} />
      </FieldWrapper>
    </div>
  )
}

function MetaOfflineDataForm({ config, onChange }: { config: MetaOfflineDataConfig; onChange: (p: Partial<MetaOfflineDataConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Eventos offline/mes">
        <NumberInput value={config.offlineEventsPerMonth} onChange={v => onChange({ offlineEventsPerMonth: v })} min={0} step={50} />
      </FieldWrapper>
      <FieldWrapper label="Match rate (%)" benchmark="Datos offline: 60-80%">
        <SliderInput value={config.offlineMatchRate} onChange={v => onChange({ offlineMatchRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Delay de upload (días)" benchmark="Recomendado: 1-3 días">
        <NumberInput value={config.uploadDelayDays} onChange={v => onChange({ uploadDelayDays: v })} min={0} max={30} step={1} />
      </FieldWrapper>
    </div>
  )
}

function UtmTrackingForm({ config, onChange }: { config: UtmTrackingConfig; onChange: (p: Partial<UtmTrackingConfig>) => void }) {
  return (
    <div className="space-y-3">
      {(['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm'] as const).map(key => (
        <FieldWrapper key={key} label={key.replace('utm', 'utm_').replace('utm_S', 'utm_s').replace('utm_M', 'utm_m').replace('utm_C', 'utm_c').replace('utm_T', 'utm_t')}>
          <input
            type="text"
            value={config[key]}
            onChange={e => onChange({ [key]: e.target.value })}
            placeholder={`Ej: ${key === 'utmSource' ? 'facebook' : key === 'utmMedium' ? 'cpc' : key === 'utmCampaign' ? 'black-friday' : ''}`}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
          />
        </FieldWrapper>
      ))}
    </div>
  )
}

const POSTBACK_PLATFORMS = ['meta', 'google', 'tiktok', 'taboola', 'outbrain']

function ServerPostbackForm({ config, onChange }: { config: ServerPostbackConfig; onChange: (p: Partial<ServerPostbackConfig>) => void }) {
  const toggle = (p: string) => {
    const current = config.connectedPlatforms ?? []
    const updated = current.includes(p) ? current.filter(x => x !== p) : [...current, p]
    onChange({ connectedPlatforms: updated })
  }
  return (
    <div className="space-y-3">
      <FieldWrapper label="Plataformas conectadas">
        <div className="flex flex-wrap gap-1.5">
          {POSTBACK_PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors capitalize ${
                (config.connectedPlatforms ?? []).includes(p)
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-[#1a1a1a] border-[#333] text-slate-400 hover:border-[#555]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </FieldWrapper>
      <FieldWrapper label="Precisión vs cookie (%)" benchmark="Server-side: 90-98%">
        <SliderInput value={config.precisionVsCookie} onChange={v => onChange({ precisionVsCookie: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Conversiones reportadas/mes">
        <NumberInput value={config.postbackConversionsPerMonth} onChange={v => onChange({ postbackConversionsPerMonth: v })} min={0} step={100} />
      </FieldWrapper>
    </div>
  )
}

function CrmAttributionForm({ config, onChange }: { config: CrmAttributionConfig; onChange: (p: Partial<CrmAttributionConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Modelo de atribución">
        <select
          value={config.crmAttributionModel}
          onChange={e => onChange({ crmAttributionModel: e.target.value as CrmAttributionConfig['crmAttributionModel'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="firstTouch">First touch</option>
          <option value="lastTouch">Last touch</option>
          <option value="multiTouch">Multi-touch</option>
          <option value="wShaped">W-shaped</option>
          <option value="uShaped">U-shaped</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Revenue atribuido ($)" benchmark="Varía según el modelo elegido">
        <NumberInput value={config.crmAttributedRevenue} onChange={v => onChange({ crmAttributedRevenue: v })} min={0} step={500} />
      </FieldWrapper>
    </div>
  )
}

function HeatmapsForm({ config, onChange }: { config: HeatmapsConfig; onChange: (p: Partial<HeatmapsConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Herramienta">
        <select
          value={config.heatmapTool}
          onChange={e => onChange({ heatmapTool: e.target.value as HeatmapsConfig['heatmapTool'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="hotjar">Hotjar</option>
          <option value="clarity">Microsoft Clarity</option>
          <option value="crazyEgg">Crazy Egg</option>
          <option value="other">Otra</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Sesiones grabadas/mes">
        <NumberInput value={config.heatmapSessionsPerMonth} onChange={v => onChange({ heatmapSessionsPerMonth: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Rage clicks detectados (%)" benchmark="Sitio con problemas UX: > 5%">
        <SliderInput value={config.rageClicksRate} onChange={v => onChange({ rageClicksRate: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function CallTrackingForm({ config, onChange }: { config: CallTrackingConfig; onChange: (p: Partial<CallTrackingConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Llamadas trackeadas/mes">
        <NumberInput value={config.trackedCallsPerMonth} onChange={v => onChange({ trackedCallsPerMonth: v })} min={0} step={25} />
      </FieldWrapper>
      <FieldWrapper label="Source attribution (%)" benchmark="Tracking bien implementado: 70-85%">
        <SliderInput value={config.callSourceAttribution} onChange={v => onChange({ callSourceAttribution: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Duración promedio (seg)">
        <NumberInput value={config.callAvgDurationSec} onChange={v => onChange({ callAvgDurationSec: v })} min={0} step={30} />
      </FieldWrapper>
      <FieldWrapper label="Conversión post-llamada (%)" benchmark="Llamada calificada: 10-25%">
        <SliderInput value={config.postCallConversion} onChange={v => onChange({ postCallConversion: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function ConversionApiForm({ config, onChange }: { config: ConversionApiConfig; onChange: (p: Partial<ConversionApiConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Eventos server-side/mes">
        <NumberInput value={config.serverEventsPerMonth} onChange={v => onChange({ serverEventsPerMonth: v })} min={0} step={500} />
      </FieldWrapper>
      <FieldWrapper label="Redundancia con pixel (%)" benchmark="Deduplicación recomendada: 10-30%">
        <SliderInput value={config.pixelRedundancyPct} onChange={v => onChange({ pixelRedundancyPct: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Deduplicación (%)" benchmark="CAPI bien configurado: 90-98%">
        <SliderInput value={config.deduplicationRate} onChange={v => onChange({ deduplicationRate: v })} min={0} max={100} step={1} />
      </FieldWrapper>
    </div>
  )
}

// ─── Formularios: Utilidades ─────────────────────────────────────────────────

function DelayWaitForm({ config, onChange }: { config: DelayConfig; onChange: (p: Partial<DelayConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Duración">
        <div className="flex gap-2">
          <NumberInput value={config.days} onChange={v => onChange({ days: v })} min={0} step={1} />
          <select
            value={config.unit ?? 'days'}
            onChange={e => onChange({ unit: e.target.value as DelayConfig['unit'] })}
            className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 min-w-[80px]"
          >
            <option value="hours">Horas</option>
            <option value="days">Días</option>
            <option value="weeks">Semanas</option>
          </select>
        </div>
      </FieldWrapper>
      <p className="text-[11px] text-slate-500 italic">
        Todos los contactos pasan. El delay solo indica el tiempo de espera en el flujo.
      </p>
    </div>
  )
}

function ConditionalBranchForm({ config, onChange }: { config: ConditionalBranchConfig; onChange: (p: Partial<ConditionalBranchConfig>) => void }) {
  const noPercent = 100 - (config.yesPercent ?? 40)
  return (
    <div className="space-y-3">
      <FieldWrapper label="Condición" tooltip="Describe la regla que divide el flujo">
        <input
          type="text"
          value={config.branchCondition}
          onChange={e => onChange({ branchCondition: e.target.value })}
          placeholder="Ej: Lead score > 50"
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
        />
      </FieldWrapper>
      <FieldWrapper label={`Rama "Sí" (%)`} benchmark="Típico: 30-50% cumplen la condición">
        <SliderInput value={config.yesPercent} onChange={v => onChange({ yesPercent: v })} min={0} max={100} step={1} />
      </FieldWrapper>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Rama "No": {noPercent.toFixed(0)}%</span>
        <span className="text-orange-400/60">(automático)</span>
      </div>
    </div>
  )
}

function MergeNodeForm() {
  return (
    <p className="text-[12px] text-slate-500 italic">
      Combina el tráfico de múltiples nodos entrantes. No requiere configuración.
    </p>
  )
}

function KpiCheckpointForm({ config, onChange }: { config: KpiCheckpointConfig; onChange: (p: Partial<KpiCheckpointConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Nombre del KPI" tooltip="Ej: CPA, CPL, ROAS, Conversión">
        <input
          type="text"
          value={config.kpiName}
          onChange={e => onChange({ kpiName: e.target.value })}
          placeholder="Ej: CPA"
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
        />
      </FieldWrapper>
      <FieldWrapper label="Tipo de alerta">
        <select
          value={config.kpiAlertType}
          onChange={e => onChange({ kpiAlertType: e.target.value as KpiCheckpointConfig['kpiAlertType'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="above">Si supera</option>
          <option value="below">Si está debajo</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Umbral de alerta ($)">
        <NumberInput value={config.kpiAlertThreshold} onChange={v => onChange({ kpiAlertThreshold: v })} min={0} step={1} />
      </FieldWrapper>
      <p className="text-[11px] text-slate-500 italic">
        Todos los contactos pasan. Muestra alerta si el KPI calculado supera / baja del umbral.
      </p>
    </div>
  )
}

function LoopRecurrenceForm({ config, onChange }: { config: LoopRecurrenceConfig; onChange: (p: Partial<LoopRecurrenceConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Número de iteraciones" benchmark="Ciclo anual: 12 meses">
        <NumberInput value={config.iterations} onChange={v => onChange({ iterations: v })} min={1} max={120} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Frecuencia">
        <select
          value={config.loopFrequency}
          onChange={e => onChange({ loopFrequency: e.target.value as LoopRecurrenceConfig['loopFrequency'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
      </FieldWrapper>
      <FieldWrapper label="Retención por ciclo (%)" benchmark="SaaS saludable: 93-97% mensual">
        <SliderInput value={config.retentionPerCycle} onChange={v => onChange({ retentionPerCycle: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

const MILESTONE_STAGES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'interest', label: 'Interés' },
  { value: 'consideration', label: 'Consideración' },
  { value: 'decision', label: 'Decisión' },
  { value: 'purchase', label: 'Compra' },
  { value: 'retention', label: 'Retención' },
  { value: 'referral', label: 'Referencia' },
]

function MilestoneNodeForm({ config, onChange }: { config: MilestoneNodeConfig; onChange: (p: Partial<MilestoneNodeConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Etapa del journey">
        <select
          value={config.milestoneStage}
          onChange={e => onChange({ milestoneStage: e.target.value as MilestoneNodeConfig['milestoneStage'] })}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200"
        >
          {MILESTONE_STAGES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </FieldWrapper>
      <FieldWrapper label="Descripción (opcional)">
        <input
          type="text"
          value={config.milestoneDescription}
          onChange={e => onChange({ milestoneDescription: e.target.value })}
          placeholder="Ej: Primer contacto con el producto"
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
        />
      </FieldWrapper>
      <p className="text-[11px] text-slate-500 italic">
        Marca una etapa del journey. Todos los contactos pasan.
      </p>
    </div>
  )
}

function FixedCostNodeForm({ config, onChange }: { config: FixedCostNodeConfig; onChange: (p: Partial<FixedCostNodeConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Concepto" tooltip="Ej: Hosting, Herramientas, Equipo">
        <input
          type="text"
          value={config.costConcept}
          onChange={e => onChange({ costConcept: e.target.value })}
          placeholder="Ej: Hosting"
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
        />
      </FieldWrapper>
      <FieldWrapper label="Costo mensual ($)">
        <NumberInput value={config.monthlyCost} onChange={v => onChange({ monthlyCost: v })} min={0} step={10} />
      </FieldWrapper>
      <FieldWrapper label="Es recurrente">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ isRecurring: !config.isRecurring })}
            className={`w-10 h-5 rounded-full transition-colors relative ${config.isRecurring ? 'bg-orange-500' : 'bg-[#333]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-[12px] text-slate-400">{config.isRecurring ? 'Sí' : 'No'}</span>
        </div>
      </FieldWrapper>
    </div>
  )
}

function RecurringRevenueNodeForm({ config, onChange }: { config: RecurringRevenueConfig; onChange: (p: Partial<RecurringRevenueConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="MRR por cliente ($)" benchmark="SaaS B2C: $9-99; B2B: $99-999">
        <NumberInput value={config.mrr} onChange={v => onChange({ mrr: v })} min={0} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Churn mensual (%)" benchmark="SaaS saludable: < 5% mensual">
        <SliderInput value={config.churnRate} onChange={v => onChange({ churnRate: v })} min={0} max={50} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="Meses proyectados">
        <NumberInput value={config.months} onChange={v => onChange({ months: v })} min={1} max={60} step={1} />
      </FieldWrapper>
      <FieldWrapper label="Crecimiento mensual (%)" benchmark="SaaS en growth: 2-5% mensual">
        <SliderInput value={config.growthRate ?? 3} onChange={v => onChange({ growthRate: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

// ─── Formularios: Tráfico orgánico legado ────────────────────────────────────

function OrganicSourceForm({ config, onChange }: { config: OrganicTrafficConfig; onChange: (p: Partial<OrganicTrafficConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Alcance / audiencia mensual">
        <NumberInput value={config.reach} onChange={v => onChange({ reach: v })} min={0} step={100} />
      </FieldWrapper>
      <FieldWrapper label="Engagement (%)" benchmark="Instagram: 2-6% | TikTok: 5-12%">
        <SliderInput value={config.engagementRate} onChange={v => onChange({ engagementRate: v })} min={0} max={100} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="CTR a siguiente paso (%)" benchmark="Orgánico: 1-5%">
        <SliderInput value={config.ctr} onChange={v => onChange({ ctr: v })} min={0} max={30} step={0.5} />
      </FieldWrapper>
    </div>
  )
}

function PaidSocialForm({ config, onChange }: { config: PaidSocialConfig; onChange: (p: Partial<PaidSocialConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Presupuesto mensual ($)">
        <NumberInput value={config.budget} onChange={v => onChange({ budget: v })} min={0} step={50} />
      </FieldWrapper>
      <FieldWrapper label="CPM ($)" benchmark="LinkedIn: $20-60 | Twitter: $6-12 | YouTube: $4-12">
        <NumberInput value={config.cpm} onChange={v => onChange({ cpm: v })} min={0} step={0.5} />
      </FieldWrapper>
      <FieldWrapper label="CTR (%)" benchmark="LinkedIn: 0.4-0.9% | YouTube: 0.5-2%">
        <SliderInput value={config.ctr} onChange={v => onChange({ ctr: v })} min={0} max={10} step={0.1} />
      </FieldWrapper>
    </div>
  )
}

// ─── Formularios: Utilidades restantes ───────────────────────────────────────

function StickyNoteForm({ config, onChange }: { config: NoteConfig; onChange: (p: Partial<NoteConfig>) => void }) {
  const COLORS = [
    { value: '#fef08a', label: 'Amarillo' },
    { value: '#fda4af', label: 'Rosa' },
    { value: '#93c5fd', label: 'Azul' },
    { value: '#86efac', label: 'Verde' },
  ]
  return (
    <div className="space-y-3">
      <FieldWrapper label="Texto">
        <textarea
          value={config.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Escribe una nota..."
          rows={4}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600 resize-none"
        />
      </FieldWrapper>
      <FieldWrapper label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => onChange({ color: c.value })}
              className="w-7 h-7 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: c.value,
                borderColor: config.color === c.value ? '#f97316' : 'transparent',
              }}
            />
          ))}
        </div>
      </FieldWrapper>
    </div>
  )
}

function GroupContainerForm({ config, onChange }: { config: NoteConfig; onChange: (p: Partial<NoteConfig>) => void }) {
  return (
    <div className="space-y-3">
      <FieldWrapper label="Nombre del grupo">
        <input
          type="text"
          value={config.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Ej: Fase de Captación"
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600"
        />
      </FieldWrapper>
      <p className="text-[11px] text-slate-500 italic">
        Agrupa nodos visualmente. No afecta la simulación.
      </p>
    </div>
  )
}

// ─── Panel principal (popup flotante) ────────────────────────────────────

const NODE_W = 220
const NODE_H = 120
const PANEL_W = 296
const GAP = 28

export default function NodeConfigPanel() {
  const selectedNode = useSelectedNode()
  const isOpen = useFunnelStore(s => s.isConfigPanelOpen)
  const mode = useFunnelStore(s => s.configPanelMode)
  const setMode = useFunnelStore(s => s.setConfigPanelMode)
  const hasSimulated = useFunnelStore(s => s.hasSimulated)
  const updateNodeConfig = useFunnelStore(s => s.updateNodeConfig)
  const updateNodeLabel = useFunnelStore(s => s.updateNodeLabel)
  const deleteNode = useFunnelStore(s => s.deleteNode)
  const duplicateNode = useFunnelStore(s => s.duplicateNode)
  const disconnectNode = useFunnelStore(s => s.disconnectNode)
  const toggleConfigPanel = useFunnelStore(s => s.toggleConfigPanel)
  const { x: vpX, y: vpY, zoom } = useViewport()

  const handleClose = useCallback(() => {
    toggleConfigPanel(false)
  }, [toggleConfigPanel])

  if (!isOpen || !selectedNode) return null

  const { nodeType, label, config, simResult } = selectedNode.data
  const def = NODE_DEFINITIONS[nodeType]
  const color = getNodeColor(nodeType)
  const inChain = simResult?.isInChain ?? false
  const canViewResults = hasSimulated && !!simResult && inChain

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfigChange = (patch: Partial<any>) => {
    updateNodeConfig(selectedNode.id, patch)
  }

  const renderForm = () => {
    switch (nodeType as FunnelNodeType) {
      case 'trafficEntry':  return <TrafficEntryForm config={config as TrafficEntryConfig} onChange={handleConfigChange} />
      case 'paidTraffic':   return <PaidTrafficForm config={config as PaidTrafficConfig} onChange={handleConfigChange} />
      case 'organicTraffic': return <OrganicTrafficForm config={config as OrganicChannelConfig} onChange={handleConfigChange} />
      case 'trafficSource': return <TrafficSourceForm config={config as TrafficSourceConfig} onChange={handleConfigChange} />
      case 'landingPage':   return <LandingPageForm config={config as LandingPageConfig} onChange={handleConfigChange} />
      case 'salesPage':     return <SalesPageForm config={config as SalesPageConfig} onChange={handleConfigChange} />
      case 'checkout':      return <CheckoutForm config={config as CheckoutConfig} onChange={handleConfigChange} />
      case 'upsell':        return <UpsellForm config={config as UpsellConfig} onChange={handleConfigChange} />
      case 'downsell':      return <DownsellForm config={config as DownsellConfig} onChange={handleConfigChange} />
      case 'orderBump':     return <OrderBumpForm config={config as OrderBumpConfig} onChange={handleConfigChange} />
      case 'emailSequence': return <EmailSequenceForm config={config as EmailSequenceConfig} onChange={handleConfigChange} />
      case 'whatsappSms':   return <WhatsAppSmsForm config={config as WhatsAppSmsConfig} onChange={handleConfigChange} />
      case 'webinarVsl':    return <WebinarVslForm config={config as WebinarVslConfig} onChange={handleConfigChange} />
      case 'retargeting':   return <RetargetingForm config={config as RetargetingConfig} onChange={handleConfigChange} />
      case 'appointment':      return <AppointmentForm config={config as AppointmentConfig} onChange={handleConfigChange} />
      // ─── Páginas de conversión ───
      case 'applicationPage':  return <ApplicationPageForm config={config as ApplicationPageConfig} onChange={handleConfigChange} />
      case 'tripwire':         return <TripwireForm config={config as TripwireConfig} onChange={handleConfigChange} />
      case 'catalogStore':     return <CatalogStoreForm config={config as CatalogStoreConfig} onChange={handleConfigChange} />
      case 'pricingPage':      return <PricingPageForm config={config as PricingPageConfig} onChange={handleConfigChange} />
      case 'freeTrialSignup':  return <FreeTrialSignupForm config={config as FreeTrialSignupConfig} onChange={handleConfigChange} />
      case 'thankYouOffer':    return <ThankYouOfferForm config={config as ThankYouOfferConfig} onChange={handleConfigChange} />
      // ─── Ventas y cierre ───
      case 'outboundCall':     return <OutboundCallForm config={config as OutboundCallConfig} onChange={handleConfigChange} />
      case 'inboundCall':      return <InboundCallForm config={config as InboundCallConfig} onChange={handleConfigChange} />
      case 'salesProposal':    return <SalesProposalForm config={config as SalesProposalConfig} onChange={handleConfigChange} />
      case 'productDemo':      return <ProductDemoForm config={config as ProductDemoConfig} onChange={handleConfigChange} />
      case 'trialToPaid':      return <TrialToPaidForm config={config as TrialToPaidConfig} onChange={handleConfigChange} />
      case 'physicalPos':      return <PhysicalPosForm config={config as PhysicalPosConfig} onChange={handleConfigChange} />
      case 'digitalContract':  return <DigitalContractForm config={config as DigitalContractConfig} onChange={handleConfigChange} />
      case 'salesNegotiation': return <SalesNegotiationForm config={config as SalesNegotiationConfig} onChange={handleConfigChange} />
      case 'eventSales':       return <EventSalesForm config={config as EventSalesConfig} onChange={handleConfigChange} />
      // ─── Follow-up y nurturing ───
      case 'pushNotifications':    return <PushNotificationsForm config={config as PushNotificationsConfig} onChange={handleConfigChange} />
      case 'dynamicRetargeting':   return <DynamicRetargetingForm config={config as DynamicRetargetingConfig} onChange={handleConfigChange} />
      case 'multichannelNurturing': return <MultichannelNurturingForm config={config as MultichannelNurturingConfig} onChange={handleConfigChange} />
      case 'cartAbandonmentSeq':   return <CartAbandonmentSeqForm config={config as CartAbandonmentSeqConfig} onChange={handleConfigChange} />
      case 'reEngagement':         return <ReEngagementForm config={config as ReEngagementConfig} onChange={handleConfigChange} />
      case 'dripCampaign':         return <DripCampaignForm config={config as DripCampaignConfig} onChange={handleConfigChange} />
      // ─── Post-venta y retención ───
      case 'onboardingSeq':        return <OnboardingSeqForm config={config as OnboardingSeqConfig} onChange={handleConfigChange} />
      case 'reviewRequest':        return <ReviewRequestForm config={config as ReviewRequestConfig} onChange={handleConfigChange} />
      case 'referralProgram':      return <ReferralProgramForm config={config as ReferralProgramConfig} onChange={handleConfigChange} />
      case 'renewalUpsell':        return <RenewalUpsellForm config={config as RenewalUpsellConfig} onChange={handleConfigChange} />
      case 'postSaleSupport':      return <PostSaleSupportForm config={config as PostSaleSupportConfig} onChange={handleConfigChange} />
      case 'customerCommunity':    return <CustomerCommunityForm config={config as CustomerCommunityConfig} onChange={handleConfigChange} />
      case 'crossSell':            return <CrossSellForm config={config as CrossSellConfig} onChange={handleConfigChange} />
      case 'winBack':              return <WinBackForm config={config as WinBackConfig} onChange={handleConfigChange} />
      case 'loyaltyProgram':       return <LoyaltyProgramForm config={config as LoyaltyProgramConfig} onChange={handleConfigChange} />
      case 'npsSurvey':            return <NpsSurveyForm config={config as NpsSurveyConfig} onChange={handleConfigChange} />
      // ─── Contenido y engagement ───
      case 'blogSeo':              return <BlogSeoForm config={config as BlogSeoConfig} onChange={handleConfigChange} />
      case 'videoContent':         return <VideoContentForm config={config as VideoContentConfig} onChange={handleConfigChange} />
      case 'leadMagnet':           return <LeadMagnetForm config={config as LeadMagnetConfig} onChange={handleConfigChange} />
      case 'quizInteractive':      return <QuizInteractiveForm config={config as QuizInteractiveConfig} onChange={handleConfigChange} />
      case 'calculatorTool':       return <CalculatorToolForm config={config as CalculatorToolConfig} onChange={handleConfigChange} />
      case 'educationalCarousel':  return <EducationalCarouselForm config={config as EducationalCarouselConfig} onChange={handleConfigChange} />
      case 'ebookGuide':           return <EbookGuideForm config={config as EbookGuideConfig} onChange={handleConfigChange} />
      case 'resourceTemplate':     return <ResourceTemplateForm config={config as ResourceTemplateConfig} onChange={handleConfigChange} />
      case 'webinarReplay':        return <WebinarReplayForm config={config as WebinarReplayConfig} onChange={handleConfigChange} />
      case 'caseStudy':            return <CaseStudyForm config={config as CaseStudyConfig} onChange={handleConfigChange} />
      // ─── Agentes de IA ───
      case 'aiWhatsapp':           return <AiWhatsappForm config={config as AiWhatsappConfig} onChange={handleConfigChange} />
      case 'aiWebChat':            return <AiWebChatForm config={config as AiWebChatConfig} onChange={handleConfigChange} />
      case 'aiVoice':              return <AiVoiceForm config={config as AiVoiceConfig} onChange={handleConfigChange} />
      case 'aiInstagramDm':        return <AiInstagramDmForm config={config as AiInstagramDmConfig} onChange={handleConfigChange} />
      case 'aiEmail':              return <AiEmailForm config={config as AiEmailConfig} onChange={handleConfigChange} />
      case 'chatbotRules':         return <ChatbotRulesForm config={config as ChatbotRulesConfig} onChange={handleConfigChange} />
      case 'automationWorkflow':   return <AutomationWorkflowForm config={config as AutomationWorkflowConfig} onChange={handleConfigChange} />
      case 'aiLeadScoring':        return <AiLeadScoringForm config={config as AiLeadScoringConfig} onChange={handleConfigChange} />
      case 'aiContentPersonalization': return <AiContentPersonalizationForm config={config as AiContentPersonalizationConfig} onChange={handleConfigChange} />
      case 'aiSegmentation':       return <AiSegmentationForm config={config as AiSegmentationConfig} onChange={handleConfigChange} />
      // ─── Tracking ───
      case 'metaPixel':            return <MetaPixelForm config={config as MetaPixelConfig} onChange={handleConfigChange} />
      case 'googleTagManager':     return <GoogleTagManagerForm config={config as GoogleTagManagerConfig} onChange={handleConfigChange} />
      case 'googleAnalytics':      return <GoogleAnalyticsForm config={config as GoogleAnalyticsConfig} onChange={handleConfigChange} />
      case 'metaOfflineData':      return <MetaOfflineDataForm config={config as MetaOfflineDataConfig} onChange={handleConfigChange} />
      case 'utmTracking':          return <UtmTrackingForm config={config as UtmTrackingConfig} onChange={handleConfigChange} />
      case 'serverPostback':       return <ServerPostbackForm config={config as ServerPostbackConfig} onChange={handleConfigChange} />
      case 'crmAttribution':       return <CrmAttributionForm config={config as CrmAttributionConfig} onChange={handleConfigChange} />
      case 'heatmaps':             return <HeatmapsForm config={config as HeatmapsConfig} onChange={handleConfigChange} />
      case 'callTracking':         return <CallTrackingForm config={config as CallTrackingConfig} onChange={handleConfigChange} />
      case 'conversionApi':        return <ConversionApiForm config={config as ConversionApiConfig} onChange={handleConfigChange} />
      // ─── Utilidades ───
      case 'delayWait':            return <DelayWaitForm config={config as DelayConfig} onChange={handleConfigChange} />
      case 'conditionalBranch':    return <ConditionalBranchForm config={config as ConditionalBranchConfig} onChange={handleConfigChange} />
      case 'mergeNode':            return <MergeNodeForm />
      case 'kpiCheckpoint':        return <KpiCheckpointForm config={config as KpiCheckpointConfig} onChange={handleConfigChange} />
      case 'loopRecurrence':       return <LoopRecurrenceForm config={config as LoopRecurrenceConfig} onChange={handleConfigChange} />
      case 'milestoneNode':        return <MilestoneNodeForm config={config as MilestoneNodeConfig} onChange={handleConfigChange} />
      case 'fixedCostNode':        return <FixedCostNodeForm config={config as FixedCostNodeConfig} onChange={handleConfigChange} />
      case 'recurringRevenueNode': return <RecurringRevenueNodeForm config={config as RecurringRevenueConfig} onChange={handleConfigChange} />
      // ─── Fuentes orgánicas ───
      case 'reels':
      case 'organicPost':
      case 'podcast':
      case 'influencer':
      case 'community':
      case 'pr':
      case 'marketplace':
      case 'qrOffline':
        return <OrganicSourceForm config={config as OrganicTrafficConfig} onChange={handleConfigChange} />
      // ─── Ads sociales ───
      case 'linkedinAds':
      case 'twitterAds':
      case 'pinterestAds':
      case 'youtubeAds':
        return <PaidSocialForm config={config as PaidSocialConfig} onChange={handleConfigChange} />
      // ─── Utilidades restantes ───
      case 'stickyNote':       return <StickyNoteForm config={config as NoteConfig} onChange={handleConfigChange} />
      case 'abSplitTest':      return <SplitForm config={config as SplitConfig} onChange={handleConfigChange} />
      case 'groupContainer':   return <GroupContainerForm config={config as NoteConfig} onChange={handleConfigChange} />
      case 'split':         return <SplitForm config={config as SplitConfig} onChange={handleConfigChange} />
      case 'result':        return <p className="text-[12px] text-slate-500 italic">Este nodo solo muestra métricas acumuladas. No requiere configuración.</p>
      default: return null
    }
  }

  // ── Calcular posición en pantalla ─────────────────────────────────────────
  const wW = typeof window !== 'undefined' ? window.innerWidth : 1440
  const wH = typeof window !== 'undefined' ? window.innerHeight : 900
  const PANEL_MAX_H = Math.min(wH - 48, 600)

  const nodeScreenRight = vpX + (selectedNode.position.x + NODE_W) * zoom
  const nodeScreenMidY  = vpY + (selectedNode.position.y + NODE_H / 2) * zoom

  const fitsRight = nodeScreenRight + GAP + PANEL_W < wW - 8
  let panelLeft = fitsRight
    ? nodeScreenRight + GAP
    : vpX + selectedNode.position.x * zoom - PANEL_W - GAP

  let panelTop = nodeScreenMidY - PANEL_MAX_H / 2
  panelTop = Math.max(16, Math.min(panelTop, wH - PANEL_MAX_H - 16))

  const lineEndX = fitsRight ? panelLeft : panelLeft + PANEL_W
  const lineEndY = panelTop + PANEL_MAX_H / 2
  const cpX = (nodeScreenRight + lineEndX) / 2

  return (
    <>
      {/* ── Línea de conexión nodo → panel ─────────────────────────────── */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 49,
          overflow: 'visible',
        }}
      >
        <path
          d={`M ${nodeScreenRight} ${nodeScreenMidY} C ${cpX} ${nodeScreenMidY} ${cpX} ${lineEndY} ${lineEndX} ${lineEndY}`}
          stroke="rgba(249,115,22,0.25)"
          strokeWidth={1}
          strokeDasharray="5 4"
          fill="none"
        />
        <circle cx={nodeScreenRight} cy={nodeScreenMidY} r={2.5} fill="rgba(249,115,22,0.45)" />
        <circle cx={lineEndX} cy={lineEndY} r={2.5} fill="rgba(249,115,22,0.45)" />
      </svg>

      {/* ── Panel ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col overflow-hidden animate-fade-in"
        style={{
          position: 'fixed',
          left: panelLeft,
          top: panelTop,
          width: PANEL_W,
          maxHeight: PANEL_MAX_H,
          zIndex: 50,
          backgroundColor: '#141414',
          border: '1px solid #2e2e2e',
          borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-3 border-b border-[#252525] flex-shrink-0"
          style={{ borderLeftColor: color.icon, borderLeftWidth: 2, borderLeftStyle: 'solid' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: color.icon }}>
              {def.label}
            </p>
            <input
              type="text"
              value={label}
              onChange={e => updateNodeLabel(selectedNode.id, e.target.value)}
              className="text-[13px] font-semibold text-slate-100 bg-transparent border-none outline-none w-full mt-0.5 truncate"
              placeholder="Nombre del nodo"
            />
          </div>
          <div className="flex items-center gap-0.5">
            {/* Eye: ver resultados (solo si hubo simulación en este nodo) */}
            {canViewResults && (
              <button
                onClick={() => setMode(mode === 'results' ? 'config' : 'results')}
                title={mode === 'results' ? 'Ver configuración' : 'Ver resultados'}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  mode === 'results'
                    ? 'text-orange-400 bg-orange-500/10'
                    : 'text-slate-500 hover:text-orange-400 hover:bg-orange-500/10'
                )}
              >
                {mode === 'results' ? <Pencil size={13} /> : <Eye size={13} />}
              </button>
            )}
            {/* Desconectar todas las aristas del nodo */}
            <button
              onClick={() => disconnectNode(selectedNode.id)}
              title="Desconectar nodo (quitar todas las conexiones)"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Unlink size={13} />
            </button>
            <button
              onClick={() => duplicateNode(selectedNode.id)}
              title="Duplicar nodo"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => deleteNode(selectedNode.id)}
              title="Eliminar nodo"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Cuerpo: configuración o resultados */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 0 }}>
          {mode === 'results' && simResult ? (
            <>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold pb-1">
                Resultados de simulación
              </p>
              <NodeResultsView nodeType={nodeType} simResult={simResult} />
            </>
          ) : (
            <>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold pb-1">
                Configuración
              </p>
              {renderForm()}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
