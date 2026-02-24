import { getUser, unauthorized, badRequest, serverError } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/markdown', 'text/csv', 'text/html',
  'application/json', 'application/xml',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed',
];

// List documents
export async function GET(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { data, error } = await session.supabase
    .from('documents')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return serverError(error.message);
  return Response.json(data || []);
}

// Upload document
export async function POST(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'All Files';

    if (!file) return badRequest('No file provided');
    if (file.size > MAX_FILE_SIZE) return badRequest('File too large (max 10MB)');

    // Validate file type
    const mimeOk = ALLOWED_TYPES.includes(file.type) || file.type.startsWith('text/');
    if (!mimeOk) return badRequest('File type not allowed');

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
    const uid = session.user.id;
    const fileName = `${uid}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: storageData, error: storageErr } = await session.supabase
      .storage
      .from('documents')
      .upload(fileName, buffer, { contentType: file.type });

    if (storageErr) return serverError(storageErr.message);

    // Save metadata
    const { data: doc, error: dbErr } = await session.supabase
      .from('documents')
      .insert({
        user_id: uid,
        name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        folder: folder,
      })
      .select()
      .single();

    if (dbErr) return serverError(dbErr.message);
    return Response.json(doc);
  } catch (err) {
    return serverError('Upload failed: ' + err.message);
  }
}

// Delete document
export async function DELETE(request) {
  const session = await getUser(request);
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('Document ID required');

  const { data: doc } = await session.supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (doc) {
    await session.supabase.storage.from('documents').remove([doc.file_path]);
  }

  const { error } = await session.supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) return serverError(error.message);
  return Response.json({ success: true });
}
