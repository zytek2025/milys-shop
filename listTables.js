const pg = require('pg');

const DATABASE_URL = 'postgresql://postgres.ufptanmihekkrgfhcuje:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function listTables() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in public schema:');
        res.rows.forEach(row => console.log(`- ${row.table_name}`));
        client.release();
    } catch (err) {
        console.error('Error listing tables:', err.message);
    } finally {
        await pool.end();
    }
}

listTables();
