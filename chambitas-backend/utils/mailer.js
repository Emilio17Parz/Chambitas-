import { Resend } from 'resend';

// Pega tu API Key directamente aquí entre las comillas
const resend = new Resend('re_M32nVpdk_5AAofGyeHrPbM5j8eP7y5pr3'); 

export async function sendPasswordResetEmail(email, token) {
  // Ajusta la URL si es necesario
  const url = `https://chambitas-front.onrender.com/reset.html?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // OBLIGATORIO: Usa este correo de prueba por ahora
      to: [email], // Solo llegará al correo con el que te registraste en Resend
      subject: 'Recuperación de contraseña - CHAMBITAS.COM',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e37c2a;">Recupera tu acceso</h2>
            <p>Haz clic abajo para cambiar tu contraseña:</p>
            <a href="${url}" style="background-color: #e37c2a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
        </div>
      `
    });

    console.log("✅ Correo enviado vía Resend:", data);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}