import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || '"Starfin Marketplace" <noreply@starfin.com>';

export async function sendMail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      ...options,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export function getVerificationEmailHtml(name: string, verifyUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Olá ${name}, bem-vindo ao Starfin!</h2>
      <p style="font-size: 16px; color: #555;">Obrigado por se cadastrar em nossa plataforma. Para ativar sua conta e começar a usar nossos plugins, por favor confirme seu email clicando no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Confirmar Email</a>
      </div>
      <p style="font-size: 14px; color: #888;">Se o botão acima não funcionar, copie e cole este link no seu navegador:</p>
      <p style="font-size: 14px; color: #007bff; word-break: break-all;">${verifyUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">Se você não criou esta conta, por favor ignore este email.</p>
    </div>
  `;
}

export function getPasswordResetEmailHtml(name: string, resetUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Recuperação de Senha</h2>
      <p style="font-size: 16px; color: #555;">Olá ${name}, recebemos uma solicitação para redefinir a senha da sua conta Starfin. Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
      </div>
      <p style="font-size: 14px; color: #888;">Se você não solicitou isso, pode ignorar este email com segurança. Sua senha atual permanecerá a mesma.</p>
      <p style="font-size: 14px; color: #888;">O link expirará em 1 hora.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  `;
}

export function getOrderConfirmationHtml(name: string, orderId: string, pluginName: string, licenseKey: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #28a745;">Pedido Confirmado!</h2>
      <p style="font-size: 16px; color: #555;">Olá ${name}, seu pedido <strong>#${orderId}</strong> foi processado com sucesso.</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Detalhes do Produto:</h3>
        <p style="margin: 5px 0;"><strong>Plugin:</strong> ${pluginName}</p>
        <p style="margin: 5px 0;"><strong>Sua Licença:</strong> <code style="background: #e9ecef; padding: 2px 5px; border-radius: 3px; font-size: 1.1em;">${licenseKey}</code></p>
      </div>
      <p style="font-size: 16px; color: #555;">Você já pode baixar o plugin e ativá-lo usando a chave acima no seu servidor.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Ir para Meus Plugins</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">Obrigado por escolher o Starfin!</p>
    </div>
  `;
}
