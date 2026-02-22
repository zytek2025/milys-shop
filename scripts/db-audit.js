const pg = require('pg');
const DATABASE_URL = 'postgresql://postgres.ufptanmihekkrgfhcuje:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function check() {
    try {
        const client = await pool.connect();

        console.log('--- DB SYNC AUDIT ---');

        // 1. Count auth.users
        const { rows: authRows } = await client.query('SELECT COUNT(*) as total FROM auth.users');
        const authCount = parseInt(authRows[0].total);
        console.log(`Total users in auth.users: ${authCount}`);

        // 2. Count public.profiles
        const { rows: profileRows } = await client.query('SELECT COUNT(*) as total FROM public.profiles');
        const profileCount = parseInt(profileRows[0].total);
        console.log(`Total profiles in public.profiles: ${profileCount}`);

        // 3. Find missing profiles
        const { rows: missing } = await client.query(`
            SELECT id, email, created_at 
            FROM auth.users 
            WHERE id NOT IN (SELECT id FROM public.profiles)
            ORDER BY created_at DESC
        `);

        console.log(`Users missing profiles: ${missing.length}`);
        if (missing.length > 0) {
            console.log('First 5 missing users:');
            console.table(missing.slice(0, 5));
        }

        client.release();
    } catch (err) {
        console.error('❌ DB Audit failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
