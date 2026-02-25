import pg from 'pg';

const projects = [
    { name: 'milys.shop (ufptanmihekkrgfhcuje)', ref: 'ufptanmihekkrgfhcuje' },
    { name: 'linky-crm (djkmhjtkspwcbkjkcigz)', ref: 'djkmhjtkspwcbkjkcigz' }
];

const password = '9f&.v$vUaK3L+Ur';

async function audit() {
    for (const project of projects) {
        console.log(`\n============== AUDITING: ${project.name} ==============`);
        const url = `postgresql://postgres.${project.ref}:${encodeURIComponent(password)}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
        const pool = new pg.Pool({ connectionString: url });

        try {
            const client = await pool.connect();

            // 1. Check schemas
            const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'storage', 'graphql_public', 'auth', 'pg_toast', 'extensions')");
            console.log('Schemas:', schemas.rows.map(s => s.schema_name).join(', '));

            // 2. Check recent orders (if orders table exists)
            try {
                const orders = await client.query("SELECT id, total_amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 3");
                console.log('\n📦 Recent Orders:');
                orders.rows.forEach(o => console.log(` - Order ${o.id}: $${o.total_amount} (${o.status}) at ${o.created_at}`));
            } catch (e) { console.log('\n📦 Orders table not found in public schema.'); }

            // 3. Check recent profiles
            try {
                const profiles = await client.query("SELECT full_name, email, created_at FROM profiles ORDER BY created_at DESC LIMIT 3");
                console.log('\n👤 Recent Profiles:');
                profiles.rows.forEach(p => console.log(` - ${p.full_name} (${p.email}) at ${p.created_at}`));
            } catch (e) { console.log('\n👤 Profiles table not found in public schema.'); }

            // 4. Check potential "interaction" or "history" tables
            const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%interaction%' OR table_name ILIKE '%history%' OR table_name ILIKE '%log%'");
            if (tables.rows.length > 0) {
                console.log('\n📋 Interaction/Log Tables found:', tables.rows.map(t => t.table_name).join(', '));
            }

            client.release();
        } catch (err) {
            console.error(`❌ Connection failed for ${project.name}:`, err.message);
        } finally {
            await pool.end();
        }
    }
}

audit();
