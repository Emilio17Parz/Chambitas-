import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Definir rutas de carpetas
const ineDir = path.join(__dirname, "../uploads/ine");
const perfilesDir = path.join(__dirname, "../uploads/perfiles");

// Asegurar que ambas carpetas existan
[ineDir, perfilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 2. Configuración del almacenamiento dinámico
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Si el campo es foto_perfil va a su carpeta, si no a ine
    if (file.fieldname === "foto_perfil") {
      cb(null, perfilesDir);
    } else {
      cb(null, ineDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Nombre único: timestamp-nombredelcampo.extension
    const fileName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, fileName);
  }
});

// 3. Filtro de archivos inteligente
const fileFilter = (req, file, cb) => {
  const isImage = ["image/jpeg", "image/png"].includes(file.mimetype);
  const isPDF = file.mimetype === "application/pdf";

  if (file.fieldname === "foto_perfil") {
    // La foto de perfil SOLO puede ser imagen
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error("La foto de perfil debe ser JPG o PNG"), false);
    }
  } else {
    // La INE puede ser imagen o PDF
    if (isImage || isPDF) {
      cb(null, true);
    } else {
      cb(new Error("La INE debe ser PDF, JPG o PNG"), false);
    }
  }
};

// 4. Exportar middleware para CAMPOS MÚLTIPLES
export const uploadRegistro = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por archivo
}).fields([
  { name: "ine", maxCount: 1 },
  { name: "foto_perfil", maxCount: 1 }
]);