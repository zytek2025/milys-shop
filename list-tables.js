const pg = require('pg');

const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function listAllTables() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
        `);
        console.log('Tables found:');
        res.rows.forEach(row => console.log(` - ${row.table_schema}.${row.table_name}`));
        client.release();
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

listAllTables();
