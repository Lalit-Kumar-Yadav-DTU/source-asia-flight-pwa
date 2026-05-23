import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Changed to an async function
export async function createClient() {
  // Await the cookie store promise explicitly for Next.js 16
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be safely ignored if handled via middleware
          }
        },
      },
    }
  )
}