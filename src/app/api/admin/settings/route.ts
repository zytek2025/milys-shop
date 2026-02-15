import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function isAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    return profile?.role === 'admin';
}

export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
        if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
