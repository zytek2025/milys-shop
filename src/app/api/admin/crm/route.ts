import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// Get leads/customers for CRM
export async function GET() {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = await createClient();

        // Fetch profiles with their orders to calculate LTV (Life Time Value)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                avatar_url,
                role,
                crm_status,
                store_credit,
                notes,
                created_at,
                orders (
                    total,
                    status
                )
            `)
            .eq('role', 'user')
            .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        // Process data for the CRM view
        const crmData = profiles.map((p: any) => {
            const completedOrders = p.orders?.filter((o: any) => o.status === 'completed') || [];
            const ltv = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
            const lastActive = p.created_at; // Simplify for now

            return {
                id: p.id,
                email: p.email,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
                crm_status: p.crm_status || 'lead',
                store_credit: p.store_credit || 0,
                notes: p.notes,
                ltv,
                orderCount: p.orders?.length || 0,
                lastActive
            };
        });

        return NextResponse.json(crmData);
    } catch (error: any) {
        console.error('CRM API GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update CRM profile details
export async function PUT(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, full_name, email } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name,
                email,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('CRM API PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a customer profile and auth user
export async function DELETE(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Check if user is an admin before deleting (safety)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (profile?.role === 'admin') {
            return NextResponse.json({ error: 'Cannot delete admin staff from CRM' }, { status: 400 });
        }

        // 2. Delete Auth user using Admin Client
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminClient = await createAdminClient();
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            // If user doesn't exist in Auth, we might still want to delete the profile
        }

        // 3. Delete Profile (RLS / Cascade should handle related data, but we do it explicitly if needed)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) throw profileError;

        return NextResponse.json({ success: true, message: 'Customer deleted' });
    } catch (error: any) {
        console.error('CRM API DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
