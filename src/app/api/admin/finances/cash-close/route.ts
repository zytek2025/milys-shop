import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// GET: List cash closings (with optional date filter)
export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const limit = parseInt(searchParams.get('limit') || '30');

        let query = supabase
            .from('cash_closings')
            .select('*')
            .order('close_date', { ascending: false })
            .limit(limit);

        if (date) {
            query = query.eq('close_date', date);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a cash closing for a specific date
export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const body = await request.json();
        const { close_date, notes } = body;

        if (!close_date) {
            return NextResponse.json({ error: 'Fecha de cierre requerida' }, { status: 400 });
        }

        // Check if closing already exists for this date
        const { data: existing } = await supabase
            .from('cash_closings')
            .select('id')
            .eq('close_date', close_date)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Ya existe un cierre para esta fecha' }, { status: 409 });
        }

        // Fetch all transactions for the date
        const startDate = `${close_date}T00:00:00`;
        const endDate = `${close_date}T23:59:59`;

        const { data: transactions } = await supabase
            .from('finance_transactions')
            .select(`
                *,
                account:finance_accounts(name, currency, type),
                category:finance_categories(name, type)
            `)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);

        const txs = transactions || [];

        // Calculate totals
        const total_income_usd = txs
            .filter(t => t.type === 'income' && (t.currency === 'USD' || t.account?.currency === 'USD'))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const total_income_ves = txs
            .filter(t => t.type === 'income' && (t.currency === 'VES' || t.account?.currency === 'VES'))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const total_expense_usd = txs
            .filter(t => t.type === 'expense' && (t.currency === 'USD' || t.account?.currency === 'USD'))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const total_expense_ves = txs
            .filter(t => t.type === 'expense' && (t.currency === 'VES' || t.account?.currency === 'VES'))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Count orders
        const total_orders = new Set(txs.filter(t => t.order_id).map(t => t.order_id)).size;

        // Build summary by account
        const accountSummary: Record<string, { name: string; currency: string; income: number; expense: number; net: number }> = {};
        txs.forEach(tx => {
            const accName = tx.account?.name || 'Desconocida';
            const accCurrency = tx.account?.currency || 'USD';
            const key = `${accName}-${accCurrency}`;
            if (!accountSummary[key]) {
                accountSummary[key] = { name: accName, currency: accCurrency, income: 0, expense: 0, net: 0 };
            }
            if (tx.type === 'income') {
                accountSummary[key].income += Number(tx.amount);
            } else {
                accountSummary[key].expense += Number(tx.amount);
            }
            accountSummary[key].net = accountSummary[key].income - accountSummary[key].expense;
        });

        // Build summary by category
        const categorySummary: Record<string, { name: string; type: string; total: number }> = {};
        txs.forEach(tx => {
            const catName = tx.category?.name || 'Sin categoría';
            const catType = tx.type;
            const key = `${catName}-${catType}`;
            if (!categorySummary[key]) {
                categorySummary[key] = { name: catName, type: catType, total: 0 };
            }
            categorySummary[key].total += Number(tx.amount_usd_equivalent || tx.amount);
        });

        const summary_json = {
            by_account: Object.values(accountSummary),
            by_category: Object.values(categorySummary),
            transaction_count: txs.length,
        };

        // Insert closing
        const { data, error } = await supabase
            .from('cash_closings')
            .insert({
                close_date,
                summary_json,
                total_income_usd,
                total_income_ves,
                total_expense_usd,
                total_expense_ves,
                total_orders,
                notes,
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
