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
            .select('total, status')
            .order('created_at', { ascending: false })
            .limit(100);

        const validOrders = recentOrders?.filter(o => o.status === 'completed' || o.status === 'shipped') || [];
        const totalRevenue = validOrders.reduce((acc, order) => acc + (order.total || 0), 0);

        // Get expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount');

        const totalExpenses = expenses?.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0) || 0;
        const netProfit = totalRevenue - totalExpenses;

        return NextResponse.json({
            productsCount: productsCount || 0,
            ordersCount: ordersCount || 0,
            totalRevenue,
            totalExpenses,
            netProfit
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
