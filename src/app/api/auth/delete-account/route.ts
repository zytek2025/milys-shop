import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mark profile for deletion
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                is_active: false,
                deletion_requested_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Trigger a notification for the admin (could be a webhook/email)
        // For now, we sign out the user after the request if desired, or just return success
        // We'll return success so the UI can show a confirmation before redirecting

        return NextResponse.json({ message: 'Solicitud de baja recibida correctamente' });
    } catch (error) {
        console.error('Error requesting account deletion:', error);
        return NextResponse.json(
            { error: 'Failed to request account deletion' },
            { status: 500 }
        );
    }
}
