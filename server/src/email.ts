import nodemailer from 'nodemailer';
import { outbox, smtpConfig, type OutboxEmail, addToOutbox, updateOutboxStatus } from './data.js';

let cachedSignature: string | null = null;
let cachedTransporter: nodemailer.Transporter | null = null;

function signature() {
  return JSON.stringify({
    enabled: smtpConfig.enabled,
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.user,
    pass: smtpConfig.pass,
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

export const EMAIL_LAYOUT = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starfin Plugins</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #13131a; border: 1px solid #7b2cbf33; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #7b2cbf 0%, #3c096c 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800;">Starfin<span style="color: #c77dff;">Plugins</span></h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #0b0b0f; border-top: 1px solid #7b2cbf22;">
              <p style="margin: 0; color: #666666; font-size: 14px;">&copy; 2026 Starfin Plugins. Todos os direitos reservados.</p>
              <div style="margin-top: 15px;">
                <a href="http://localhost:5173" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Website</a>
                <a href="#" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Discord</a>
                <a href="#" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Suporte</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export function getVerificationEmailHtml(name: string, verifyUrl: string) {
  return EMAIL_LAYOUT(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Olá, ${name}!</h2>
    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Obrigado por se juntar à <strong>Starfin Plugins</strong>. Estamos felizes em ter você conosco! 
      Para ativar sua conta e liberar o acesso aos seus plugins, clique no botão abaixo para confirmar seu email:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(to right, #7b2cbf, #9d4edd); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(123, 44, 191, 0.4);">
            Ativar Minha Conta
          </a>
        </td>
      </tr>
    </table>
    <p style="color: #666666; font-size: 14px; margin-top: 40px; text-align: center;">
      Se o botão não funcionar, copie este link: <br>
      <span style="color: #7b2cbf;">${verifyUrl}</span>
    </p>
  `);
}

export function getPasswordResetEmailHtml(name: string, resetUrl: string) {
  return EMAIL_LAYOUT(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Recuperar Senha</h2>
    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Olá ${name}, recebemos uma solicitação para redefinir a senha da sua conta. 
      Se você não solicitou isso, pode ignorar este email com segurança. O link abaixo é válido por 1 hora.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${resetUrl}" style="background-color: #1a1a22; border: 1px solid #7b2cbf; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </td>
      </tr>
    </table>
  `);
}

export function getOrderConfirmationHtml(name: string, orderId: string, pluginName: string, licenseKey: string) {
  return EMAIL_LAYOUT(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">Obrigado pela compra!</h2>
    <p style="color: #a0a0a8; font-size: 14px; margin-bottom: 30px;">Pedido #${orderId.slice(-6).toUpperCase()}</p>
    
    <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Produto adquirido</p>
      <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">${pluginName}</h3>
      
      <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Sua Chave de Licença</p>
      <div style="background-color: #0b0b0f; border: 1px dashed #7b2cbf; border-radius: 8px; padding: 15px; text-align: center;">
        <code style="color: #ffffff; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${licenseKey}</code>
      </div>
    </div>

    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Sua licença já está ativa e vinculada à sua conta. Você já pode configurar o plugin em seu servidor Minecraft!
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="http://localhost:5173/account" style="background: linear-gradient(to right, #7b2cbf, #9d4edd); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
            Acessar Meus Plugins
          </a>
        </td>
      </tr>
    </table>
  `);
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
  
  addToOutbox(item);

  const transporter = getTransporter();
  if (!transporter) {
    updateOutboxStatus(item.id, false, 'SMTP desabilitado ou incompleto');
    return { ok: true, delivered: false, id: item.id };
  }

  try {
    await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html
    });
    updateOutboxStatus(item.id, true, null);
    return { ok: true, delivered: true, id: item.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Falha ao enviar email';
    updateOutboxStatus(item.id, false, error);
    return { ok: false, delivered: false, id: item.id };
  }
}

export async function testSmtp(to: string) {
  return sendEmail({
    to,
    subject: 'Teste SMTP - StarfinPlugins',
    html: EMAIL_LAYOUT(`
      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Teste de Configuração</h2>
      <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Esta é uma mensagem de teste enviada pela <strong>Starfin Plugins</strong>. 
        Se você está lendo isso, significa que suas configurações de SMTP foram validadas com sucesso!
      </p>
      <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #c77dff; font-size: 14px; margin: 0;">Servidor SMTP operando normalmente.</p>
      </div>
    `)
  });
}

