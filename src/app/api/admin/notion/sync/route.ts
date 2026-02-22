
import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin, createAdminClient } from '@/lib/supabase/server';
import { syncToNotion, mapOrderToNotion } from '@/lib/notion';

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { order_id } = body;

        if (!order_id) {
            return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();

        // 1. Fetch order details
        const { data: order, error: orderError } = await adminSupabase
            .from('orders')
            .select(`
                *,
                profiles (email, full_name, whatsapp)
            `)
            .eq('id', order_id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        // 2. Resolve Notion Database ID
        // Priority: Request body > Env > Store Settings
        const { data: settings } = await adminSupabase.from('store_settings').select('notion_database_id').eq('id', 'global').single();
        const databaseId = body.database_id || process.env.NOTION_DATABASE_ID || settings?.notion_database_id;

        if (!databaseId) {
            return NextResponse.json({ error: 'ID de base de datos de Notion no configurado' }, { status: 400 });
        }

        // 3. Sync to Notion
        const properties = mapOrderToNotion(order);
        const result = await syncToNotion({
            databaseId,
            properties
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // 4. Update order to reflect sync status
        await adminSupabase.from('orders').update({ notion_synced: true }).eq('id', order_id);

        return NextResponse.json({ success: true, pageId: result.pageId });
    } catch (error: any) {
        console.error('Notion Sync API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
