import { getUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { data, error } = await session.supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) return serverError(error.message);
  return Response.json(data);
}

export async function PUT(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const body = await request.json();
  const allowed = ['name', 'company', 'phone', 'bio', 'timezone', 'initials', 'role'];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await session.supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) return serverError(error.message);
  return Response.json(data);
}
