import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/auth/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check if user exists in staff_users table
    const { data: staff, error: staffError } = await supabase
      .from('staff_users')
      .select('*')
      .eq('id', user.id)
      .single();

    let finalProfile = profile;

    if (profileError && profileError.code === 'PGRST116') {
      // If profile doesn't exist but they are staff, we can synthesize one or error
      if (!staff) {
        // Create profile if missing
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            shipping_address: user.user_metadata?.shipping_address || null,
          })
          .select()
          .single();
        if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
        finalProfile = newProfile;
      }
    } else if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Merge staff data if present
    if (staff) {
      finalProfile = {
        ...(finalProfile || {}),
        id: user.id, // Ensure ID is correct
        email: user.email,
        role: 'admin', // Force admin role if in staff_users
        is_super_admin: staff.is_super_admin,
        permissions: staff.permissions,
        full_name: staff.full_name || (finalProfile?.full_name),
        updated_at: staff.updated_at
      };
    }

    return NextResponse.json(finalProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, avatar_url, whatsapp, shipping_address } = body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        avatar_url,
        whatsapp,
        shipping_address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
