const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountsTable() {
    console.log('Fetching finance_accounts columns...');

    // We try to insert a fake record and let it fail to see why, or get data
    const { data, error } = await supabase.from('finance_accounts').select('*').limit(1);

    if (error) {
        console.error('Error fetching:', error);
    } else {
        console.log('Columns (if any rows exist):', data[0] ? Object.keys(data[0]) : 'No rows');
    }

    console.log('Trying an insert...');
    const { error: insErr } = await supabase.from('finance_accounts').insert({
        name: 'Test Bank',
        type: 'Banco',
        currency: 'VES (Bs)',
        balance: 0
    });

    if (insErr) {
        console.error('Insert Error Detail:', insErr);
    } else {
        console.log('Insert OK. Deleting test record...');
        await supabase.from('finance_accounts').delete().eq('name', 'Test Bank');
    }
}

checkAccountsTable();
