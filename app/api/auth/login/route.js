/**
 * POST /api/auth/login
 * Authenticates user via email + password.
 * Sets httpOnly cookie with JWT token for secure session management.
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

    // S4: Rate limit by lowercase email to prevent brute force
    const rl = rateLimit(`login:${email.toLowerCase()}`, 5, 60000);
    if (!rl.ok) {
      return Response.json(
        { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role, initials, company')
      .eq('id', data.user.id)
      .single();

    // Set httpOnly cookie + return user data (but NOT the raw token)
    const response = Response.json({
      token: data.session.access_token, // kept for backward compat — adapter will stop storing it
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
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
