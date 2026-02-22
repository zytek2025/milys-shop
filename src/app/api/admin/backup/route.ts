import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();

        // Fetch all key tables
        const [
            { data: orders },
            { data: products },
            { data: transactions },
            { data: profiles },
            { data: settings },
            { data: categories },
            { data: accounts }
        ] = await Promise.all([
            supabase.from('orders').select('*'),
            supabase.from('products').select('*'),
            supabase.from('finance_transactions').select('*'),
            supabase.from('profiles').select('*'),
            supabase.from('store_settings').select('*'),
            supabase.from('finance_categories').select('*'),
            supabase.from('finance_accounts').select('*')
        ]);

        const backupData = {
            export_date: new Date().toISOString(),
            orders: orders || [],
            products: products || [],
            transactions: transactions || [],
            profiles: profiles || [],
            settings: settings || [],
            categories: categories || [],
            accounts: accounts || []
        };

        const filename = `milys_backup_${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Backup API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
