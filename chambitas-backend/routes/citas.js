import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from 'fs';

const router = express.Router();

// --- CONFIGURACIÓN MULTER (FOTOS) ---
const uploadDir = 'uploads/citas/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. CREAR CITA
router.post("/crear", verifyToken, upload.single("foto_problema"), async (req, res) => {
    try {
        const { trabajador_id, fecha, hora, direccion_servicio, motivo } = req.body;
        const cliente_id = req.user.id;
        
        let foto = null;
        if (req.file) foto = req.file.filename;

        const sql = `INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, direccion_servicio, motivo, foto_problema, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`;
        
        await db.query(sql, [cliente_id, trabajador_id, fecha, hora, direccion_servicio, motivo, foto]);
        res.json({ message: "Solicitud enviada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear cita" });
    }
});

// 2. OBTENER MIS CITAS (CON CONTEO DE MENSAJES SIN LEER)
router.get("/mis-citas", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Obtenemos el rol asegurando compatibilidad
        const role = req.user.tipo_usuario || req.user.tipo; 
        
        let sql = "";
        
        // La subconsulta (SELECT COUNT...) cuenta los mensajes de esa cita 
        // que NO fui yo quien envió (usuario_id != userId) y que no están leídos (leido = 0).
        const subQueryMensajes = `(SELECT COUNT(*) FROM mensajes m WHERE m.cita_id = c.id AND m.usuario_id != ? AND m.leido = 0)`;

        if (role === 'cliente') {
            sql = `
                SELECT c.*, 
                       u.nombre AS otro_nombre, 
                       u.apellidos AS otro_apellidos, 
                       u.telefono, u.oficio,
                       ${subQueryMensajes} AS sin_leer
                FROM citas c 
                LEFT JOIN usuarios u ON c.trabajador_id = u.id 
                WHERE c.cliente_id = ? 
                ORDER BY c.fecha DESC, c.hora DESC
            `;
        } else {
            sql = `
                SELECT c.*, 
                       u.nombre AS otro_nombre, 
                       u.apellidos AS otro_apellidos, 
                       u.telefono, u.domicilio,
                       ${subQueryMensajes} AS sin_leer
                FROM citas c 
                LEFT JOIN usuarios u ON c.cliente_id = u.id 
                WHERE c.trabajador_id = ? 
                ORDER BY c.fecha DESC, c.hora DESC
            `;
        }
        
        // Pasamos userId dos veces: una para el COUNT y otra para el WHERE principal
        const [rows] = await db.query(sql, [userId, userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener citas" });
    }
});

// 3. OBTENER DETALLE DE UNA CITA (Para el Modal)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const citaId = req.params.id;
        // Traemos también nombres para el modal si fuera necesario
        const sql = `SELECT * FROM citas WHERE id = ?`;
        const [rows] = await db.query(sql, [citaId]);
        
        if (rows.length === 0) return res.status(404).json({ error: "No encontrada" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// 4. CAMBIAR ESTADO
router.put("/estado/:id", verifyToken, async (req, res) => {
    try {
        const { estado } = req.body;
        await db.query("UPDATE citas SET estado = ? WHERE id = ?", [estado, req.params.id]);
        res.json({ message: "Estado actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

export default router;