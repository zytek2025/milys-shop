require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runBackup() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tables = [
        'orders',
        'products',
        'finance_transactions',
        'profiles',
        'store_settings',
        'finance_categories',
        'finance_accounts'
    ];

    console.log('🔄 Iniciando respaldo de base de datos...');
    const backupData = {
        export_date: new Date().toISOString(),
    };

    for (const table of tables) {
        console.log(`📡 Exportando tabla: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`❌ Error exportando ${table}:`, error.message);
            backupData[table] = [];
        } else {
            backupData[table] = data;
        }
    }

    const backupPath = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath);
    }

    const filename = `milys_manual_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const fullPath = path.join(backupPath, filename);

    fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Respaldo completado: ${fullPath}`);

    // Copy to brain directory for user visibility
    const brainDir = 'C:\\Users\\dforn\\.gemini\\antigravity\\brain\\948fa73d-616b-4708-a890-2961a407499d';
    const brainPath = path.join(brainDir, filename);
    fs.copyFileSync(fullPath, brainPath);
    console.log(`📂 Copia guardada en Brain: ${brainPath}`);
}

runBackup().catch(console.error);
