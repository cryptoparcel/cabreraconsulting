/**
 * POST /api/auth/register
 * Creates a new user account via Supabase Auth.
 * Sets httpOnly cookie on success. Rate limited: 3 per hour per email.
 */
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';
import { setTokenCookie } from '@/lib/cookies';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const { email, password, name } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return Response.json({ error: 'Password too long' }, { status: 400 });
    }
    if (email.length > 254) {
      return Response.json({ error: 'Email too long' }, { status: 400 });
    }

    const rl = rateLimit(`register:${email.toLowerCase()}`, 3, 3600000);
    if (!rl.ok) {
      return Response.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('[Register] Missing env vars:', { url: !!url, key: !!key });
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    const displayName = (name || email.split('@')[0]).slice(0, 100);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName } }
    });

    if (error) {
      console.error('[Register] Supabase error:', error.message, error.status);
      if (error.message.includes('already registered')) {
        return Response.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      // Return the actual Supabase error for debugging
      return Response.json({ error: error.message || 'Registration failed' }, { status: 400 });
    }

    // If email confirmation is enabled, data.session will be null
    if (data.session) {
      const response = Response.json({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: displayName,
          role: 'Client',
          initials: displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        }
      });
      response.headers.set('Set-Cookie', setTokenCookie(data.session.access_token));
      return response;
    }

    // User was created but email confirmation is required
    // Still return user info so frontend can handle it
    if (data.user) {
      return Response.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: displayName,
          role: 'Client',
          initials: displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        },
        message: 'Email confirmation is enabled. Please turn it off in Supabase → Authentication → Providers → Email.'
      });
    }

    return Response.json({ error: 'Registration failed — no session returned. Check if email confirmation is disabled in Supabase.' }, { status: 400 });
  } catch (err) {
    console.error('[Register Error]', err.message);
    return Response.json({ error: 'Registration failed: ' + err.message }, { status: 500 });
  }
}
