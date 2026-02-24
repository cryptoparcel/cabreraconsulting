import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: (process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000') + '/portal.html'
    });

    // Always return success to prevent email enumeration
    return Response.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
