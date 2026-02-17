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
    throw new Error('CONFIG_ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Administrative actions (like deleting users) require this key.');
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log('isAdmin check: Profile error', profileError);
  }

  console.log('isAdmin check: User', user.email, 'Role:', profile?.role);
  return profile?.role === 'admin';
}
