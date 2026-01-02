import express from "express";
import { db } from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadRegistro } from "../middleware/upload.js"; // Importamos el middleware de carga múltiple
import multer from "multer";
import path from "path";
import fs from 'fs';

const router = express.Router();

// --- CONFIGURACIÓN MULTER (PARA EVIDENCIAS) ---
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

// 1. OBTENER PERFIL (Incluye foto_perfil)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
        "SELECT id, nombre, apellidos, correo, tipo_usuario, oficio, domicilio, tarifas, descripcion, carta_presentacion, foto_perfil, telefono FROM usuarios WHERE id = ?", 
        [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// 2. ACTUALIZAR PERFIL (Soporte para FormData y Foto)
router.put("/profile", verifyToken, (req, res) => {
    // Usamos uploadRegistro para capturar la nueva foto si existe
    uploadRegistro(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });

        try {
            const { nombre, apellidos, oficio, domicilio, tarifas, descripcion, carta_presentacion, telefono } = req.body;
            
            // Verificamos si se subió una nueva foto
            const nuevaFoto = req.files && req.files['foto_perfil'] ? req.files['foto_perfil'][0].filename : null;

            // Construcción dinámica del query
            let sql = `
                UPDATE usuarios 
                SET nombre=?, apellidos=?, oficio=?, domicilio=?, tarifas=?, descripcion=?, carta_presentacion=?, telefono=?
            `;
            let params = [nombre, apellidos, oficio, domicilio, tarifas, descripcion, carta_presentacion, telefono];

            if (nuevaFoto) {
                sql += `, foto_perfil=?`;
                params.push(nuevaFoto);
            }

            sql += ` WHERE id=?`;
            params.push(req.user.id);

            await db.query(sql, params);
            res.json({ message: "Perfil actualizado correctamente", foto: nuevaFoto });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al actualizar perfil" });
        }
    });
});

// 3. SUBIR EVIDENCIA (Igual)
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

// 4. OBTENER EVIDENCIAS (Igual)
router.get("/evidencia/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM fotos_trabajos WHERE usuario_id = ? ORDER BY fecha_subida DESC", [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener fotos" });
    }
});

// 5. OBTENER LISTA DE TRABAJADORES (PÚBLICA - Incluye foto_perfil)
router.get("/trabajadores", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, nombre, apellidos, oficio, descripcion, tarifas, foto_perfil, telefono 
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