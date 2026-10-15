import { jsonError } from '@backend/lib/http';
export const runtime = 'nodejs';

// Deprecated: an authenticated customer could previously mint their own active licenses.
// Manual grants belong exclusively to the audited administrative flow.
export async function POST() {
  return jsonError('FORBIDDEN', 'Geracao direta de licencas desativada.', 403);
}
