import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { count, error } = await supabase
            .from('promotions')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

        if (error) throw error;

        return NextResponse.json({ hasActivePromotions: (count || 0) > 0 });
    } catch (error: any) {
        return NextResponse.json({ hasActivePromotions: false, error: error.message }, { status: 500 });
    }
}
