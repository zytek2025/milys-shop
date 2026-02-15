import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// Get all categories
export async function GET() {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = await createClient();
        // Trying to be safe with selection
        const { data, error } = await supabase
            .from('categories')
            .select('*, is_customizable')
            .order('name');

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Categories GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create category
export async function POST(req: Request) {
    try {
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const {
            name,
            description,
            has_variants,
            is_customizable,
            available_sizes,
            available_colors,
            design_price_small,
            design_price_medium,
            design_price_large,
            text_price_small,
            text_price_large
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate slug from name
        const slug = name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name,
                slug,
                description,
                has_variants: !!has_variants,
                is_customizable: is_customizable !== undefined ? !!is_customizable : true,
                available_sizes: available_sizes || [],
                available_colors: available_colors || [],
                design_price_small: design_price_small || 0,
                design_price_medium: design_price_medium || 0,
                design_price_large: design_price_large || 0,
                text_price_small: text_price_small || 0,
                text_price_large: text_price_large || 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Categories POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
