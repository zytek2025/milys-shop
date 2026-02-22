import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('finance_accounts')
            .select('*')
            .order('name');

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, type, currency, balance } = body;

        if (!name || !type || !currency) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('finance_accounts')
            .insert({
                name,
                type,
                currency,
                balance: Number(balance || 0)
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, type, currency, balance, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de cuenta requerido' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('finance_accounts')
            .update({
                name,
                type,
                currency,
                balance: balance !== undefined ? Number(balance) : undefined,
                is_active,
                updated_at: new Date().toISOString()
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

export async function DELETE(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID de cuenta requerido' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Check if there are transactions associated with this account
        const { count, error: countError } = await supabase
            .from('finance_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', id);

        if (countError) throw countError;
        if (count && count > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar una cuenta con movimientos registrados. Prueba a desactivarla.'
            }, { status: 400 });
        }

        // 2. Delete if empty
        const { error } = await supabase
            .from('finance_accounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
