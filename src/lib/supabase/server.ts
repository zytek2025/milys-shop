import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.length === 0) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from process.env');
    console.error('Available env keys (censored):', Object.keys(process.env).map(k => k.length > 5 ? k.substring(0, 3) + '...' : k));
    throw new Error(`CONFIG_ERROR: La SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor. (Env keys found: ${Object.keys(process.env).length})`);
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet) {
          // No cookies for admin client
        },
      },
    }
  )
}

export async function isAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('isAdmin check: No user found', authError);
    return false;
  }

  // Use Admin Client to bypass RLS for strictly checking roles
  const adminClient = await createAdminClient();

  // 1. Check staff_users table first (New System)
  const { data: staff } = await adminClient
    .from('staff_users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (staff) return true;

  // 2. Fallback: Check profiles table (Legacy System)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}
