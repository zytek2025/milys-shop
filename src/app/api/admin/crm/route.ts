import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// Get leads/customers for CRM
export async function GET() {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = await createClient();

        // Fetch profiles with their orders and items to calculate complex KPIs
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                *,
                age,
                city,
                gender,
                orders (
                    id,
                    total,
                    status,
                    created_at,
                    order_items (
                        product_name,
                        quantity,
                        custom_metadata
                    )
                )
            `)
            .eq('role', 'user')
            .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        // Process data for the CRM view
        const crmData = profiles.map((p: any) => {
            const allOrders = p.orders || [];
            const completedOrders = allOrders.filter((o: any) => o.status === 'completed');

            // 1. Basic Stats
            const ltv = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
            const orderCount = allOrders.length;
            const aov = completedOrders.length > 0 ? ltv / completedOrders.length : 0;

            // 2. Recency & Activity
            const lastOrderDate = allOrders.length > 0
                ? new Set(allOrders.map((o: any) => o.created_at)).values().next().value // They are already ordered by desc in most cases, but let's be safe
                : null;

            // 3. Top Products Aggregation
            const productCounts: Record<string, number> = {};
            let returnCount = 0;
            let totalItemsCount = 0;

            allOrders.forEach((o: any) => {
                o.order_items?.forEach((item: any) => {
                    totalItemsCount += item.quantity || 0;
                    if (item.custom_metadata?.is_returned) returnCount += item.quantity || 0;

                    const name = item.product_name || 'Producto Desconocido';
                    productCounts[name] = (productCounts[name] || 0) + (item.quantity || 0);
                });
            });

            const favoriteProducts = Object.entries(productCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name]) => name);

            const returnsRatio = totalItemsCount > 0 ? (returnCount / totalItemsCount) * 100 : 0;

            // 4. Segmentation Logic
            let segment = 'Lead';
            if (ltv > 500 && completedOrders.length >= 3) segment = 'Champion';
            else if (completedOrders.length >= 2) segment = 'Loyal';
            else if (completedOrders.length === 1) segment = 'New Customer';
            else if (allOrders.length > 0 && completedOrders.length === 0) segment = 'Interested';

            return {
                ...p,
                crm_status: p.crm_status || 'lead',
                segment,
                ltv,
                aov,
                orderCount,
                favoriteProducts,
                returnsRatio,
                totalItemsCount,
                lastOrderDate,
                lastActive: p.updated_at || p.created_at,
                full_history: allOrders // Include full history for the detailed modal
            };
        });

        return NextResponse.json(crmData);
    } catch (error: any) {
        console.error('CRM API GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update CRM profile details
export async function PUT(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, full_name, email } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name,
                email,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('CRM API PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a customer profile and auth user
export async function DELETE(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Check if user is an admin before deleting (safety)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (profile?.role === 'admin') {
            return NextResponse.json({ error: 'Cannot delete admin staff from CRM' }, { status: 400 });
        }

        // 2. Delete Auth user using Admin Client
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminClient = await createAdminClient();
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            // If user doesn't exist in Auth, we might still want to delete the profile
        }

        // 3. Delete Profile (RLS / Cascade should handle related data, but we do it explicitly if needed)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) throw profileError;

        return NextResponse.json({ success: true, message: 'Customer deleted' });
    } catch (error: any) {
        console.error('CRM API DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
