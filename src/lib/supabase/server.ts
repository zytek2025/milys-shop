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
    console.error('isAdmin check: No user session found', {
      authError: authError?.message,
      hasUser: !!user,
      env: process.env.NODE_ENV
    });
    return false;
  }

  console.log('isAdmin check: Finding roles for User ID:', user.id);

  // Use Admin Client to bypass RLS for strictly checking roles
  const adminClient = await createAdminClient();

  // 1. Check staff_users table first (New System)
  const { data: staff, error: staffError } = await adminClient
    .from('staff_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (staff) {
    console.log('isAdmin check: Authorized via staff_users table');
    return true;
  }

  if (staffError) console.error('isAdmin check: staff_users error', staffError);

  // 2. Fallback: Check profiles table (Legacy System)
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) console.error('isAdmin check: profiles error', profileError);

  const isProfileAdmin = profile?.role === 'admin';
  console.log('isAdmin check: Authorized via profiles table?', isProfileAdmin);

  return isProfileAdmin;
}
