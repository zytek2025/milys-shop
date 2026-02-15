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
                friendly_id,
                notes,
                created_at,
                orders (
                    total,
                    status
                )
            `)
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
                friendly_id: p.friendly_id,
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

// Update CRM status or notes
export async function PATCH(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, crm_status, notes } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({
                crm_status,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('CRM API PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
