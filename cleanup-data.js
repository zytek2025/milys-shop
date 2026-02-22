/**
 * SCRIPT DE LIMPIEZA DE DATOS
 * Elimina todos los datos transaccionales/inventario preservando usuarios y configuración.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ufptanmihekkrgfhcuje.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcHRhbm1paGVra3JnZmhjdWplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAxNzUyNCwiZXhwIjoyMDg2NTkzNTI0fQ.YrQKyR10aPm5apk4Y6WcCgg1Z4kMJzHTMNThL_ggx_8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Orden de eliminación (respetando foreign keys — hijos primero)
const TABLES_TO_CLEAR = [
    'payment_confirmations',
    'finance_transactions',
    'store_credit_history',
    'store_credits',
    'returns',
    'stock_movements',
    'order_items',
    'orders',
    'product_variants',
    'products',
    'designs',
    'design_categories',
    'promotions',
    'finance_categories',
];

async function clearTable(tableName) {
    // supabase-js delete() requires a filter, so we use neq on id to match all rows
    const { data, error, count } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id');

    if (error) {
        // Table might not exist — that's OK
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST204') {
            console.log(`  ⏭️  ${tableName} — tabla no existe, omitida`);
            return;
        }
        console.error(`  ❌ ${tableName} — ERROR: ${error.message}`);
        return;
    }

    const deleted = data?.length ?? 0;
    console.log(`  ✅ ${tableName} — ${deleted} filas eliminadas`);
}

async function resetProfileBalances() {
    const { error } = await supabase
        .from('profiles')
        .update({ store_credit: 0, balance: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        console.error(`  ❌ profiles (reset balances) — ERROR: ${error.message}`);
    } else {
        console.log('  ✅ profiles — store_credit y balance reseteados a 0');
    }
}

async function resetFinanceAccountBalances() {
    const { error } = await supabase
        .from('finance_accounts')
        .update({ balance: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        if (error.message?.includes('does not exist') || error.code === 'PGRST204') {
            console.log('  ⏭️  finance_accounts — tabla no existe, omitida');
            return;
        }
        console.error(`  ❌ finance_accounts (reset balance) — ERROR: ${error.message}`);
    } else {
        console.log('  ✅ finance_accounts — balance reseteado a 0');
    }
}

async function main() {
    console.log('🧹 LIMPIEZA DE DATOS — Inicio');
    console.log('================================');
    console.log('');

    // 1. Limpiar tablas de datos
    console.log('📋 Eliminando datos de tablas...');
    for (const table of TABLES_TO_CLEAR) {
        await clearTable(table);
    }

    console.log('');

    // 2. Resetear saldos en profiles
    console.log('👤 Reseteando saldos de usuarios...');
    await resetProfileBalances();

    // 3. Resetear balances de cuentas financieras
    console.log('🏦 Reseteando balances de cuentas financieras...');
    await resetFinanceAccountBalances();

    console.log('');
    console.log('================================');
    console.log('✅ LIMPIEZA COMPLETADA');
    console.log('');
    console.log('Conservados:');
    console.log('  • profiles (usuarios)');
    console.log('  • staff_users (administradores)');
    console.log('  • store_settings (configuración)');
    console.log('  • finance_accounts (cuentas, balance=0)');
}

main().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
