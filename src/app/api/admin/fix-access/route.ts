import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Force set this user as admin
        const { data, error } = await supabase
            .from('profiles')
            .update({
                role: 'admin',
                is_super_admin: true, // Emergency promote
                permissions: {
                    can_manage_prices: true,
                    can_view_metrics: true,
                    can_manage_users: true,
                    can_manage_designs: true,
                    can_view_settings: true
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, profile: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
