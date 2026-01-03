import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: 'gmail', // Usamos la configuración predefinida de Google
  auth: {
    user: "jecalzadilla@tecnomedia.com.mx", 
    pass: "xkcfcdpaduhrggst" // Tu clave de aplicación
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4 // <--- ESTO ES MAGIA: Fuerza a usar IPv4 y evita bloqueos de red en Render
});

export async function sendPasswordResetEmail(email, token) {
  const url = `https://chambitas-front.onrender.com/reset.html?token=${token}`;
  
  console.log("⏳ Intentando enviar correo a:", email);

  try {
    // Verificamos conexión antes de enviar
    await transporter.verify();
    console.log("🔌 Servidor de correo listo.");

    await transporter.sendMail({
      from: `"Soporte Chambitas" <calzadillaemilio@gmail.com>`,
      to: email,
      subject: "Recuperación de contraseña - CHAMBITAS.COM",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e37c2a; text-align: center;">CHAMBITAS.COM</h2>
          <p>Haz clic abajo para cambiar tu contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #e37c2a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
          </div>
          <p style="font-size: 0.8rem; color: #666;">Válido por 1 hora.</p>
        </div>
      `
    });
    console.log("✅ Correo enviado con éxito.");
  } catch (error) {
    console.error("❌ Error FATAL enviando correo:", error);
    throw error; // Esto hará que veas el error real en los logs
  }
}