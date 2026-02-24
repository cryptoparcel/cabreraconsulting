/**
 * PUT /api/auth/password
 * Changes the authenticated user's password.
 * Verifies current password before allowing update.
 * Rate limited: 3 attempts per 10 minutes.
 */
import { createClient } from '@supabase/supabase-js';
import { getUser, unauthorized, badRequest, serverError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function PUT(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  // S4: Rate limit password changes
  const rl = rateLimit(`password:${session.user.id}`, 3, 600000);
  if (!rl.ok) {
    return Response.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return badRequest('Invalid request body');

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return badRequest('Both passwords required');
  if (newPassword.length < 6) return badRequest('New password must be 6+ characters');
  if (newPassword.length > 128) return badRequest('Password too long');

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { error: signInErr } = await sb.auth.signInWithPassword({
    email: session.user.email,
    password: currentPassword
  });

  if (signInErr) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const { error: updateErr } = await session.supabase.auth.updateUser({
    password: newPassword
  });

  if (updateErr) return serverError(updateErr.message);
  return Response.json({ success: true });
}
