import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;
        const category_id = formData.get('category_id') as string;
        const price = formData.get('price') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('designs')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('designs')
            .getPublicUrl(filePath);

        // 3. Save to database
        const { data: design, error: dbError } = await supabase
            .from('designs')
            .insert({
                name: name || file.name,
                image_url: publicUrl,
                category_id: category_id || null,
                price: parseFloat(price) || 0,
                is_active: true
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(design);
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
