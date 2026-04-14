import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  // Supabase redirects here with ?error=...&error_description=... when OAuth fails
  // (e.g. provider not configured, redirect URI mismatch, user cancelled).
  // Forward the real message so we can diagnose.
  const oauthError = searchParams.get('error')
  const oauthErrorDescription = searchParams.get('error_description')

  if (!code) {
    const msg = oauthErrorDescription || oauthError || 'auth_callback_failed'
    console.error('[auth/callback] no code received:', { oauthError, oauthErrorDescription })
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(msg)}`
    )
  }

  // Collect cookies written during the exchange — applied to the final response
  // after we know the destination (can't pre-create the redirect response).
  const cookiesToApply: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => cookiesToApply.push(c))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error?.message ?? 'auth_callback_failed')}`
    )
  }

  // Determine destination based on profile state.
  // The handle_new_user trigger runs synchronously, so the row already exists.
  let destination = '/dashboard'

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, onboarding_completed')
      .eq('id', data.user.id)
      .single()

    if (!profile?.phone) {
      destination = '/onboarding/complete-profile'
    } else if (!profile?.onboarding_completed) {
      destination = '/onboarding'
    }
  } catch (profileErr) {
    // If profile query fails, send to dashboard — worst case they'll be redirected later
    console.error('[auth/callback] profile query error:', profileErr)
  }

  const response = NextResponse.redirect(`${baseUrl}${destination}`)

  // Write all session cookies onto the final redirect response
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
