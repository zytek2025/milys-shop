import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if requester is super admin or has manage_users permission
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin, permissions')
            .eq('id', currentUser.id)
            .single();

        if (!profile?.is_super_admin && !profile?.permissions?.can_manage_users) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Filter ONLY staff (admins) for this page
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'admin')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin, permissions')
            .eq('id', currentUser.id)
            .single();

        if (!profile?.is_super_admin && !profile?.permissions?.can_manage_users) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id, role, permissions, is_super_admin, full_name } = body;

        // Prevent non-super-admins from giving super admin status or editing super admins
        if (!profile.is_super_admin && (is_super_admin !== undefined)) {
            return NextResponse.json({ error: 'Only super admins can modify super admin status' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({
                role,
                permissions,
                is_super_admin,
                full_name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', currentUser.id)
            .single();

        if (!profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden: Only super admins can delete users' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        const adminSupabase = await createAdminClient();

        // 1. Delete from Auth (this also deletes from profiles if cascading is setup, 
        // but we do it explicitly just in case)
        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
        if (authDeleteError) throw authDeleteError;

        // 2. Delete from Profiles
        const { error: profileDeleteError } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileDeleteError) throw profileDeleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete staff error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
