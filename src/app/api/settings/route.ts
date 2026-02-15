import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 'global')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Default values if not found or error
        const settings = data || {
            personalization_price_small: 1.00,
            personalization_price_large: 3.00
        };

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
