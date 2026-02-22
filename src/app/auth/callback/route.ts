import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    // if "next" is in the search params, use it as the redirect URL
    const next = requestUrl.searchParams.get('next') ?? '/';

    // Use environment variable for site URL in production to avoid localhost issues
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

    if (code) {
        const supabase = await createClient();
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session?.user) {
            // Manual Profile Sync Fallback
            // Even if the trigger fails, this ensures a profile exists upon login
            try {
                const { createAdminClient } = await import('@/lib/supabase/server');
                const adminClient = await createAdminClient();

                // Check if profile exists
                const { data: profile } = await adminClient
                    .from('profiles')
                    .select('id')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (!profile) {
                    console.log('Post-login Sync: Creating missing profile for', session.user.email);
                    const { error: profileError } = await adminClient
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email,
                            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
                            avatar_url: session.user.user_metadata?.avatar_url,
                            role: 'user',
                            crm_status: 'lead',
                            updated_at: new Date().toISOString()
                        });

                    if (profileError) console.error('Post-login Sync Error:', profileError.message);
                }
            } catch (err) {
                console.error('Post-login Sync Exception:', err);
            }

            // User is successfully logged in. Redirect them to the intended page.
            return NextResponse.redirect(`${siteUrl}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${siteUrl}/login?error=auth-callback-failed`);
}
