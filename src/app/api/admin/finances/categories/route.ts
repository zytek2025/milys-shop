import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // optional filter: income | expense

        let query = supabase.from('finance_categories').select('*').order('name');
        if (type) query = query.eq('type', type);

        const { data, error } = await query;
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
        const { name, type, icon } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('finance_categories')
            .insert({ name, type, icon })
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
        const { id, name, type, icon } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de categoría requerido' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('finance_categories')
            .update({
                name,
                type,
                icon,
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
            return NextResponse.json({ error: 'ID de categoría requerido' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Check if there are transactions associated with this category
        const { count, error: countError } = await supabase
            .from('finance_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', id);

        if (countError) throw countError;
        if (count && count > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar una categoría con movimientos registrados.'
            }, { status: 400 });
        }

        // 2. Delete if empty
        const { error } = await supabase
            .from('finance_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
