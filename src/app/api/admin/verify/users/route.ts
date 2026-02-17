import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createAdminClient();
    const testEmail = `test-user-${Date.now()}@milys.shop`;
    let userId = '';

    try {
        console.log('--- STARTING USER CREATION VERIFICATION ---');

        // 1. Create User
        const { data: { user }, error: uError } = await supabase.auth.admin.createUser({
            email: testEmail,
            email_confirm: true,
            password: 'TestPassword123!',
            user_metadata: { full_name: 'Test Administrator', role: 'admin' }
        });

        if (uError) throw new Error(`User creation failed: ${uError.message}`);
        userId = user?.id || '';
        console.log('1. User Created:', userId);

        // 2. Verify Profile Exists (Trigger Check)
        // Usually a trigger creates the profile. Let's check if it exists.
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        console.log('2. Profile Check:', profile ? 'Found' : 'Missing');

        // CLEANUP
        if (userId) {
            await supabase.auth.admin.deleteUser(userId);
            // Profile cascade delete check?
        }

        if (userId && profile) {
            return NextResponse.json({ success: true, message: 'User creation verified (Auth + Profile).' });
        } else {
            return NextResponse.json({
                success: false,
                message: `User Verification Failed. UserID: ${userId}, Profile Found: ${!!profile}`
            }, { status: 500 });
        }

    } catch (error: any) {
        if (userId) await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
