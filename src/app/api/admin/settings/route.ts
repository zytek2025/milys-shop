import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Se requieren permisos de administrador' }, { status: 403 });
        }

        const body = await request.json();

        // Update global settings
        const { data, error } = await supabase
            .from('store_settings')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'global')
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Admin Settings Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
