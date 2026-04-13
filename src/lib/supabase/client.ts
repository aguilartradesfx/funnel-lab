import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback values prevent @supabase/ssr from throwing during
  // Next.js static shell generation (build time, no env vars present).
  // Real requests only happen in the browser where env vars are always set.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL    ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}
