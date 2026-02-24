/**
 * Supabase client initialization.
 * 
 * Two clients exist for different security contexts:
 * - `supabase` (anon key): Respects RLS, safe for client-side-like operations
 * - `createServerClient()` (service role): Bypasses RLS, used only in
 *   server-side admin operations like seed scripts
 * 
 * @module supabase
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Anon client — respects Row Level Security */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create a service-role client that bypasses RLS.
 * Only use this in trusted server contexts (seed scripts, admin tasks).
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
