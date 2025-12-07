import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from 'fs';

const router = express.Router();

// --- CONFIGURACIÓN MULTER ---
const uploadDir = 'uploads/trabajos/';
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

// 1. OBTENER PERFIL
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, nombre, apellidos, correo, tipo_usuario, oficio, domicilio, tarifas, descripcion, carta_presentacion FROM usuarios WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// 2. ACTUALIZAR PERFIL
router.put("/profile", verifyToken, async (req, res) => {
    try {
        const { nombre, apellidos, oficio, domicilio, tarifas, descripcion, carta_presentacion } = req.body;
        await db.query(
            "UPDATE usuarios SET nombre=?, apellidos=?, oficio=?, domicilio=?, tarifas=?, descripcion=?, carta_presentacion=? WHERE id=?",
            [nombre, apellidos, oficio, domicilio, tarifas, descripcion, carta_presentacion, req.user.id]
        );
        res.json({ message: "Perfil actualizado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 3. SUBIR EVIDENCIA
router.post("/evidencia", verifyToken, upload.single("foto"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se subió ninguna imagen" });
        
        const { descripcion } = req.body;
        const ruta = req.file.filename;

        await db.query("INSERT INTO fotos_trabajos (usuario_id, ruta_foto, descripcion) VALUES (?, ?, ?)", 
            [req.user.id, ruta, descripcion || ""]);

        res.json({ message: "Foto subida con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al guardar foto" });
    }
});

// 4. OBTENER EVIDENCIAS DE UN USUARIO
router.get("/evidencia/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM fotos_trabajos WHERE usuario_id = ? ORDER BY fecha_subida DESC", [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener fotos" });
    }
});

// 5. OBTENER LISTA DE TRABAJADORES (PÚBLICA) <--- ESTA FALTABA
router.get("/trabajadores", async (req, res) => {
    try {
        // Seleccionamos solo los campos necesarios para la tarjeta
        const [rows] = await db.query(`
            SELECT id, nombre, apellidos, oficio, descripcion, tarifas 
            FROM usuarios 
            WHERE tipo_usuario = 'trabajador'
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener trabajadores" });
    }
});

export default router;