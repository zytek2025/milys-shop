import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 'global')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await request.json();

        const { data, error } = await supabase
            .from('store_settings')
            .upsert({
                id: 'global',
                ...body,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
