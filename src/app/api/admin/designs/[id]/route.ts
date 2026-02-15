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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const body = await request.json();
        const { name, description, image_url, price, price_small, price_medium, price_large, category_id, is_active } = body;

        const { data, error } = await supabase
            .from('designs')
            .update({
                name,
                description,
                image_url,
                price,
                price_small,
                price_medium,
                price_large,
                category_id,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const { error } = await supabase
            .from('designs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
