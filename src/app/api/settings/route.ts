import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('personalization_price_small, personalization_price_large, design_price_small, design_price_medium, design_price_large, pago_movil_info, zelle_info, whatsapp_number, instagram_handle, telegram_username, facebook_url, contact_email, tiktok_handle, pinterest_handle, payment_methods')
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
