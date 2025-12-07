import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, t.descripcion, t.experiencia, t.telefono, t.zona
      FROM usuarios u
      JOIN trabajadores t ON t.id = u.id
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener trabajadores" });
  }
});

export default router;
