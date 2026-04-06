import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { getPasswordResetEmailHtml, sendMail } from '@backend/lib/mail-service';
import { rateLimit } from '@backend/lib/rateLimit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().max(255).trim()
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = await rateLimit({ key: `auth:forgot-password:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limit.ok) return jsonError('RATE_LIMITED', 'Muitas tentativas. Tente novamente em instantes.', 429);

  try {
    const input = bodySchema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user) {
      // Return 200 even if user doesn't exist for security reasons
      return jsonOk({ success: true, message: 'Se o email existir, um link de recuperação foi enviado.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://starfinweb.netlify.app'}/auth/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Recuperação de Senha - Starfin',
      html: getPasswordResetEmailHtml(user.name, resetUrl)
    });

    return jsonOk({ success: true, message: 'Se o email existir, um link de recuperação foi enviado.' });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
