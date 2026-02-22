import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();

        // 1. Total Products & Variants
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { count: variantCount } = await supabase
            .from('product_variants')
            .select('*', { count: 'exact', head: true });

        // 2. Low Stock Items (threshold < 5)
        const { count: lowStockCount } = await supabase
            .from('product_variants')
            .select('*', { count: 'exact', head: true })
            .lt('stock', 5);

        // 3. Stock Value & Cost (Sum of price/cost * stock)
        const { data: stockData, error: stockError } = await supabase
            .from('product_variants')
            .select('stock, price_override, last_unit_cost, product:products(price, last_unit_cost)');

        if (stockError) throw stockError;

        let totalValue = 0;
        let totalCostValue = 0;
        let totalItems = 0;

        stockData?.forEach((v: any) => {
            const price = v.price_override || v.product?.price || 0;
            const cost = v.last_unit_cost || v.product?.last_unit_cost || 0;
            const stock = v.stock || 0;
            totalValue += price * stock;
            totalCostValue += cost * stock;
            totalItems += stock;
        });

        // 4. Stock by Category
        const { data: categoryData, error: catError } = await supabase
            .from('products')
            .select(`
                category,
                product_variants (stock)
            `);

        if (catError) throw catError;

        const categoryStats: Record<string, number> = {};
        categoryData?.forEach((p: any) => {
            const catName = p.category || 'Sin Categoría';
            const pStock = p.product_variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
            categoryStats[catName] = (categoryStats[catName] || 0) + pStock;
        });

        return NextResponse.json({
            productCount,
            variantCount,
            lowStockCount,
            totalValue,
            totalCostValue,
            expectedProfit: totalValue - totalCostValue,
            totalItems,
            categoryStats
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
