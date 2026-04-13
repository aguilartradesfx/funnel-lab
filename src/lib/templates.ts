import type { Blueprint, FunnelRFNode, FunnelRFEdge } from './types'

// ─── Helper para crear nodos ──────────────────────────────────────────────────

function node(
  id: string,
  nodeType: FunnelRFNode['data']['nodeType'],
  label: string,
  x: number,
  y: number,
  config: Record<string, unknown>
): FunnelRFNode {
  return {
    id,
    type: 'funnelNode',
    position: { x, y },
    data: { nodeType, label, config: config as FunnelRFNode['data']['config'] },
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  pathType: NonNullable<FunnelRFEdge['data']>['pathType'] = 'default',
  sourceHandle?: string
): FunnelRFEdge {
  return {
    id,
    source,
    target,
    type: 'funnelEdge',
    sourceHandle: sourceHandle ?? (pathType === 'yes' ? 'output-yes' : pathType === 'no' ? 'output-no' : 'output'),
    targetHandle: 'input',
    data: { pathType },
  }
}

// ─── Blueprints ───────────────────────────────────────────────────────────────

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'lead-magnet',
    title: 'Lead Magnet Funnel',
    description: 'Capturá leads con un recurso gratuito y convertílos con una secuencia de emails hacia tu oferta principal.',
    category: 'general',
    tags: ['leads', 'email', 'infoproductos', 'básico'],
    idealFor: 'Coaches, consultores, creadores de contenido que quieren construir su lista de emails.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 1000, cpc: 0.50, cpm: 10, ctr: 2, monthlyVisitors: 5000,
      }),
      node('lp1', 'landingPage', 'Landing de Lead Magnet', 100, 220, {
        conversionRate: 40, bounceRate: 50,
      }),
      node('em1', 'emailSequence', 'Secuencia Nurturing (7 emails)', 100, 390, {
        emails: 7, openRate: 28, ctr: 4, conversionRate: 8,
      }),
      node('sp1', 'salesPage', 'Página de Ventas', 100, 560, {
        conversionRate: 4, price: 197,
      }),
      node('res1', 'result', 'Resultado Final', 100, 730, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'em1', 'yes', 'output-yes'),
      edge('e3', 'em1', 'sp1', 'yes', 'output-yes'),
      edge('e4', 'sp1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'webinar-funnel',
    title: 'Webinar Funnel',
    description: 'Registraciones a webinar, seguimiento por email y cierre en vivo con oferta post-webinar.',
    category: 'infoproductos',
    tags: ['webinar', 'live', 'high-ticket', 'email'],
    idealFor: 'Coaches de alta ticket, formadores, consultores con ofertas de $500 a $5,000.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 2000, cpc: 0.60, cpm: 12, ctr: 2.5, monthlyVisitors: 5000,
      }),
      node('lp1', 'landingPage', 'Registro al Webinar', 100, 220, {
        conversionRate: 35, bounceRate: 55,
      }),
      node('em1', 'emailSequence', 'Recordatorios (3 emails)', 100, 390, {
        emails: 3, openRate: 45, ctr: 25, conversionRate: 70,
      }),
      node('wb1', 'webinarVsl', 'Webinar en Vivo', 100, 560, {
        attendanceRate: 35, watchRate: 70, conversionRate: 12, price: 997,
      }),
      node('up1', 'upsell', 'Coaching 1-a-1', 100, 730, {
        price: 2997, acceptanceRate: 20,
      }),
      node('res1', 'result', 'Resultado Final', 100, 900, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'em1', 'yes', 'output-yes'),
      edge('e3', 'em1', 'wb1', 'yes', 'output-yes'),
      edge('e4', 'wb1', 'up1', 'yes', 'output-yes'),
      edge('e5', 'up1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'tripwire-funnel',
    title: 'Tripwire Funnel',
    description: 'Oferta de bajo precio para convertir prospectos en compradores y ascenderlos a ofertas mayores.',
    category: 'infoproductos',
    tags: ['tripwire', 'low-ticket', 'upsell', 'ecommerce'],
    idealFor: 'Negocios que quieren convertir audiencia fría en compradores con una oferta irresistible de $7-$47.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 1500, cpc: 0.45, cpm: 10, ctr: 2, monthlyVisitors: 5000,
      }),
      node('lp1', 'landingPage', 'Landing Oferta Tripwire', 100, 220, {
        conversionRate: 40, bounceRate: 50,
      }),
      node('ck1', 'checkout', 'Checkout $27', 100, 390, {
        price: 27, abandonmentRate: 60, processorFee: 3.5,
      }),
      node('ob1', 'orderBump', 'Order Bump (+$17)', 100, 560, {
        price: 17, acceptanceRate: 35,
      }),
      node('up1', 'upsell', 'Upsell Principal ($197)', 100, 730, {
        price: 197, acceptanceRate: 30,
      }),
      node('up2', 'upsell', 'Upsell Premium ($497)', 100, 900, {
        price: 497, acceptanceRate: 20,
      }),
      node('ds1', 'downsell', 'Downsell ($97)', 400, 900, {
        price: 97, acceptanceRate: 40,
      }),
      node('res1', 'result', 'Resultado Final', 100, 1070, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'ck1', 'yes', 'output-yes'),
      edge('e3', 'ck1', 'ob1', 'yes', 'output-yes'),
      edge('e4', 'ob1', 'up1', 'default', 'output'),
      edge('e5', 'up1', 'up2', 'yes', 'output-yes'),
      edge('e6', 'up1', 'ds1', 'no', 'output-no'),
      edge('e7', 'up2', 'res1', 'yes', 'output-yes'),
      edge('e8', 'ds1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'high-ticket-funnel',
    title: 'High-Ticket Funnel',
    description: 'VSL → Aplicación → Llamada de ventas → Cierre. Para ofertas de $2,000 a $25,000.',
    category: 'servicios',
    tags: ['high-ticket', 'llamada', 'vsl', 'coaching', 'consultoría'],
    idealFor: 'Coaches, consultores y agencias con servicios premium de alto valor.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 3000, cpc: 1.20, cpm: 15, ctr: 2, monthlyVisitors: 5000,
      }),
      node('vsl1', 'webinarVsl', 'VSL (Video de Venta)', 100, 220, {
        attendanceRate: 60, watchRate: 55, conversionRate: 100, price: 0,
      }),
      node('lp1', 'landingPage', 'Formulario de Aplicación', 100, 390, {
        conversionRate: 15, bounceRate: 70,
      }),
      node('ap1', 'appointment', 'Llamada de Estrategia', 100, 560, {
        bookingRate: 80, showRate: 70, closeRate: 35, price: 5000,
      }),
      node('res1', 'result', 'Resultado Final', 100, 730, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'vsl1', 'default', 'output'),
      edge('e2', 'vsl1', 'lp1', 'yes', 'output-yes'),
      edge('e3', 'lp1', 'ap1', 'yes', 'output-yes'),
      edge('e4', 'ap1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'ecommerce-funnel',
    title: 'E-commerce Funnel',
    description: 'Funnel completo para tienda online con upsell, downsell y retargeting.',
    category: 'ecommerce',
    tags: ['ecommerce', 'tienda', 'producto físico', 'upsell'],
    idealFor: 'Tiendas online, dropshipping, productos físicos y digitales con múltiples SKUs.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 2000, cpc: 0.40, cpm: 10, ctr: 2, monthlyVisitors: 5000,
      }),
      node('lp1', 'salesPage', 'Página de Producto', 100, 220, {
        conversionRate: 3, price: 0,
      }),
      node('ck1', 'checkout', 'Checkout', 100, 390, {
        price: 59, abandonmentRate: 68, processorFee: 3.5,
      }),
      node('ob1', 'orderBump', 'Order Bump (+$19)', 100, 560, {
        price: 19, acceptanceRate: 30,
      }),
      node('up1', 'upsell', 'Upsell (Pack Premium)', 100, 730, {
        price: 89, acceptanceRate: 25,
      }),
      node('ds1', 'downsell', 'Downsell (Mini Pack)', 400, 730, {
        price: 39, acceptanceRate: 40,
      }),
      node('rt1', 'retargeting', 'Retargeting Carrito', 400, 390, {
        captureRate: 60, cpc: 0.25, conversionRate: 8,
      }),
      node('res1', 'result', 'Resultado Final', 100, 900, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'ck1', 'yes', 'output-yes'),
      edge('e3', 'ck1', 'ob1', 'yes', 'output-yes'),
      edge('e4', 'ck1', 'rt1', 'no', 'output-no'),
      edge('e5', 'ob1', 'up1', 'default', 'output'),
      edge('e6', 'up1', 'res1', 'yes', 'output-yes'),
      edge('e7', 'up1', 'ds1', 'no', 'output-no'),
      edge('e8', 'ds1', 'res1', 'yes', 'output-yes'),
      edge('e9', 'rt1', 'ck1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'saas-trial-funnel',
    title: 'SaaS Trial Funnel',
    description: 'Anuncio → Landing → Registro gratuito → Onboarding emails → Upgrade a plan pago.',
    category: 'saas',
    tags: ['saas', 'software', 'trial', 'freemium', 'subscription'],
    idealFor: 'Startups y empresas de software que ofrecen período de prueba gratuito.',
    nodes: [
      node('ts1', 'trafficSource', 'Google Ads', 100, 50, {
        platform: 'google', costModel: 'cpc', budget: 3000, cpc: 2.50, cpm: 20, ctr: 5, monthlyVisitors: 5000,
      }),
      node('lp1', 'landingPage', 'Landing de Registro', 100, 220, {
        conversionRate: 25, bounceRate: 60,
      }),
      node('em1', 'emailSequence', 'Onboarding (14 emails)', 100, 390, {
        emails: 14, openRate: 35, ctr: 8, conversionRate: 15,
      }),
      node('sp1', 'salesPage', 'Página de Upgrade', 100, 560, {
        conversionRate: 25, price: 97,
      }),
      node('up1', 'upsell', 'Upgrade Anual (-20%)', 100, 730, {
        price: 970, acceptanceRate: 35,
      }),
      node('res1', 'result', 'Resultado Final', 100, 900, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'em1', 'yes', 'output-yes'),
      edge('e3', 'em1', 'sp1', 'yes', 'output-yes'),
      edge('e4', 'sp1', 'up1', 'yes', 'output-yes'),
      edge('e5', 'up1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'whatsapp-funnel',
    title: 'WhatsApp Funnel',
    description: 'Anuncio → WhatsApp → Conversación → Cita → Cierre de venta.',
    category: 'servicios',
    tags: ['whatsapp', 'conversación', 'cita', 'local', 'servicios'],
    idealFor: 'Negocios locales, servicios personales, coaches y consultores con venta conversacional.',
    nodes: [
      node('ts1', 'trafficSource', 'Facebook Ads', 100, 50, {
        platform: 'facebook', costModel: 'cpc', budget: 800, cpc: 0.35, cpm: 8, ctr: 2.5, monthlyVisitors: 5000,
      }),
      node('wa1', 'whatsappSms', 'WhatsApp Business', 100, 220, {
        deliveryRate: 92, responseRate: 45, conversionRate: 40,
      }),
      node('ap1', 'appointment', 'Consulta / Cita', 100, 390, {
        bookingRate: 60, showRate: 75, closeRate: 40, price: 500,
      }),
      node('em1', 'emailSequence', 'Follow-up Post-cita', 100, 560, {
        emails: 3, openRate: 40, ctr: 15, conversionRate: 20,
      }),
      node('res1', 'result', 'Resultado Final', 100, 730, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'wa1', 'default', 'output'),
      edge('e2', 'wa1', 'ap1', 'yes', 'output-yes'),
      edge('e3', 'ap1', 'res1', 'yes', 'output-yes'),
      edge('e4', 'ap1', 'em1', 'no', 'output-no'),
      edge('e5', 'em1', 'res1', 'yes', 'output-yes'),
    ],
  },

  {
    id: 'local-business-funnel',
    title: 'Local Business Funnel',
    description: 'Google Ads → Landing → Reserva → Follow-up → Review. Para negocios físicos locales.',
    category: 'local',
    tags: ['local', 'google', 'reservas', 'restaurante', 'salud', 'belleza'],
    idealFor: 'Restaurantes, clínicas, salones de belleza, gimnasios y cualquier negocio con clientes presenciales.',
    nodes: [
      node('ts1', 'trafficSource', 'Google Ads', 100, 50, {
        platform: 'google', costModel: 'cpc', budget: 600, cpc: 1.50, cpm: 15, ctr: 5, monthlyVisitors: 5000,
      }),
      node('lp1', 'landingPage', 'Landing Local', 100, 220, {
        conversionRate: 20, bounceRate: 60,
      }),
      node('ap1', 'appointment', 'Reserva / Cita', 100, 390, {
        bookingRate: 50, showRate: 80, closeRate: 90, price: 150,
      }),
      node('wa1', 'whatsappSms', 'Recordatorio WhatsApp', 400, 390, {
        deliveryRate: 95, responseRate: 70, conversionRate: 85,
      }),
      node('em1', 'emailSequence', 'Follow-up Post-servicio', 100, 560, {
        emails: 2, openRate: 40, ctr: 20, conversionRate: 50,
      }),
      node('res1', 'result', 'Resultado Final', 100, 730, {}),
    ],
    edges: [
      edge('e1', 'ts1', 'lp1', 'default', 'output'),
      edge('e2', 'lp1', 'ap1', 'yes', 'output-yes'),
      edge('e3', 'lp1', 'wa1', 'yes', 'output-yes'),
      edge('e4', 'ap1', 'em1', 'yes', 'output-yes'),
      edge('e5', 'em1', 'res1', 'default', 'output'),
    ],
  },
]

export function getBlueprintById(id: string): Blueprint | undefined {
  return BLUEPRINTS.find(b => b.id === id)
}

export function getBlueprintsByCategory(category: string): Blueprint[] {
  if (category === 'all') return BLUEPRINTS
  return BLUEPRINTS.filter(b => b.category === category)
}
