import { getUser, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { data: profile } = await session.supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return Response.json({
    id: session.user.id,
    email: session.user.email,
    name: profile?.name || session.user.email.split('@')[0],
    role: profile?.role || 'Client',
    initials: profile?.initials || 'U',
    company: profile?.company || 'Cabrera Consulting'
  });
}
