/**
 * POST /api/auth/login
 * Authenticates user via email + password.
 * Sets httpOnly cookie with JWT token.
 * Rate limited: 5 attempts per minute per email.
 */
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';
import { setTokenCookie } from '@/lib/cookies';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const rl = rateLimit(`login:${email.toLowerCase()}`, 5, 60000);
    if (!rl.ok) {
      return Response.json(
        { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('[Login] Missing env vars:', { url: !!url, key: !!key });
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Login] Supabase error:', error.message);
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role, initials, company')
      .eq('id', data.user.id)
      .single();

    const response = Response.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || email.split('@')[0],
        role: profile?.role || 'Client',
        initials: profile?.initials || email[0].toUpperCase(),
        company: profile?.company || ''
      }
    });

    response.headers.set('Set-Cookie', setTokenCookie(data.session.access_token));
    return response;
  } catch (err) {
    console.error('[Login Error]', err.message);
    return Response.json({ error: 'Login failed: ' + err.message }, { status: 500 });
  }
}
