import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        // 1. Security check
        const adminCheck = await isAdmin();
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 2. Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        const supabase = await createClient();

        // 3. Prepare file for upload
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = fileName;

        // Convert File to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage error:', error);
            return NextResponse.json({ error: 'Error uploading to storage' }, { status: 500 });
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
