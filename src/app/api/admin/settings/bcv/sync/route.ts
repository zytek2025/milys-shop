import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createAdminClient } from '@/lib/supabase/server';
import { fetchBcvExchangeRate } from '@/lib/bcv-scraper';

export async function POST(request: NextRequest) {
    try {
        let isAuthenticated = false;

        // 1. Check for Admin token
        if (await isAdmin()) {
            isAuthenticated = true;
        } else {
            // 2. Check for Authorization header (Bearer token) for n8n/cron
            const authHeader = request.headers.get('Authorization');
            const cronSecret = process.env.CRON_SECRET;

            if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized. Needs Admin session or valid Authorization header.' }, { status: 403 });
        }

        const newRate = await fetchBcvExchangeRate();

        if (!newRate) {
            return NextResponse.json({ error: 'No se pudo obtener la tasa del web del BCV. Intente más tarde.' }, { status: 500 });
        }

        const adminSupabase = await createAdminClient();

        const { error: updateError } = await adminSupabase
            .from('store_settings')
            .update({
                exchange_rate: newRate,
                bcv_last_sync_at: new Date().toISOString()
            })
            .eq('id', 'global');

        if (updateError) {
            // Fallback if bcv_last_sync_at column missing
            console.warn('[BCV Sync] Error with bcv_last_sync_at, falling back...', updateError);
            const { error: fallbackError } = await adminSupabase
                .from('store_settings')
                .update({ exchange_rate: newRate })
                .eq('id', 'global');

            if (fallbackError) throw fallbackError;
        }

        return NextResponse.json({
            success: true,
            message: 'Tipo de cambio actualizado correctamente',
            rate: newRate
        });

    } catch (error: any) {
        console.error('API Error [BCV Sync]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const rate = await fetchBcvExchangeRate();
        return NextResponse.json({ rate });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
