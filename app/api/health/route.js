/**
 * GET /api/health
 * Detailed diagnostics for deployment debugging.
 */
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const checks = {
    env_url: !!url,
    env_url_format: url.startsWith('https://') && url.includes('.supabase.co'),
    env_url_preview: url.substring(0, 40) + '...',
    env_anon: !!key,
    env_anon_format: key.startsWith('eyJ'),
    env_anon_length: key.length,
    env_service: !!svc,
    env_service_format: svc.startsWith('eyJ'),
    db_connected: false,
    tables_exist: false,
    storage_ready: false,
    error_detail: null,
  };

  if (!url || !key) {
    return Response.json({ ok: false, checks, error: 'Missing env vars' }, { status: 503 });
  }

  try {
    // Try with service key first (bypasses RLS), fall back to anon
    const useKey = svc || key;
    const sb = createClient(url, useKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Test DB connection
    const { data, error: dbErr } = await sb.from('profiles').select('id').limit(1);
    
    if (dbErr) {
      checks.error_detail = dbErr.message + ' | code: ' + (dbErr.code || 'none');
      
      if (dbErr.message.includes('does not exist') || dbErr.message.includes('relation')) {
        checks.db_connected = true; // DB works, just no tables
        checks.tables_exist = false;
        return Response.json({ ok: false, checks, error: 'Tables not created. Run schema.sql' }, { status: 503 });
      }
      
      if (dbErr.message.includes('JWT') || dbErr.message.includes('apikey')) {
        return Response.json({ ok: false, checks, error: 'API key rejected by Supabase. Make sure you use the legacy anon/service_role keys (start with eyJ...)' }, { status: 503 });
      }

      return Response.json({ ok: false, checks, error: 'DB connection failed: ' + dbErr.message }, { status: 503 });
    }

    checks.db_connected = true;
    checks.tables_exist = true;

    // Test storage
    const { error: stErr } = await sb.storage.getBucket('documents');
    checks.storage_ready = !stErr;

    return Response.json({ ok: true, checks });
  } catch (err) {
    checks.error_detail = err.message;
    return Response.json({ ok: false, checks, error: 'Connection error: ' + err.message }, { status: 503 });
  }
}
