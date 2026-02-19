import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect /admin routes
    const isLoginPage = request.nextUrl.pathname.startsWith('/auth/login')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

    if (isAdminRoute) {
        if (!user) {
            const url = new URL('/auth/login', request.url)
            url.searchParams.set('from', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        // Enforce Role Separation: Only 'admin' role can access /admin
        // Users (Customers) are blocked.
        // Check staff_users first
        const { data: staff } = await supabase
            .from('staff_users')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!staff) {
            // Fallback: Check if they are still an admin in the legacy profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    }

    if (isLoginPage && user) {
        // Redirection logic for logged-in users
        const { data: staff } = await supabase
            .from('staff_users')
            .select('id')
            .eq('id', user.id)
            .single()

        if (staff) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }

        // Fallback for redirect
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
