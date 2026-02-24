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
    // S6: Input length validation
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const displayName = (name || email.split('@')[0]).slice(0, 100);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName } }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return Response.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      return Response.json({ error: 'Registration failed' }, { status: 400 });
    }

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

    return Response.json({ message: 'Check your email to confirm your account.' });
  } catch (err) {
    console.error('[Register Error]', err.message);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
