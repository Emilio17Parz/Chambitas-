const express = require("express");
const path = require("path");

const app = express();
const PORT = 5500;

// 1. IMPORTANTE: Servir archivos estáticos PRIMERO
// Esto permite que el navegador encuentre style.css, app.js, imágenes, etc.
app.use("/assets", express.static(path.join(__dirname, "assets")));
// Si tienes carpetas 'clientes' o 'trabajadores', sírvelas también:
app.use("/clientes", express.static(path.join(__dirname, "clientes")));
app.use("/trabajadores", express.static(path.join(__dirname, "trabajadores")));

// 2. Ruta para la raíz (Index)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 3. Ruta comodín (Para cualquier otro HTML en la raíz)
app.get("/:page", (req, res) => {
  const page = req.params.page;
  // Solo enviar archivo si termina en .html
  if (page.endsWith(".html")) {
    res.sendFile(path.join(__dirname, page));
  } else {
    // Si piden algo raro, mandamos 404 o el index
    res.status(404).send("Archivo no encontrado");
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Frontend corriendo en http://localhost:${PORT}`);
});