const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTx() {
    const { data, error } = await supabase.from('finance_transactions').select('count');
    if (error) {
        console.error('Error fetching transactions:', error.message);
    } else {
        console.log('Finance Transactions table exists');
    }
}

checkTx();
