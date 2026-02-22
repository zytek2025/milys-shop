import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchBcvExchangeRate } from '@/lib/bcv-scraper';
import { isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // Allow access if admin OR if a secret key matches (for CRON jobs)
        const authHeader = request.headers.get('Authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev_secret_123';
        const isCron = authHeader === `Bearer ${cronSecret}`;

        if (!isCron && !(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const newRate = await fetchBcvExchangeRate();

        if (!newRate) {
            return NextResponse.json({ error: 'Failed to fetch rate from BCV' }, { status: 502 });
        }

        const supabase = await createClient();

        // Update the global store settings
        const { data, error } = await supabase
            .from('store_settings')
            .update({
                exchange_rate: newRate,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'global')
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            new_rate: newRate,
            updated_at: data.updated_at
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Support POST for same logic
export async function POST(request: NextRequest) {
    return GET(request);
}
