import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        const supabase = await createClient();

        // Search in products and select variants
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                control_id,
                price,
                stock,
                product_variants (
                    id,
                    size,
                    color,
                    stock,
                    price_override
                )
            `)
            .or(`name.ilike.%${query}%,control_id.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;

        // Flatten for the UI selection
        const results = (data || []).flatMap(p => {
            const variants = p.product_variants || [];
            if (variants.length === 0) {
                return [{
                    id: p.id,
                    type: 'product',
                    name: p.name,
                    control_id: p.control_id,
                    details: '---',
                    stock: p.stock || 0,
                    price: p.price || 0
                }];
            }
            return variants.map(v => ({
                id: v.id,
                product_id: p.id,
                type: 'variant',
                name: p.name,
                control_id: p.control_id,
                details: `${v.size} / ${v.color}`,
                stock: v.stock || 0,
                price: v.price_override || p.price || 0
            }));
        });

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
