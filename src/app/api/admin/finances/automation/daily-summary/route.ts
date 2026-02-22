import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev_secret_123';
        const isCron = authHeader === `Bearer ${cronSecret}`;

        if (!isCron && !(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const today = new Date().toISOString().split('T')[0];
        const startDate = `${today}T00:00:00`;
        const endDate = `${today}T23:59:59`;

        // Fetch today's transactions
        const { data: transactions, error } = await supabase
            .from('finance_transactions')
            .select(`
                *,
                account:finance_accounts(name, currency),
                category:finance_categories(name)
            `)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);

        if (error) throw error;

        const txs = transactions || [];

        // Calculate Totals
        const incomeUSD = txs.filter(t => t.type === 'income' && t.currency === 'USD').reduce((s, t) => s + Number(t.amount), 0);
        const incomeVES = txs.filter(t => t.type === 'income' && t.currency === 'VES').reduce((s, t) => s + Number(t.amount), 0);
        const expenseUSD = txs.filter(t => t.type === 'expense' && t.currency === 'USD').reduce((s, t) => s + Number(t.amount), 0);
        const expenseVES = txs.filter(t => t.type === 'expense' && t.currency === 'VES').reduce((s, t) => s + Number(t.amount), 0);

        const ordersCount = new Set(txs.filter(t => t.order_id).map(t => t.order_id)).size;

        // Formatted Text for WhatsApp/Telegram
        const dateStr = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });

        let reportText = `📊 *RESUMEN FINANCIERO - ${dateStr.toUpperCase()}*\n\n`;
        reportText += `✅ *INGRESOS:* \n   💵 $${incomeUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n   🇻🇪 Bs ${incomeVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n\n`;
        reportText += `❌ *EGRESOS:* \n   💵 $${expenseUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n   🇻🇪 Bs ${expenseVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n\n`;
        reportText += `🛍️ *PEDIDOS:* ${ordersCount}\n`;
        reportText += `📝 *MOVIMIENTOS:* ${txs.length}\n\n`;

        if (txs.length > 0) {
            reportText += `🏦 *POR CUENTA:*\n`;
            const byAccount: Record<string, number> = {};
            txs.forEach(t => {
                const key = `${t.account?.name || 'Otras'} (${t.currency})`;
                byAccount[key] = (byAccount[key] || 0) + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
            });
            Object.entries(byAccount).forEach(([acc, net]) => {
                const icon = net >= 0 ? '🔹' : '🔸';
                reportText += `${icon} ${acc}: ${net >= 0 ? '+' : ''}${net.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n`;
            });
        }

        return NextResponse.json({
            summary: {
                income_usd: incomeUSD,
                income_ves: incomeVES,
                expense_usd: expenseUSD,
                expense_ves: expenseVES,
                orders_count: ordersCount,
                transaction_count: txs.length
            },
            formatted_text: reportText
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
