const express = require("express");
const path = require("path");

const app = express();
// CAMBIO CLAVE: Render te asignará un puerto, si no existe usa 5500
const PORT = process.env.PORT || 5500; 

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/clientes", express.static(path.join(__dirname, "clientes")));
app.use("/trabajadores", express.static(path.join(__dirname, "trabajadores")));

// El resto de tus rutas se quedan igual...
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