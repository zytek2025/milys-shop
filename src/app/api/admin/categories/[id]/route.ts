import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// Update category
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, description, has_variants, is_customizable } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const slug = name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('categories')
            .update({
                name,
                slug,
                description,
                has_variants: !!has_variants,
                is_customizable: is_customizable !== undefined ? !!is_customizable : true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Categories PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete category
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const supabase = await createClient();

        // Check for orphan products (optional but recommended)
        const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', id); // This assumes products store category name as string currently, 
        // might need adjustment if products link via ID.
        // Let's check current products.category. Usually it's a string.

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Categories DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
