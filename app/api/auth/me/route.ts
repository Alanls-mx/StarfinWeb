import { requireUser } from '@backend/lib/auth';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const result = await requireUser(auth);
  if (!result) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  return jsonOk({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.role,
      createdAt: result.user.createdAt.toISOString()
    }
  });
}
