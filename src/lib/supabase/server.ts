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
    throw new Error('CONFIG_ERROR: La SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor. Por favor, verifica las variables de entorno en AWS Amplify.');
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

  // Check staff_users table first (New System)
  const { data: staff } = await supabase
    .from('staff_users')
    .select('id, is_super_admin')
    .eq('id', user.id)
    .single();

  if (staff) {
    return true;
  }

  // Fallback: Check profiles table (Legacy System)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}
