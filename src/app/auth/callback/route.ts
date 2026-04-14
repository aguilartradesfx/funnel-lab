import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // En Vercel el origen interno difiere del dominio público.
  // Usar x-forwarded-host para construir la URL de redirección correcta.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`)
  }

  // Crear el redirect PRIMERO para que Supabase pueda escribir la sesión
  // directamente sobre esta respuesta. El helper de server.ts usa next/headers
  // y las cookies no quedarían persistidas en el redirect response.
  const redirectResponse = NextResponse.redirect(`${baseUrl}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Escribir las cookies de sesión directamente en el redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return redirectResponse
}
