import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase/server';

export async function GET() {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const envStatus = {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            SERVICE_ROLE_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
            DATABASE_URL: !!process.env.DATABASE_URL,
            NODE_ENV: process.env.NODE_ENV,
        };

        return NextResponse.json(envStatus);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
