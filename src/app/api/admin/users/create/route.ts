import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if requester is super admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', currentUser.id)
            .single();

        if (!profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden: Only super admins can create staff' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, full_name, permissions, role } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Use Admin Client to create the user in Auth
        const adminSupabase = await createAdminClient();
        const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (createError) throw createError;

        // Update the profile with role and permissions
        const { data: newProfile, error: profileError } = await adminSupabase
            .from('profiles')
            .update({
                role: role || 'admin',
                full_name: full_name || email.split('@')[0],
                permissions: permissions || {
                    can_manage_prices: false,
                    can_view_metrics: false,
                    can_manage_users: false,
                    can_manage_designs: false,
                    can_view_settings: false,
                }
            })
            .eq('id', authData.user.id)
            .select()
            .single();

        if (profileError) throw profileError;

        return NextResponse.json(newProfile);
    } catch (error: any) {
        console.error('Create staff error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
