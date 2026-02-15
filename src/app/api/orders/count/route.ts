import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ count: 0 });
        }

        // Count completed or processing orders for this user
        const { data, error } = await supabase
            .from('orders')
            .select('id, total')
            .eq('user_id', user.id)
            .in('status', ['completed', 'processing']); // Only count non-cancelled/pending orders

        if (error) throw error;

        return NextResponse.json({
            count: data.length,
            orders: data
        });
    } catch (error: any) {
        console.error('API Orders Count error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
