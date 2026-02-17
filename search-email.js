const { createClient } = require('@supabase/supabase-js');

const url = 'https://ufptanmihekkrgfhcuje.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVf...'; // I'll use the service role key I saw

// Since I have access to the file system, I'll just parse it correctly.
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function find() {
    const email = 'dfornerino87@gmail.com';
    const tables = ['profiles', 'orders', 'order_items'];
    for (const t of tables) {
        const { data } = await supabase.from(t).select('*').eq('email', email);
        if (data && data.length > 0) {
            console.log(`FOUND IN ${t}:`, JSON.stringify(data, null, 2));
        } else {
            console.log(`NOT IN ${t}`);
        }
    }
}
find();
