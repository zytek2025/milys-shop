import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// helper to check admin role
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

// GET /api/admin/products - List all products (including low stock)
export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, price, category, stock, image_url, variants } = body;

        const { data: product, error } = await supabase
            .from('products')
            .insert({ name, description, price, category, stock, image_url })
            .select()
            .single();

        if (error) throw error;

        // Bulk insert variants
        if (variants && variants.length > 0) {
            const variantData = variants.map((v: any) => ({
                product_id: product.id,
                size: v.size,
                color: v.color_name,
                color_hex: v.color,
                stock: parseInt(v.stock || 0),
                price_override: v.price_override ? parseFloat(v.price_override) : null
            }));

            await supabase.from('product_variants').insert(variantData);
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
