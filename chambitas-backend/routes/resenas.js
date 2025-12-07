import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. OBTENER RESEÑAS QUE ME HAN HECHO (Mi Reputación)
router.get("/mis-resenas", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT r.*, u.nombre, u.apellidos 
       FROM resenas r
       JOIN usuarios u ON r.autor_id = u.id
       WHERE r.destinatario_id = ?
       ORDER BY r.fecha DESC`,
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener reseñas." });
  }
});

// 2. OBTENER CITAS COMPLETADAS QUE AÚN NO HE CALIFICADO (Pendientes)
router.get("/pendientes", verifyToken, async (req, res) => {
  try {
    const miId = req.user.id;

    // Lógica:
    // 1. Buscar citas completadas donde yo soy trabajador O cliente.
    // 2. Asegurar que NO exista ya una reseña mía para esa cita.
    const sql = `
      SELECT c.id as cita_id, c.fecha, c.motivo, 
             u.id as otro_usuario_id, u.nombre, u.apellidos, u.tipo_usuario
      FROM citas c
      JOIN usuarios u ON (c.cliente_id = u.id OR c.trabajador_id = u.id)
      WHERE (c.trabajador_id = ? OR c.cliente_id = ?) 
        AND c.estado = 'completada'
        AND u.id != ? -- Queremos los datos de la "otra" persona
        AND c.id NOT IN (SELECT cita_id FROM resenas WHERE autor_id = ?)
    `;

    const [rows] = await db.query(sql, [miId, miId, miId, miId]);
    res.json(rows);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error buscando pendientes." });
  }
});

// 3. CREAR RESEÑA
router.post("/crear", verifyToken, async (req, res) => {
  try {
    const autor_id = req.user.id;
    const { cita_id, destinatario_id, calificacion, comentario } = req.body;

    // Verificar que la cita esté completada antes de dejar reseña
    const [cita] = await db.query("SELECT estado FROM citas WHERE id = ?", [cita_id]);
    if (cita.length === 0 || cita[0].estado !== 'completada') {
        return res.status(400).json({ error: "Solo se pueden reseñar citas completadas." });
    }

    await db.query(
      `INSERT INTO resenas (cita_id, autor_id, destinatario_id, calificacion, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [cita_id, autor_id, destinatario_id, calificacion, comentario]
    );

    res.json({ message: "Reseña publicada correctamente" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al guardar reseña." });
  }
});

export default router;