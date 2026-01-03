import nodemailer from "nodemailer";

// Configuración optimizada para Gmail
export const transporter = nodemailer.createTransport({
  service: 'gmail', // Esto ajusta automáticamente host y puertos correctos
  auth: {
    user: "calzadillaemilio@gmail.com",
    pass: "pyniauhuoymbsoww" // Tu clave de aplicación
  },
  tls: {
    rejectUnauthorized: false
  },
  // IMPORTANTE: Forzamos IPv4. A veces Render intenta IPv6 y Gmail lo rechaza, causando el timeout.
  family: 4 
});

export async function sendPasswordResetEmail(email, token) {
  // Ajusta la URL si es necesario
  const url = `https://chambitas-front.onrender.com/reset.html?token=${token}`;
  
  try {
    await transporter.verify(); // Verificamos conexión antes de enviar
    console.log("🔌 Conexión con Gmail verificada correctamente.");

    await transporter.sendMail({
      from: `"Soporte Chambitas" <calzadillaemilio@gmail.com>`,
      to: email,
      subject: "Recuperación de contraseña - CHAMBITAS.COM",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e37c2a; text-align: center;">CHAMBITAS.COM</h2>
          <p>Has solicitado restablecer tu contraseña.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #e37c2a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
          </div>
          <p style="font-size: 0.8rem; color: #666;">Enlace válido por 1 hora.</p>
        </div>
      `
    });
    console.log("✅ Correo enviado con éxito a:", email);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}