import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        // 1. Update Profile (Keep legacy role for safety)
        await adminSupabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'admin',
                updated_at: new Date().toISOString(),
            });

        // 2. Force set this user as admin in staff_users (Source of truth)
        const { data, error } = await adminSupabase
            .from('staff_users')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
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
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, staff: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
