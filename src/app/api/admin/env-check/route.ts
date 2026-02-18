import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase/server';

export async function GET() {
    try {
        // Solo administradores pueden ver esto por seguridad
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const envStatus = {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            url_value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
            anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
            node_env: process.env.NODE_ENV,
            all_keys: Object.keys(process.env).filter(k =>
                k.includes('SUPA') || k.includes('URL') || k.includes('KEY')
            )
        };

        return NextResponse.json(envStatus);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
