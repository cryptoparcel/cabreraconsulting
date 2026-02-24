/**
 * Generic CRUD route factory for Supabase tables.
 * 
 * WHY this exists: Every data table (inventory, billing, partners) needs
 * identical GET/POST/PUT/DELETE logic scoped to the authenticated user.
 * Instead of duplicating 80 lines per table, this factory generates
 * type-safe route handlers from a table name.
 * 
 * Security: All queries include .eq('user_id', uid) so RLS + app-level
 * filtering both enforce data isolation.
 * 
 * @module crud
 */
import { getUser, unauthorized, badRequest, serverError } from './auth';

/** Maximum characters allowed in any single text field */
const MAX_FIELD_LENGTH = 1000;

/** Maximum number of fields allowed in a request body */
const MAX_FIELDS = 20;

/**
 * Validate and sanitize a request body.
 * Prevents oversized inputs and prototype pollution.
 * 
 * @param {object} body - Parsed JSON body
 * @param {string[]} requiredFields - Fields that must be non-empty
 * @returns {{ ok: boolean, error?: string, clean?: object }}
 */
function validateBody(body, requiredFields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body' };
  }

  const keys = Object.keys(body);
  if (keys.length > MAX_FIELDS) {
    return { ok: false, error: 'Too many fields' };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
      return { ok: false, error: `${field} is required` };
    }
  }

  // Enforce length limits on string values
  const clean = {};
  for (const [key, value] of Object.entries(body)) {
    // Block prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    if (typeof value === 'string' && value.length > MAX_FIELD_LENGTH) {
      return { ok: false, error: `${key} is too long (max ${MAX_FIELD_LENGTH} characters)` };
    }
    clean[key] = value;
  }

  return { ok: true, clean };
}

/**
 * Create GET (list) and POST (create) route handlers for a table.
 * 
 * @param {string} tableName - Supabase table name
 * @param {string[]} requiredFields - Fields required for POST
 * @returns {{ GET: Function, POST: Function }}
 */
export function createCrudRoutes(tableName, requiredFields = ['name']) {

  async function GET(request) {
    const session = await getUser(request);
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').slice(0, 200); // S6: limit search length

    let query = session.supabase
      .from(tableName)
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) return serverError(error.message);

    return Response.json(data || []);
  }

  async function POST(request) {
    const session = await getUser(request);
    if (!session) return unauthorized();

    const body = await request.json().catch(() => null);
    const { ok, error, clean } = validateBody(body, requiredFields);
    if (!ok) return badRequest(error);

    clean.user_id = session.user.id;
    delete clean.id;          // prevent client from setting ID
    delete clean.created_at;  // prevent client from backdating

    const { data, error: dbErr } = await session.supabase
      .from(tableName)
      .insert(clean)
      .select()
      .single();

    if (dbErr) return serverError(dbErr.message);
    return Response.json(data, { status: 201 });
  }

  return { GET, POST };
}

/**
 * Create GET (by ID), PUT (update), and DELETE route handlers for a table.
 * 
 * @param {string} tableName - Supabase table name
 * @returns {{ GET: Function, PUT: Function, DELETE: Function }}
 */
export function createCrudByIdRoutes(tableName) {

  async function GET(request, { params }) {
    const session = await getUser(request);
    if (!session) return unauthorized();

    const { id } = await params;
    const { data, error } = await session.supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(data);
  }

  async function PUT(request, { params }) {
    const session = await getUser(request);
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { ok, error, clean } = validateBody(body || {}, []);
    if (!ok) return badRequest(error);

    // Prevent overwriting system fields
    delete clean.id;
    delete clean.user_id;
    delete clean.created_at;

    const { data, error: dbErr } = await session.supabase
      .from(tableName)
      .update(clean)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (dbErr) return serverError(dbErr.message);
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(data);
  }

  async function DELETE(request, { params }) {
    const session = await getUser(request);
    if (!session) return unauthorized();

    const { id } = await params;
    const { error } = await session.supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) return serverError(error.message);
    return Response.json({ success: true });
  }

  return { GET, PUT, DELETE };
}
