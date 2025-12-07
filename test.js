import fetch from "node-fetch";


async function testRegister() {
  const res = await fetch("http://localhost:4000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: "Cliente Demo",
      correo: "cliente_demo@mail.com",
      contraseña: "12345",
      tipo_usuario: "cliente"
    })
  });

  const data = await res.json();
  console.log("Respuesta del servidor:", data);
}

testRegister();

