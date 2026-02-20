import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE variables in .env.local");
    process.exit(1);
}

// Create a service client to bypass RLS for this backend test script
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinances() {
    console.log("=== Testing Finances Module ===");

    try {
        // 1. Check if we can create a sample expense
        console.log("1. Insertando Gasto de Prueba...");
        const testAmount = 50.25;

        // get a profile id
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').limit(1);
        const userId = profiles?.[0]?.id;

        const { data: newExpense, error: insertError } = await supabase
            .from('expenses')
            .insert({
                amount: testAmount,
                description: "Empaques y Cajas (Test script)",
                category: "Operativo",
                expense_date: new Date().toISOString(),
                created_by: userId
            })
            .select()
            .single();

        if (insertError) {
            throw new Error(`Fallo al insertar expense: ${insertError.message}`);
        }
        console.log(`✅ Gasto creado con ID: ${newExpense.id}`);

        // 2. Test the stats endpoint logic locally
        console.log("\n2. Calculando Beneficio Neto...");

        // a. Revenue (total of shipped/completed orders)
        const { data: validOrders, error: orderError } = await supabase
            .from('orders')
            .select('total, status')
            .in('status', ['completed', 'shipped']);

        if (orderError) throw new Error(`Error orders: ${orderError.message}`);

        const totalRevenue = validOrders.reduce((acc, order) => acc + (order.total || 0), 0);

        // b. Expenses
        const { data: allExpenses, error: expError } = await supabase
            .from('expenses')
            .select('amount');

        if (expError) throw new Error(`Error expenses: ${expError.message}`);

        const totalExpenses = allExpenses?.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0) || 0;

        // c. Profit
        const netProfit = totalRevenue - totalExpenses;

        console.log(`💰 Ingresos Brutos (Ventas): $${totalRevenue}`);
        console.log(`📉 Egresos Totales (Gastos): $${totalExpenses}`);
        console.log(`💵 Beneficio Neto: $${netProfit}`);

        if (totalExpenses >= testAmount) {
            console.log("✅ La lógica de cálculo funciona correctamente.");
        } else {
            console.log("❌ Los gastos no se están sumando correctamente.");
        }

        // 3. Clean up the test expense
        console.log(`\n3. Eliminando el gasto de prueba ${newExpense.id}...`);
        const { error: deleteError } = await supabase.from('expenses').delete().eq('id', newExpense.id);
        if (deleteError) {
            console.error("No se pudo limpiar el gasto de prueba", deleteError.message);
        } else {
            console.log("✅ Gasto de prueba eliminado.");
        }

    } catch (err: any) {
        console.error("❌ ERROR durante el test:", err.message);
    }
}

testFinances();
