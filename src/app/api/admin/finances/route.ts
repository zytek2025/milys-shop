import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET() {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();

        // 1. Total Revenue from Completed Orders
        const { data: ordersData } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'completed');

        const totalRevenue = ordersData?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

        // 2. Store Credit Liability (Total credit outstanding)
        const { data: profilesWithCredit } = await supabase
            .from('profiles')
            .select('id, full_name, email, store_credit')
            .gt('store_credit', 0)
            .order('store_credit', { ascending: false });

        const totalCreditLiability = profilesWithCredit?.reduce((acc, p) => acc + Number(p.store_credit || 0), 0) || 0;

        // 3. Returns Statistics
        const { data: returnsData } = await supabase
            .from('returns')
            .select('amount_credited');

        const totalReturnsAmount = returnsData?.reduce((acc, r) => acc + Number(r.amount_credited || 0), 0) || 0;
        const returnsCount = returnsData?.length || 0;

        // 4. Recent Credit History
        const { data: creditHistory } = await supabase
            .from('store_credit_history')
            .select(`
                *,
                profiles:profile_id (full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        return NextResponse.json({
            stats: {
                totalRevenue,
                totalCreditLiability,
                totalReturnsAmount,
                returnsCount,
            },
            topCustomersByCredit: profilesWithCredit?.slice(0, 5) || [],
            recentMovements: creditHistory || []
        });
    } catch (error: any) {
        console.error('Finance API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
