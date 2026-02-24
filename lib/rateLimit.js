/**
 * In-memory rate limiter for serverless environments.
 * Resets on cold start — for production use Upstash Redis.
 * @module rateLimit
 */

/** @type {Map<string, {count: number, firstAttempt: number}>} */
const attempts = new Map();

/**
 * Check if a key has exceeded its rate limit.
 * @param {string} key - Unique identifier (e.g., "login:user@example.com")
 * @param {number} maxAttempts - Maximum attempts within window (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 60000)
 * @returns {{ ok: boolean, remaining: number, retryAfter?: number }}
 */
export function rateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const record = attempts.get(key);

  // Inline cleanup when map gets large (no setInterval needed)
  if (attempts.size > 500) {
    for (const [k, r] of attempts) {
      if (now - r.firstAttempt > 300000) attempts.delete(k);
    }
  }

  if (!record || now - record.firstAttempt > windowMs) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return { ok: true, remaining: maxAttempts - 1 };
  }

  record.count++;
  if (record.count > maxAttempts) {
    const retryAfter = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: maxAttempts - record.count };
}
