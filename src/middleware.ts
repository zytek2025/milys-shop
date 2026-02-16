import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protect /admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/', req.url))
        }

        // Optional: Check for specific admin role/claim if stored in metadata
        // For now, simple auth check is better than nothing
    }

    return res
}

export const config = {
    matcher: ['/admin/:path*'],
}
