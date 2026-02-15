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

    // Get profile from profiles table using the authenticated client
    // This client automatically sends the session cookie, so RLS policies work.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist (e.g. race condition with trigger), try to create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            whatsapp: user.user_metadata?.whatsapp || null,
          })
          .select()
          .single();

        if (createError) {
          // If insert fails (maybe trigger already did it), try to fetch once more
          const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (retryProfile) return NextResponse.json(retryProfile);

          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json(newProfile);
      }

      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json(profile);
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
    const { full_name, avatar_url, whatsapp } = body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        avatar_url,
        whatsapp,
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
