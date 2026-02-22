const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Explicit config to avoid URL encoding issues
const config = {
    user: 'postgres',
    host: 'db.ufptanmihekkrgfhcuje.supabase.co',
    database: 'postgres',
    password: '9f&.v$vUaK3L+Ur',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new pg.Pool(config);

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('--- EXECUTING QUOTES MIGRATION (EXPLICIT CONFIG) ---');

        const sqlPath = path.join(__dirname, 'src', 'lib', 'supabase', 'create-quotes-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Migration successful: Quotes and Quote Items tables created.');

        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.detail) console.error('Details:', err.detail);
    } finally {
        await pool.end();
    }
}

migrate();
