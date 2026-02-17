import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
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
        const { id, role, permissions, is_super_admin } = body;

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
