import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Usamos createPool en lugar de createConnection para mayor estabilidad en la nube
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Render leerá su variable (21868) y tu PC usará el 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Pool de conexión a MySQL configurado');