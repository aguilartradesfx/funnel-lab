import Stripe from 'stripe'

// Lazy singleton — no se instancia en build time, solo en runtime cuando hay request
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

// ── Price IDs ────────────────────────────────────────────────────────────────

export const PRICES = {
  starter:     'price_1TLpiYBsZkS4TPpPTgg5xAi1',
  pro:         'price_1TLpnyBsZkS4TPpPQNNKqiVD',
  max:         'price_1TLqlGBsZkS4TPpPYywtwqRI',
  credit_pack: 'price_1TLqxRBsZkS4TPpPshsMT7qT',
} as const

// ── Price → Plan mapping ──────────────────────────────────────────────────────

export const PRICE_TO_PLAN: Record<string, { plan: string; credits: number; projects: number; scenarios: number }> = {
  [PRICES.starter]: { plan: 'starter', credits: 0,   projects: 3,  scenarios: 1  },
  [PRICES.pro]:     { plan: 'pro',     credits: 150,  projects: 10, scenarios: 4  },
  [PRICES.max]:     { plan: 'max',     credits: 800,  projects: -1, scenarios: -1 },
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
