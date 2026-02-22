import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    // if "next" is in the search params, use it as the redirect URL
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // User is successfully logged in. Redirect them to the intended page.
            // Redirect to the home page (or the page they were trying to access).
            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-callback-failed`);
}
