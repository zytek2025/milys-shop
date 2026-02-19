import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if requester is in staff_users (New System)
        const { data: requester } = await supabase
            .from('staff_users')
            .select('is_super_admin')
            .eq('id', currentUser.id)
            .single();

        let isSuperAdmin = false;
        if (requester) {
            isSuperAdmin = requester.is_super_admin;
        } else {
            // Fallback: Check profiles table (Legacy System)
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();

            isSuperAdmin = profile?.role === 'admin';
        }

        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Forbidden: Only super admins can create staff' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, full_name, permissions } = body;

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

        // Insert into staff_users table
        const { data: newStaff, error: staffError } = await adminSupabase
            .from('staff_users')
            .insert({
                id: authData.user.id,
                email: email,
                full_name: full_name || email.split('@')[0],
                is_super_admin: false,
                permissions: permissions || {
                    can_manage_prices: false,
                    can_view_metrics: false,
                    can_manage_users: false,
                    can_manage_designs: false,
                    can_view_settings: false,
                }
            })
            .select()
            .single();

        if (staffError) throw staffError;

        return NextResponse.json(newStaff);
    } catch (error: any) {
        console.error('Create staff error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
