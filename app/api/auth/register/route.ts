import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { hashPassword, signJwt } from '@backend/lib/auth';
import { getVerificationEmailHtml, sendMail } from '@backend/lib/mail-service';
import { rateLimit } from '@backend/lib/rateLimit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().max(255).trim(),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = await rateLimit({ key: `auth:register:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limit.ok) return jsonError('RATE_LIMITED', 'Muitas tentativas. Tente novamente em instantes.', 429);

  try {
    const input = bodySchema.parse(await req.json());

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return jsonError('FORBIDDEN', 'Email já cadastrado', 409);
    }

    const passwordHash = await hashPassword(input.password);
    
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        verified: false
      }
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt
      }
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://starfinweb.netlify.app'}/verify-email?token=${verificationToken}`;
    await sendMail({
      to: user.email,
      subject: 'Bem-vindo! Confirme seu email - Starfin',
      html: getVerificationEmailHtml(user.name, verifyUrl)
    });

    const token = signJwt({ userId: user.id, role: user.role });
    return jsonOk(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: user.verified,
          createdAt: user.createdAt.toISOString()
        }
      },
      201
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
