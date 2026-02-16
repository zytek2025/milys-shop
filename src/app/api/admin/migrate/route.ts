import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();

        // Find products without variants
        const { data: products, error: pError } = await supabase
            .from('products')
            .select('*, product_variants(*)');

        if (pError) throw pError;

        const productsToMigrate = products.filter(p => !p.product_variants || p.product_variants.length === 0);

        const results: any[] = [];
        for (const p of productsToMigrate) {
            const { error: vError } = await supabase.from('product_variants').insert({
                product_id: p.id,
                size: 'Único',
                color: 'Único',
                color_hex: '#000000',
                stock: p.stock || 0
            });

            if (vError) {
                results.push({ id: p.id, status: 'error', error: vError.message });
            } else {
                results.push({ id: p.id, status: 'migrated' });
            }
        }

        return NextResponse.json({
            message: `Migración completada. ${results.filter(r => r.status === 'migrated').length} productos migrados.`,
            details: results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
