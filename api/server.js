import express from "express";
import cors from "cors";
import pg from "pg";
import { createClient } from "redis";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- PostgreSQL ---
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// --- Redis (carrito en cache) ---
const redis = createClient({ url: `redis://${process.env.REDIS_HOST}:6379` });
redis.on("error", (e) => console.error("Redis error:", e.message));
await redis.connect().catch((e) => console.error("Redis connect:", e.message));

// --- SMTP (MailHog) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
});

const cop = (n) => "$" + Number(n).toLocaleString("es-CO");

// Salud
app.get("/api/health", (req, res) => res.json({ ok: true, servicio: "api" }));

// Categorías con conteo de productos
app.get("/api/categorias", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT categoria, COUNT(*)::int AS total FROM productos GROUP BY categoria ORDER BY categoria"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Listar productos (con filtro opcional por categoría y búsqueda)
app.get("/api/productos", async (req, res) => {
  try {
    const { categoria, q } = req.query;
    const cond = [];
    const args = [];
    if (categoria) { args.push(categoria); cond.push(`categoria = $${args.length}`); }
    if (q) { args.push(`%${q}%`); cond.push(`(nombre ILIKE $${args.length} OR descripcion ILIKE $${args.length})`); }
    const where = cond.length ? "WHERE " + cond.join(" AND ") : "";
    const { rows } = await pool.query(`SELECT * FROM productos ${where} ORDER BY id`, args);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Detalle de un producto
app.get("/api/productos/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM productos WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Carrito guardado en Redis por sesión
app.post("/api/carrito/:sesion", async (req, res) => {
  try {
    await redis.set(`cart:${req.params.sesion}`, JSON.stringify(req.body.items || []));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/carrito/:sesion", async (req, res) => {
  try {
    const data = await redis.get(`cart:${req.params.sesion}`);
    res.json(data ? JSON.parse(data) : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Checkout: guarda pedido (PostgreSQL) + envía correo (MailHog) + limpia carrito (Redis)
app.post("/api/checkout", async (req, res) => {
  try {
    const { cliente, email, telefono, direccion, items, sesion } = req.body;
    if (!cliente || !email || !items?.length)
      return res.status(400).json({ error: "Datos incompletos" });

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const detalle = items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ");

    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente, email, telefono, direccion, total, detalle)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [cliente, email, telefono || null, direccion || null, total, detalle]
    );
    const pedidoId = rows[0].id;

    const filas = items
      .map((i) => `<tr><td>${i.nombre}</td><td align="center">x${i.cantidad}</td><td align="right">${cop(i.precio * i.cantidad)}</td></tr>`)
      .join("");

    await transporter.sendMail({
      from: '"NEXUS Games" <no-reply@nexusgames.lat>',
      to: email,
      subject: `🎮 Confirmación de pedido #${pedidoId} — NEXUS Games`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;background:#0f1117;color:#e7e9ee;padding:24px;border-radius:12px">
          <h2 style="color:#8b5cf6">¡Gracias por tu compra, ${cliente}! 🎮</h2>
          <p>Tu pedido <b>#${pedidoId}</b> fue confirmado.</p>
          <table width="100%" style="border-collapse:collapse;margin:16px 0">
            <thead><tr style="color:#9aa3b2;text-align:left"><th>Producto</th><th align="center">Cant.</th><th align="right">Subtotal</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
          <p style="font-size:18px"><b>Total: ${cop(total)}</b></p>
          ${direccion ? `<p style="color:#9aa3b2">Envío a: ${direccion}</p>` : ""}
          <p style="color:#9aa3b2;font-size:13px">NEXUS Games · Garantía incluida · Envío a todo el país</p>
        </div>`,
    });

    if (sesion) await redis.del(`cart:${sesion}`);

    res.json({ ok: true, pedidoId, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`API en puerto ${PORT}`));
