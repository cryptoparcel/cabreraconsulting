/**
 * Authentication helpers for API route handlers.
 * 
 * Validates JWT tokens from httpOnly cookies (preferred) or 
 * Authorization headers (API clients). Creates a scoped Supabase
 * client that respects Row Level Security for the authenticated user.
 * 
 * @module auth
 */
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest } from './cookies';

/**
 * Extract and validate the authenticated user from a request.
 * Checks httpOnly cookie first, then Authorization header.
 * 
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<{user: object, supabase: object}|null>}
 *   Session object with user data and scoped Supabase client, or null if unauthenticated
 */
export async function getUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { user, supabase };
  } catch {
    return null;
  }
}

/** @returns {Response} 401 Unauthorized JSON response */
export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * @param {string} msg - Human-readable error message safe to show to user
 * @returns {Response} 400 Bad Request JSON response
 */
export function badRequest(msg) {
  return Response.json({ error: msg }, { status: 400 });
}

/**
 * Log the real error server-side but return a generic message to the client.
 * WHY: Internal DB errors, stack traces, and table names must never reach the browser.
 * 
 * @param {string} internalMsg - Detailed error for server logs only
 * @returns {Response} 500 JSON response with generic message
 */
export function serverError(internalMsg) {
  console.error('[API Error]', internalMsg);
  return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
