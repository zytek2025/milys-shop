const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExpenses() {
    const { data, error } = await supabase.from('expenses').select('count');
    if (error) {
        console.error('Error fetching expenses:', error.message);
    } else {
        console.log('Expenses table exists');
    }
}

checkExpenses();
