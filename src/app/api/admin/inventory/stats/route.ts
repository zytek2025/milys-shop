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

        // 3. Stock Value (Sum of price * stock)
        // Note: This is an estimation. For precise calculation we might need a stored procedure
        // or fetch all data (careful with large datasets).
        // For efficiency in large catalogs, we'll fetch just stock and price columns.
        const { data: stockData, error: stockError } = await supabase
            .from('product_variants')
            .select('stock, price_override, product:products(price)');

        if (stockError) throw stockError;

        let totalValue = 0;
        let totalItems = 0;

        stockData?.forEach((v: any) => {
            const price = v.price_override || v.product?.price || 0;
            const stock = v.stock || 0;
            totalValue += price * stock;
            totalItems += stock;
        });

        // 4. Stock by Category
        // We need to join products -> categories
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
            totalItems,
            categoryStats
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
