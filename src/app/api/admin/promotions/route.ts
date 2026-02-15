import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function isAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

// GET /api/admin/promotions - List all promotions
export async function GET() {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/promotions - Create a new promotion
export async function POST(req: Request) {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('promotions')
            .insert([body])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
