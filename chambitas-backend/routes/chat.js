import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from 'fs';

const router = express.Router();

// Configuración de Multer para fotos del chat
const uploadDir = 'uploads/chat/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. OBTENER MENSAJES Y MARCAR COMO LEÍDOS
router.get("/:citaId", verifyToken, async (req, res) => {
    try {
        // --- NUEVO: Marcar como leídos los mensajes que NO son míos ---
        await db.query(
            "UPDATE mensajes SET leido = 1 WHERE cita_id = ? AND usuario_id != ?",
            [req.params.citaId, req.user.id]
        );
        // -------------------------------------------------------------

        const sql = `
            SELECT m.*, u.nombre, u.apellidos 
            FROM mensajes m
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.cita_id = ?
            ORDER BY m.fecha_envio ASC
        `;
        const [rows] = await db.query(sql, [req.params.citaId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener chat" });
    }
});

// 2. ENVIAR MENSAJE (CON O SIN FOTO)
router.post("/enviar", verifyToken, upload.single("adjunto"), async (req, res) => {
    try {
        const { cita_id, mensaje } = req.body;
        const usuario_id = req.user.id;
        let archivo = null;

        if (req.file) {
            archivo = req.file.filename;
        }

        if (!mensaje && !archivo) {
            return res.status(400).json({ error: "El mensaje no puede estar vacío" });
        }

        await db.query(
            "INSERT INTO mensajes (cita_id, usuario_id, mensaje, archivo_adjunto) VALUES (?, ?, ?, ?)",
            [cita_id, usuario_id, mensaje, archivo]
        );

        res.json({ message: "Mensaje enviado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
});

export default router;