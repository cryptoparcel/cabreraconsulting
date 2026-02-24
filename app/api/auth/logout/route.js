/**
 * POST /api/auth/logout
 * Clears the httpOnly session cookie.
 */
import { clearTokenCookie } from '@/lib/cookies';

export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set('Set-Cookie', clearTokenCookie());
  return response;
}
