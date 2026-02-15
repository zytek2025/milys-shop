import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({
                error: 'Forbidden',
                details: `Acceso denegado para ${user.email}. Rol detectado: '${profile?.role || 'ninguno'}'.`
            }, { status: 403 });
        }

        // Get stats
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { data: recentOrders } = await supabase
            .from('orders')
            .select('total')
            .order('created_at', { ascending: false })
            .limit(100);

        const totalRevenue = recentOrders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

        return NextResponse.json({
            productsCount: productsCount || 0,
            ordersCount: ordersCount || 0,
            totalRevenue,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
