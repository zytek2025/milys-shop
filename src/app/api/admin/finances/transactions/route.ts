import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const accountId = searchParams.get('account_id');

        let query = supabase
            .from('finance_transactions')
            .select(`
                *,
                account:finance_accounts(name, currency),
                category:finance_categories(name, type)
            `)
            .order('transaction_date', { ascending: false })
            .limit(limit);

        if (accountId) query = query.eq('account_id', accountId);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            account_id,
            category_id,
            order_id,
            type,
            amount,
            description,
            transaction_date,
            exchange_rate, // Optional: uses current if not provided
            receipt_url // Optional: URL of uploaded receipt photo
        } = body;

        if (!account_id || !type || !amount) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch account currency
        const { data: account } = await supabase
            .from('finance_accounts')
            .select('currency')
            .eq('id', account_id)
            .single();

        if (!account) throw new Error('Cuenta no encontrada');

        // 2. Resolve exchange rate and USD equivalent
        let rate = exchange_rate;
        if (!rate && account.currency === 'VES') {
            // Get current store exchange rate
            const { data: settings } = await supabase.from('store_settings').select('exchange_rate').eq('id', 'global').single();
            rate = settings?.exchange_rate || 1;
        } else if (!rate) {
            rate = 1;
        }

        const amountUsd = account.currency === 'VES'
            ? Number(amount) / Number(rate)
            : Number(amount);

        // 3. Insert transaction (Trigger will update account balance)
        const { data, error } = await supabase
            .from('finance_transactions')
            .insert({
                account_id,
                category_id,
                order_id,
                type,
                amount: Number(amount),
                currency: account.currency,
                exchange_rate: Number(rate),
                amount_usd_equivalent: Number(amountUsd),
                description,
                receipt_url,
                transaction_date: transaction_date || new Date().toISOString(),
                created_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
