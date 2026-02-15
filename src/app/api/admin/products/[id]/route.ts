import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, price, category, stock, image_url, variants } = body;
        const supabase = await createClient();

        const { data: updatedProducts, error } = await supabase
            .from('products')
            .update({ name, description, price, category, stock, image_url, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!updatedProducts || updatedProducts.length === 0) {
            return NextResponse.json({
                error: 'No se pudo actualizar el producto. Esto suele pasar por falta de permisos RLS o ID incorrecto.'
            }, { status: 404 });
        }

        const data = updatedProducts[0];

        // Sync variants
        if (variants) {
            // Eliminar variantes anteriores
            await supabase.from('product_variants').delete().eq('product_id', id);

            if (variants.length > 0) {
                const variantData = variants.map((v: any) => ({
                    product_id: id,
                    size: v.size,
                    color: v.color_name,
                    color_hex: v.color,
                    stock: parseInt(v.stock || 0),
                    price_override: v.price_override ? parseFloat(v.price_override) : null
                }));

                const { error: insertError } = await supabase.from('product_variants').insert(variantData);
                if (insertError) throw insertError;
            }
        }

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
        const { id } = await params;
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ message: 'Product deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
