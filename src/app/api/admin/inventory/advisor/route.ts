import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { items, exchange_rate } = await request.json();
        const supabase = await createClient();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        const recommendations: any = {};

        for (const item of items) {
            const itemId = item.id;
            const isVariant = item.type === 'variant';

            // 1. Get Historical Sales Data for Rotation
            const { data: salesData, error: salesError } = await supabase
                .from('order_items')
                .select('quantity, created_at')
                .eq(isVariant ? 'variant_id' : 'product_id', itemId)
                .order('created_at', { ascending: false })
                .limit(50);

            // 2. Calculate rotation speed (average days between sales)
            let rotationMsg = "No hay suficientes datos de venta para este producto.";
            if (salesData && salesData.length > 1) {
                const dates = salesData.map(s => new Date(s.created_at).getTime());
                const diffs: number[] = [];
                for (let i = 0; i < dates.length - 1; i++) {
                    diffs.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
                }
                const avgDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                rotationMsg = `Este producto se vende cada ${avgDays.toFixed(1)} días en promedio.`;
                if (avgDays < 3) rotationMsg += " Es un producto de Alta Rotación.";
                else if (avgDays > 15) rotationMsg += " Rotación lenta, considera promociones.";
            }

            // 3. Margin Suggestion
            // Standard strategy: 30% for slow, 40-50% for high demand, 20-25% for staples
            let suggestedMargin = 30;
            if (rotationMsg.includes("Alta Rotación")) suggestedMargin = 35;

            const cost = parseFloat(item.cost) || 0;
            const suggestedPrice = cost * (1 + suggestedMargin / 100);

            recommendations[itemId] = {
                rotation: rotationMsg,
                margin: `Sugerimos un margen del ${suggestedMargin}% basado en la rotación.`,
                price: suggestedPrice.toFixed(2),
                raw_margin: suggestedMargin
            };
        }

        // For the summary recommendation (aggregate)
        const firstId = items[0].id;
        const mainRec = recommendations[firstId];

        return NextResponse.json({
            margin: mainRec.margin,
            stock: mainRec.rotation,
            price: `$${mainRec.price} USD (Bs. ${(parseFloat(mainRec.price) * (exchange_rate || 1)).toFixed(2)})`,
            all_recommendations: recommendations
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
