import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, token: string) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Sorteo App" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Recuperación de contraseña',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1f2937">Recuperar contraseña</h2>
        <p style="color:#6b7280">Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
        <a href="${resetLink}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">
          Restablecer contraseña
        </a>
        <p style="color:#9ca3af;font-size:12px">
          Si no solicitaste esto, ignora este correo.<br/>
          El enlace expira en 1 hora.
        </p>
      </div>
    `,
  });
}