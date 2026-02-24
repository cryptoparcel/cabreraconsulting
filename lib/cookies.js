/**
 * Secure cookie helpers for auth token management.
 * 
 * WHY: httpOnly cookies can't be read by JavaScript, which eliminates
 * XSS-based token theft. localStorage tokens are readable by any script
 * on the page, including injected scripts.
 * 
 * @module cookies
 */

const COOKIE_NAME = 'cc_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Build a Set-Cookie header string for the auth token.
 * httpOnly prevents JS access; Secure ensures HTTPS only;
 * SameSite=Lax prevents CSRF while allowing normal navigation.
 * @param {string} token - Supabase JWT access token
 * @returns {string} Set-Cookie header value
 */
export function setTokenCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${MAX_AGE}`,
  ];
  // Only set Secure flag when not on localhost
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Build a Set-Cookie header that clears the auth cookie.
 * @returns {string} Set-Cookie header value that expires immediately
 */
export function clearTokenCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Extract the auth token from the request's cookies.
 * Falls back to Authorization header for API clients.
 * @param {Request} request - Incoming HTTP request
 * @returns {string|null} JWT token or null
 */
export function getTokenFromRequest(request) {
  // 1. Try httpOnly cookie first (browser sessions)
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) return match[1];

  // 2. Fall back to Authorization header (API clients, mobile)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  return null;
}
