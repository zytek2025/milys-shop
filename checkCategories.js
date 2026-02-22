const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEverything() {
    console.log('--- VERIFYING FINANCE SYSTEM ---');

    const { data: accounts, error: accError } = await supabase.from('finance_accounts').select('id, name, balance');
    if (accError) console.error('Error accounts:', accError.message);
    else console.log('Finance Accounts:', accounts.length);

    const { data: categories, error: catError } = await supabase.from('finance_categories').select('id, name');
    if (catError) console.error('Error categories:', catError.message);
    else {
        console.log('Finance Categories:', categories.length);
        const saleCat = categories.find(c => c.name === 'Venta de Productos');
        console.log('Venta de Productos category ID:', saleCat?.id);
    }

    const { data: transactions, error: txError } = await supabase.from('finance_transactions').select('count');
    if (txError) console.error('Error transactions:', txError.message);
    else console.log('Finance Transactions table: OK');
}

checkEverything();
