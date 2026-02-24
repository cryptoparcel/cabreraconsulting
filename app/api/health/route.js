/**
 * GET /api/health
 * Validates Supabase connection, env vars, table existence, and storage.
 * Returns structured status for deployment verification.
 * NOTE: Never exposes internal error messages to the client.
 */
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const checks = {
    env_url: !!url,
    env_anon: !!key,
    env_service: !!svc,
    db_connected: false,
    tables_exist: false,
    storage_ready: false,
  };

  if (!url || !key) {
    return Response.json(
      { ok: false, checks, error: 'Missing environment variables. Check Vercel settings.' },
      { status: 503 }
    );
  }

  try {
    const sb = createClient(url, svc || key);

    const { error: dbErr } = await sb.from('profiles').select('id').limit(1);
    checks.db_connected = !dbErr;

    if (dbErr && dbErr.message?.includes('does not exist')) {
      return Response.json(
        { ok: false, checks, error: 'Tables not created. Run schema.sql in Supabase SQL Editor.' },
        { status: 503 }
      );
    }
    checks.tables_exist = !dbErr;

    const { error: stErr } = await sb.storage.getBucket('documents');
    checks.storage_ready = !stErr;

    const ok = checks.db_connected && checks.tables_exist;
    return Response.json({ ok, checks });
  } catch (err) {
    // S5: Log internally, return generic message
    console.error('[Health Check Error]', err.message);
    return Response.json(
      { ok: false, checks, error: 'Could not connect to database.' },
      { status: 503 }
    );
  }
}
