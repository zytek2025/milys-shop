import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createAdminClient();
    const testSku = `TEST-${Date.now()}`;
    let productId = '';
    let variantId = '';

    try {
        console.log('--- STARTING STOCK DEDUCTION TEST ---');

        // 1. Create Test Product (Simple)
        const { data: product, error: pError } = await supabase
            .from('products')
            .insert({
                name: 'Test Stock Product',
                description: 'Temporary product for system verification',
                price: 10.00,
                stock: 10, // Initial Stock
                category: 'verificacion',
                is_active: false
            })
            .select()
            .single();

        if (pError) throw new Error(`Product creation failed: ${pError.message}`);
        productId = product.id;
        console.log('1. Test Product Created:', productId);

        // 2. Create Test Variant
        const { data: variant, error: vError } = await supabase
            .from('product_variants')
            .insert({
                product_id: productId,
                size: 'TEST',
                color: 'TEST',
                stock: 10, // Initial Variant Stock
                price: 10.00
            })
            .select()
            .single();

        if (vError) throw new Error(`Variant creation failed: ${vError.message}`);
        variantId = variant.id;
        console.log('2. Test Variant Created:', variantId);

        // 3. Create Test Order with item linked to variant
        // We simulate what the checkout does: Insert into orders, then order_items
        const { data: order, error: oError } = await supabase
            .from('orders')
            .insert({
                user_id: (await supabase.auth.getUser()).data.user?.id, // Admin user
                status: 'pending',
                total: 10.00,
                full_name: 'System Test'
            })
            .select()
            .single();

        if (oError) throw new Error(`Order creation failed: ${oError.message}`);
        console.log('3. Test Order Created:', order.id);

        // 4. Insert Order Item (Quantity: 2) -> Should reduce stock by 2
        const { error: iError } = await supabase
            .from('order_items')
            .insert({
                order_id: order.id,
                product_id: productId,
                variant_id: variantId,
                quantity: 2,
                price: 10.00,
                name: 'Test Item'
            });

        if (iError) throw new Error(`Order Item creation failed: ${iError.message}`);
        console.log('4. Order Item Inserted (Qty: 2)');

        // 5. Verify Stock
        const { data: updatedVariant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', variantId)
            .single();

        const { data: updatedProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();

        console.log('5. Variant Stock Check:', updatedVariant?.stock);
        // Note: Simple product stock might not change if logic only targets variants, 
        // but verify anyway if you added fallback logic.

        const passed = updatedVariant?.stock === 8; // 10 - 2 = 8

        // CLEANUP
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        await supabase.from('product_variants').delete().eq('id', variantId);
        await supabase.from('products').delete().eq('id', productId);

        if (passed) {
            return NextResponse.json({ success: true, message: 'Stock deduction successfully verified.' });
        } else {
            return NextResponse.json({
                success: false,
                message: `Stock verification FAILED. Expected 8, got ${updatedVariant?.stock}. Trigger might be missing or broken.`
            }, { status: 500 });
        }

    } catch (error: any) {
        // Cleanup on error
        if (productId) await supabase.from('products').delete().eq('id', productId);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
