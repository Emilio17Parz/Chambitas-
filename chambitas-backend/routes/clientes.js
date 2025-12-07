import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// OBTENER TODOS LOS CLIENTES (Manuales + De Citas Activas)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Clientes Manuales (Tu agenda personal)
    const [manuales] = await db.query(
      "SELECT * FROM clientes WHERE trabajador_id = ? ORDER BY fecha_registro DESC",
      [userId]
    );

    // 2. Clientes de Citas Activas (Pendientes o Aceptadas)
    // Traemos el nombre del usuario y la dirección de la cita
    const [deCitas] = await db.query(
      `SELECT u.nombre, c.direccion_servicio as direccion, u.telefono, 'Cliente de App' as notas, c.id as cita_id
       FROM citas c
       JOIN usuarios u ON c.cliente_id = u.id
       WHERE c.trabajador_id = ? 
       AND c.estado IN ('pendiente', 'aceptada')`,
      [userId]
    );

    // 3. Mezclamos ambas listas
    // Agregamos un distintivo para saber cuál es cuál
    const listaFinal = [
        ...manuales.map(c => ({ ...c, origen: 'manual' })),
        ...deCitas.map(c => ({ ...c, id: 'temp_' + c.cita_id, origen: 'app', fecha_registro: new Date() }))
    ];

    res.json(listaFinal);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// Crear cliente manual
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, telefono, direccion, notas } = req.body;

    await db.query(
      `INSERT INTO clientes (trabajador_id, nombre, telefono, direccion, notas) VALUES (?, ?, ?, ?, ?)`,
      [userId, nombre, telefono, direccion, notas]
    );
    res.json({ message: "Cliente agregado a tu agenda" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al agregar cliente" });
  }
});

// Eliminar cliente (Solo manuales)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Si el ID empieza con "temp_", es de la app y no se borra aquí (se borra cancelando la cita)
    if (String(id).startsWith("temp_")) {
        return res.status(400).json({ error: "Este cliente viene de una cita activa. Cancela la cita para quitarlo." });
    }

    const userId = req.user.id;
    await db.query("DELETE FROM clientes WHERE id=? AND trabajador_id=?", [id, userId]);
    res.json({ message: "Cliente eliminado de la agenda" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

export default router;