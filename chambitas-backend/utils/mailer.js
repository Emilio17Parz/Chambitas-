import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configuración del transportador
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para puerto 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Función para enviar el correo de recuperación
export async function sendPasswordResetEmail(email, token) {
  // Asegúrate de que FRONT_URL en Render sea https://chambitas-front.onrender.com
  const url = `${process.env.FRONT_URL || 'http://localhost:3000'}/reset.html?token=${token}`;
  
  await transporter.sendMail({
    from: `"Soporte Chambitas" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Recuperación de contraseña - CHAMBITAS.COM",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e37c2a; text-align: center;">CHAMBITAS.COM</h2>
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #e37c2a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
        </div>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="color: #1f5478;">${url}</p>
        <p style="font-size: 0.8rem; color: #666; margin-top: 30px;">Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `
  });
}