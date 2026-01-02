import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Forzamos el host directamente para evitar errores de lectura
  port: 465, 
  secure: true, // true para puerto 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // ¡Debe ser una "Contraseña de Aplicación"!
  },
  tls: {
    rejectUnauthorized: false // Ayuda a evitar bloqueos de certificados en la nube
  }
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