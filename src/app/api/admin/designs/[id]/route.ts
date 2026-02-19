import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
