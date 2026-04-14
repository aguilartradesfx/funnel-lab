// Webhooks fire-and-forget hacia n8n.
// Si la URL no está configurada o falla, se loggea y sigue sin interrumpir al usuario.

export interface WebhookUserCreated {
  event: 'user_created'
  timestamp: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string
    auth_provider: 'email' | 'google'
    created_at: string
  }
}

export interface WebhookOnboardingCompleted {
  event: 'onboarding_completed'
  timestamp: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string
    company_name: string
    team_size: string
    industry: string
  }
}

async function sendWebhook(url: string, payload: object): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.warn(`[webhook] ${url} → HTTP ${res.status}`)
    }
  } catch (err) {
    console.warn('[webhook] Error enviando webhook:', err)
  }
}

export function fireUserCreated(payload: WebhookUserCreated): void {
  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_USER_CREATED
    ?? process.env.N8N_WEBHOOK_USER_CREATED
  if (!url) return
  // fire-and-forget: no await
  void sendWebhook(url, payload)
}

export function fireOnboardingCompleted(payload: WebhookOnboardingCompleted): void {
  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_ONBOARDING_COMPLETED
    ?? process.env.N8N_WEBHOOK_ONBOARDING_COMPLETED
  if (!url) return
  void sendWebhook(url, payload)
}
