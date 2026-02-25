const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ufptanmihekkrgfhcuje.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcHRhbm1paGVra3JnZmhjdWplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAxNzUyNCwiZXhwIjoyMDg2NTkzNTI0fQ.YrQKyR10aPm5apk4Y6WcCgg1Z4kMJzHTMNThL_ggx_8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const fs = require('fs');

async function getActivity() {
    const report = { counts: {}, profiles: [], latest_data: {} };
    const tables = [
        'profiles', 'orders', 'payment_confirmations', 'products', 'designs',
        'order_items', 'stock_movements', 'returns', 'store_credits',
        'promotions', 'staff_users', 'store_settings', 'finance_transactions'
    ];

    for (const table of tables) {
        const { count, error, data } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            report.counts[table] = count;
            // Get latest for some
            if (['profiles', 'orders', 'products', 'designs'].includes(table)) {
                const { data: latest } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(3);
                report.latest_data[table] = latest;
            }
        } else {
            report.counts[table] = 'Error: ' + error.message;
        }
    }

    fs.writeFileSync('activity_report.json', JSON.stringify(report, null, 2));
    console.log('✅ Comprehensive activity report saved to activity_report.json');
}

getActivity();
