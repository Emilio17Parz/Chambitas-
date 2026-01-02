import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { uploadINE } from "../middleware/upload.js";
import { uploadRegistro } from "../middleware/upload.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Ruta AUTH funcionando");
});

// --- REGISTRO ---
router.post("/register", (req, res) => {
  // 2. Usamos el nuevo middleware que maneja múltiples archivos
  uploadRegistro(req, res, async (err) => {
    if (err) {
      console.error("Error Multer:", err);
      return res.status(400).json({ message: "Error al subir archivo", error: err.message });
    }

    try {
      const {
        nombre, apellidos, correo, tipo_usuario, fecha_nacimiento, domicilio, oficio,
        password 
      } = req.body;

      if (!nombre || !correo || !tipo_usuario || !password) {
        return res.status(400).json({ message: "Campos obligatorios incompletos" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Obtenemos los nombres de archivos correctamente desde req.files
      const documento_ine = req.files['ine'] ? req.files['ine'][0].filename : null;
      const foto_perfil = req.files['foto_perfil'] ? req.files['foto_perfil'][0].filename : null;

      // 4. ACTUALIZACIÓN DEL SQL (Agregamos la columna foto_perfil y un '?' extra)
      const sql = `
        INSERT INTO usuarios
        (nombre, apellidos, correo, password, tipo_usuario, 
         fecha_nacimiento, domicilio, oficio, documento_ine, foto_perfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // 5. Agregamos foto_perfil al array de valores
      const [result] = await db.query(sql, [
          nombre, 
          apellidos, 
          correo, 
          hashedPassword, 
          tipo_usuario,
          fecha_nacimiento, 
          domicilio, 
          oficio, 
          documento_ine,
          foto_perfil // <-- ¡No olvides este!
      ]);

      console.log("✅ Usuario registrado con ID:", result.insertId);
      res.json({ message: "Usuario registrado correctamente", id: result.insertId });

    } catch (error) {
      // ... (manejo de errores igual)
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
    const hashGuardado = user.password || ""; 
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