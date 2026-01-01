import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { uploadINE } from "../middleware/upload.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Ruta AUTH funcionando");
});

// --- REGISTRO ---
router.post("/register", (req, res) => {
  uploadINE(req, res, async (err) => {
    // 1. Error al subir el archivo (Multer)
    if (err) {
      console.error("Error Multer:", err);
      return res.status(400).json({ message: "Error al subir archivo", error: err.message });
    }

    // 2. Extracción de datos
    try {
      const {
        nombre, apellidos, correo, tipo_usuario, fecha_nacimiento, domicilio, oficio,
        contraseña, password 
      } = req.body;

      const passFinal = password || contraseña;

      // 3. Validación de campos obligatorios
      if (!nombre || !correo || !tipo_usuario || !passFinal) {
        return res.status(400).json({ message: "Campos obligatorios incompletos" });
      }

      // 4. Encriptar contraseña
      const hashedPassword = await bcrypt.hash(passFinal, 10);
      const documento_ine = req.file ? req.file.filename : null;

      const sql = `
        INSERT INTO usuarios
        (nombre, apellidos, correo, contraseña, tipo_usuario,
         fecha_nacimiento, domicilio, oficio, documento_ine)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // 5. Insertar en BD (MODO ASYNC/AWAIT CORREGIDO)
      const [result] = await db.query(sql, [
          nombre, 
          apellidos, 
          correo, 
          hashedPassword, 
          tipo_usuario,
          fecha_nacimiento, 
          domicilio, 
          oficio, 
          documento_ine
      ]);

      console.log("✅ Usuario registrado con ID:", result.insertId);
      res.json({ message: "Usuario registrado correctamente", id: result.insertId });

    } catch (error) {
      // 6. Manejo de errores (Aquí atrapamos el correo duplicado)
      if (error.code === 'ER_DUP_ENTRY') {
        console.warn("⚠️ Intento de registro con correo duplicado:", req.body.correo);
        return res.status(400).json({ message: "El correo ya está registrado. Intenta iniciar sesión." });
      }

      console.error("❌ Error en el servidor:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    
    // Buscar usuario
    const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];
    const hashGuardado = user.contraseña || ""; 
    const passIngresada = contraseña || "";

    const valid = await bcrypt.compare(passIngresada, hashGuardado);
    // Auto-fix para usuario t1 (opcional, si lo sigues usando)
    if (!valid && correo === 't1@mail.com' && contraseña === '123456') {
        const hashNuevo = await bcrypt.hash("123456", 10);
        await db.query("UPDATE usuarios SET contraseña = ? WHERE id = ?", [hashNuevo, user.id]);
        valid = true;
    }

    if (!valid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, tipo: user.tipo_usuario },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "3h" }
    );

    res.json({ token, tipo: user.tipo_usuario, nombre: user.nombre });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error del servidor" });
  }
});

export default router;