import nodemailer from 'nodemailer';
import { outbox, smtpConfig, type OutboxEmail } from './data.js';

let cachedSignature: string | null = null;
let cachedTransporter: nodemailer.Transporter | null = null;

function signature() {
  return JSON.stringify({
    enabled: smtpConfig.enabled,
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.user,
    fromName: smtpConfig.fromName,
    fromEmail: smtpConfig.fromEmail
  });
}

function getTransporter() {
  const sig = signature();
  if (sig !== cachedSignature) {
    cachedSignature = sig;
    cachedTransporter = null;
  }
  if (!smtpConfig.enabled) return null;
  if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.fromEmail) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.user
      ? {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      : undefined
  });
  return cachedTransporter;
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const item: OutboxEmail = {
    id: `mail_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    createdISO: new Date().toISOString(),
    delivered: false,
    error: null
  };
  outbox.unshift(item);

  const transporter = getTransporter();
  if (!transporter) {
    item.error = 'SMTP desabilitado ou incompleto';
    return { ok: true, delivered: false, id: item.id };
  }

  try {
    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html
    });
    item.delivered = true;
    return { ok: true, delivered: true, id: item.id };
  } catch (e) {
    item.error = e instanceof Error ? e.message : 'Falha ao enviar email';
    return { ok: false, delivered: false, id: item.id };
  }
}

export async function testSmtp(to: string) {
  return sendEmail({
    to,
    subject: 'Teste SMTP - StarfinPlugins',
    html: '<p>Se você recebeu este email, sua configuração SMTP está funcionando.</p>'
  });
}

