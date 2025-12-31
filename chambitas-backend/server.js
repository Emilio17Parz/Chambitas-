import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./config/db.js";

// --- IMPORTAR RUTAS ---
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js"; // <--- NUEVO IMPORT
import citasRoutes from "./routes/citas.js";
import resenasRoutes from "./routes/resenas.js";
import clientesRoutes from "./routes/clientes.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CONFIGURACIÓN DE CARPETAS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json());
// MIDDLEWARES
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// LOG DE TRÁFICO
app.use((req, res, next) => {
  console.log(`📡 Recibida petición: ${req.method} ${req.url}`);
  next();
});

// --- USAR RUTAS ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // <--- HABILITA EL PERFIL
app.use("/api/citas", citasRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/api/citas", citasRoutes); // (Descomentar cuando tengas el archivo de citas)

// RUTA BASE
app.get("/", (req, res) => {
  res.send("🚀 Servidor Backend Chambitas funcionando correctamente.");
});

// INICIAR
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta de uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`==================================================\n`);
});