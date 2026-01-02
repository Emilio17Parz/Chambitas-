import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465, // Cambiado a 465 para mayor estabilidad
  secure: true, // Debe ser true para el puerto 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Asegúrate de usar una "Contraseña de Aplicación" de Google
  },
  connectionTimeout: 10000 // 10 segundos antes de fallar
});

export async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.FRONT_URL || 'https://chambitas-front.onrender.com'}/reset.html?token=${token}`;
  
  await transporter.sendMail({
    from: `"Soporte Chambitas" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Recuperación de contraseña - CHAMBITAS.COM",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e37c2a; text-align: center;">CHAMBITAS.COM</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón para continuar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #e37c2a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
        </div>
        <p style="font-size: 0.8rem; color: #666;">Este enlace es válido por 1 hora.</p>
      </div>
    `
  });
}