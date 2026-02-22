const pg = require('pg');
const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function query() {
    const sql = process.argv[2];
    if (!sql) {
        console.error('Please provide a SQL query as an argument');
        process.exit(1);
    }
    try {
        const client = await pool.connect();
        const res = await client.query(sql);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error('❌ Query failed:', err.message);
    } finally {
        await pool.end();
    }
}
query();
