// chambitas-backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // 1. Buscamos el token en la cabecera "Authorization"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(403).json({ message: "No se proporcionó token de acceso" });
  }

  // 2. Verificamos si es válido
  jwt.verify(token, process.env.JWT_SECRET || "secreto", (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
    
    // 3. Si es válido, guardamos los datos del usuario en la petición
    req.user = user;
    next();
  });
};