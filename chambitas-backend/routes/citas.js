import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. OBTENER CITAS (Inteligente: Detecta Rol)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.tipo; // El token ya trae el tipo ('cliente' o 'trabajador')

    let sql = "";
    
    if (userRole === 'trabajador') {
        // Si soy Trabajador, quiero ver el nombre del Cliente
        sql = `SELECT c.*, u.nombre AS otro_nombre, u.apellidos AS otro_apellidos, 'cliente' as rol_otro
               FROM citas c
               JOIN usuarios u ON u.id = c.cliente_id
               WHERE c.trabajador_id = ?
               ORDER BY c.fecha ASC, c.hora ASC`;
    } else {
        // Si soy Cliente, quiero ver el nombre del Trabajador
        sql = `SELECT c.*, u.nombre AS otro_nombre, u.apellidos AS otro_apellidos, 'trabajador' as rol_otro
               FROM citas c
               JOIN usuarios u ON u.id = c.trabajador_id
               WHERE c.cliente_id = ?
               ORDER BY c.fecha ASC, c.hora ASC`;
    }

    const [rows] = await db.query(sql, [userId]);
    res.json(rows);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

// 2. CREAR CITA (Con validación de NO EMPALME)
router.post("/crear", verifyToken, async (req, res) => {
  try {
    const cliente_id = req.user.id; // El que solicita es el usuario logueado (Cliente)
    const { trabajador_id, fecha, hora, motivo, direccion_servicio } = req.body;

    // --- VALIDACIÓN ANTI-EMPALME ---
    // Buscamos si ya existe una cita para ese trabajador, en esa fecha y hora
    // que NO esté rechazada ni cancelada.
    const [existente] = await db.query(
        `SELECT id FROM citas 
         WHERE trabajador_id = ? 
         AND fecha = ? 
         AND hora = ? 
         AND estado NOT IN ('rechazada', 'cancelada')`,
        [trabajador_id, fecha, hora]
    );

    if (existente.length > 0) {
        return res.status(400).json({ error: "Horario no disponible. Ya existe una cita agendada." });
    }
    // -------------------------------

    await db.query(
      `INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, motivo, direccion_servicio)
       VALUES (?, ?, ?, ?, 'pendiente', ?, ?)`,
      [cliente_id, trabajador_id, fecha, hora, motivo, direccion_servicio]
    );

    res.json({ message: "Cita solicitada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al solicitar cita" });
  }
});

// 3. ACTUALIZAR ESTADO (Aceptar, Rechazar, Completar)
router.put("/estado/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validStates = ["pendiente", "aceptada", "rechazada", "cancelada", "completada"];

    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    await db.query("UPDATE citas SET estado=? WHERE id=?", [estado, id]);

    res.json({ message: "Estado actualizado correctamente" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// 4. ELIMINAR CITA
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM citas WHERE id=?", [id]);
    res.json({ message: "Cita eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar cita" });
  }
});

export default router;