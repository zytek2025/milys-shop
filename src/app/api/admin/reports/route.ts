import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'overview'; // overview, sales, inventory, finances
        const period = searchParams.get('period') || '30days'; // 7days, 30days, all

        // Date filtering logic
        const now = new Date();
        let startDate = new Date();
        if (period === '7days') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === '30days') {
            startDate.setDate(now.getDate() - 30);
        } else {
            startDate = new Date(0); // All time
        }

        if (type === 'overview') {
            // 1. Total Revenue from orders (processing/shipped/completed)
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total, created_at, status')
                .gte('created_at', startDate.toISOString())
                .in('status', ['processing', 'shipped', 'completed']);

            if (ordersError) throw ordersError;

            const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
            const newOrdersCount = orders?.length || 0;

            // 2. Total Expenses from finance_transactions
            const { data: expenses, error: expError } = await supabase
                .from('finance_transactions')
                .select('amount_usd_equivalent, type')
                .gte('transaction_date', startDate.toISOString())
                .eq('type', 'expense');

            if (expError) throw expError;
            const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount_usd_equivalent || 0), 0) || 0;

            return NextResponse.json({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                newOrdersCount,
                conversionRate: 0 // Placeholder until visits tracking is implemented
            });
        }
        else if (type === 'sales') {
            // Group sales by date
            const { data: orders, error } = await supabase
                .from('orders')
                .select('total, created_at')
                .gte('created_at', startDate.toISOString())
                .in('status', ['processing', 'shipped', 'completed'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by day string format YYYY-MM-DD
            const salesByDate: Record<string, number> = {};
            orders?.forEach(order => {
                const date = order.created_at.split('T')[0];
                salesByDate[date] = (salesByDate[date] || 0) + Number(order.total || 0);
            });

            // Fill missing dates
            const chartData: { date: string; amount: number }[] = [];
            const currentDateIterator = new Date(startDate);
            while (currentDateIterator <= now) {
                const dateString = currentDateIterator.toISOString().split('T')[0];
                chartData.push({
                    date: dateString,
                    amount: salesByDate[dateString] || 0
                });
                currentDateIterator.setDate(currentDateIterator.getDate() + 1);
            }

            return NextResponse.json({ chartData });
        }
        else if (type === 'inventory') {
            // 1. Top Products (Approximation by fetching recent order items)
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('quantity, unit_price, product_id, product_name')
                .gte('created_at', startDate.toISOString());

            if (itemsError) throw itemsError;

            const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
            orderItems?.forEach(item => {
                const pId = item.product_id || 'unknown';
                if (!productSales[pId]) {
                    productSales[pId] = { name: item.product_name || 'Desconocido', quantity: 0, revenue: 0 };
                }
                productSales[pId].quantity += Number(item.quantity || 0);
                productSales[pId].revenue += Number(item.quantity || 0) * Number(item.unit_price || 0);
            });

            const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);

            // 2. Low Stock Alerts
            const { data: lowStockProducts, error: stockError } = await supabase
                .from('products')
                .select('id, name, stock')
                .lt('stock', 10) // Threshold for low stock
                .order('stock', { ascending: true })
                .limit(10);

            if (stockError) throw stockError;

            return NextResponse.json({
                topProducts,
                lowStock: lowStockProducts || []
            });
        }
        else if (type === 'finances') {
            const { data: transactions, error } = await supabase
                .from('finance_transactions')
                .select('*, finance_categories(name), finance_accounts(name)')
                .gte('transaction_date', startDate.toISOString())
                .order('transaction_date', { ascending: true });

            if (error) throw error;

            return NextResponse.json({ transactions });
        }
        else if (type === 'inventory_full') {
            const { data: products, error } = await supabase
                .from('products')
                .select('id, name, stock, price, category_id, finance_categories(name)')
                .order('name', { ascending: true });

            if (error) throw error;

            return NextResponse.json({ products });
        }
        else if (type === 'orders_list') {
            const statusParams = searchParams.get('status');
            let query = supabase
                .from('orders')
                .select('id, customer_email, total, created_at, status, payment_method_id')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (statusParams && statusParams !== 'all') {
                query = query.eq('status', statusParams);
            }

            const { data: orders, error } = await query;
            if (error) throw error;

            return NextResponse.json({ orders });
        }
        else if (type === 'sales_detailed') {
            // Detailed sales metrics
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('*, product_id, product_name, quantity, unit_price, orders!inner(status, created_at, customer_email)')
                .gte('created_at', startDate.toISOString())
                .in('orders.status', ['processing', 'shipped', 'completed']);

            if (itemsError) throw itemsError;

            // 1. Group by Product
            const byProduct: Record<string, any> = {};
            orderItems?.forEach(item => {
                const id = item.product_id || 'unknown';
                if (!byProduct[id]) byProduct[id] = { name: item.product_name, qty: 0, revenue: 0 };
                byProduct[id].qty += item.quantity;
                byProduct[id].revenue += item.quantity * item.unit_price;
            });

            // 2. Group by Customer
            const byCustomer: Record<string, any> = {};
            orderItems?.forEach(item => {
                const email = item.orders.customer_email || 'Invitado';
                if (!byCustomer[email]) byCustomer[email] = { qty: 0, revenue: 0, orders: new Set() };
                byCustomer[email].qty += item.quantity;
                byCustomer[email].revenue += item.quantity * item.unit_price;
                byCustomer[email].orders.add(item.order_id);
            });

            return NextResponse.json({
                products: Object.values(byProduct).sort((a, b) => b.revenue - a.revenue),
                customers: Object.entries(byCustomer).map(([email, data]: [string, any]) => ({
                    email,
                    qty: data.qty,
                    revenue: data.revenue,
                    orderCount: data.orders.size
                })).sort((a, b) => b.revenue - a.revenue)
            });
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });

    } catch (error: any) {
        console.error('Reports API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
