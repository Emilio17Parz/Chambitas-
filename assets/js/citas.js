const API_URL = "https://chambitas-backend-ncie.onrender.com";

async function cargarCitas() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/citas`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();

  const cont = document.getElementById("listaCitas");
  cont.innerHTML = "";

  data.forEach(c => {
    cont.innerHTML += `
      <div class="card" style="margin-bottom:16px;">
        <h3>${c.estado.toUpperCase()} – ${c.fecha} / ${c.hora}</h3>
        <p><strong>Cliente:</strong> ${c.cliente_nombre}</p>
        <p><strong>Motivo:</strong> ${c.motivo || "—"}</p>
        <p><strong>Dirección:</strong> ${c.direccion_servicio || "—"}</p>

        <div class="hero-actions">
          <button class="btn btn-primary" onclick="cambiarEstado(${c.id}, 'aceptada')">Aceptar</button>
          <button class="btn btn-muted" onclick="cambiarEstado(${c.id}, 'rechazada')">Rechazar</button>
          <button class="btn btn-primary" onclick="cambiarEstado(${c.id}, 'completada')">Completada</button>
          <button class="btn btn-danger" onclick="eliminarCita(${c.id})">Eliminar</button>
        </div>
      </div>
    `;
  });
}

async function cambiarEstado(id, estado) {
  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/api/citas/estado/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ estado })
  });

  cargarCitas();
}

async function eliminarCita(id) {
  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/api/citas/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });

  cargarCitas();
}
// OBTENER citas según rol
router.get("/calendario", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tipo = req.user.tipo;

    let query = `
      SELECT c.id, c.fecha, c.hora, c.estado, c.motivo,
             u.nombre AS cliente_nombre,
             t.nombre AS trabajador_nombre
      FROM citas c
      JOIN usuarios u ON u.id = c.cliente_id
      JOIN usuarios t ON t.id = c.trabajador_id
    `;

    if (tipo === "cliente") query += ` WHERE c.cliente_id = ${userId}`;
    if (tipo === "trabajador") query += ` WHERE c.trabajador_id = ${userId}`;

    query += ` ORDER BY fecha, hora`;

    const [rows] = await db.query(query);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener calendario" });
  }
});


window.onload = cargarCitas;
