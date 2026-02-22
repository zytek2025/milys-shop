import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Try fetching all settings
        let { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('id', 'global')
            .single();

        // If it fails (likely due to missing columns like bcv_last_sync_at), try a safer minimal fetch
        if (error) {
            console.warn('API Settings: Full fetch failed, trying minimal fallback', error.message);
            const { data: minData, error: minError } = await supabase
                .from('store_settings')
                .select('store_country, currency_symbol, exchange_rate')
                .eq('id', 'global')
                .single();

            if (minError) {
                console.error('API Settings: Minimal fetch also failed', minError.message);
            } else {
                data = minData;
                error = null;
            }
        }

        // Return data or defaults
        const settings = data || {
            store_country: 'VE',
            currency_symbol: 'Bs',
            exchange_rate: 60.0,
            personalization_price_small: 1.00,
            personalization_price_large: 3.00
        };

        // Inject currency into payment methods
        if (settings.payment_methods && Array.isArray(settings.payment_methods)) {
            try {
                // Using admin client to read finance_accounts safely
                const { createAdminClient } = await import('@/lib/supabase/server');
                const adminClient = await createAdminClient();
                const { data: accounts } = await adminClient.from('finance_accounts').select('id, currency');

                if (accounts) {
                    settings.payment_methods = settings.payment_methods.map((pm: any) => {
                        const account = accounts.find(a => a.id === pm.account_id);
                        return {
                            ...pm,
                            currency: account?.currency || 'USD'
                        };
                    });
                }
            } catch (err) {
                console.error('API Settings: Could not inject payment method currencies', err);
            }
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('API Settings Critical Error:', error.message);
        return NextResponse.json({
            store_country: 'VE',
            currency_symbol: 'Bs',
            exchange_rate: 60.0,
            error: error.message
        });
    }
}
