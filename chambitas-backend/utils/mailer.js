import nodemailer from "nodemailer";

// Configuración con credenciales directas para evitar errores de lectura del .env
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Regresamos al puerto seguro SSL
  secure: true, // IMPORTANTE: true para puerto 465
  auth: {
    user: "calzadillaemilio@gmail.com",
    pass: "pyniauhuoymbsoww" // Tu clave de aplicación
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000 // Bajamos a 10s para no esperar tanto si falla
});

export async function sendPasswordResetEmail(email, token) {
  // Ajusta esta URL si tu frontend tiene otra dirección en Render
  const url = `https://chambitas-front.onrender.com/reset.html?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `"Soporte Chambitas" <calzadillaemilio@gmail.com>`,
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
          <p style="font-size: 0.8rem; color: #666;">Este enlace es válido por 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `
    });
    console.log("✅ Correo enviado con éxito a:", email);
  } catch (error) {
    console.error("❌ Error detallado al enviar correo:", error);
    throw error;
  }
}