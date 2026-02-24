import { getUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { data, error } = await session.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return serverError(error.message);
  return Response.json(data || []);
}

export async function PUT(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { id, read } = await request.json();

  if (id === 'all') {
    const { error } = await session.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id);
    if (error) return serverError(error.message);
    return Response.json({ success: true });
  }

  const { data, error } = await session.supabase
    .from('notifications')
    .update({ read: read !== undefined ? read : true })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) return serverError(error.message);
  return Response.json(data);
}
