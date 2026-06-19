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

// Salud
app.get("/api/health", (req, res) => res.json({ ok: true, servicio: "api" }));

// Listar productos (PostgreSQL)
app.get("/api/productos", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM productos ORDER BY id");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Carrito guardado en Redis por sesion simple
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

// Checkout: guarda pedido (PostgreSQL) + envia correo (MailHog) + limpia carrito (Redis)
app.post("/api/checkout", async (req, res) => {
  try {
    const { cliente, email, items, sesion } = req.body;
    if (!cliente || !email || !items?.length)
      return res.status(400).json({ error: "Datos incompletos" });

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const detalle = items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ");

    const { rows } = await pool.query(
      "INSERT INTO pedidos (cliente, email, total, detalle) VALUES ($1,$2,$3,$4) RETURNING id",
      [cliente, email, total, detalle]
    );
    const pedidoId = rows[0].id;

    await transporter.sendMail({
      from: '"Tienda Distribuidos" <no-reply@distribuidos.lat>',
      to: email,
      subject: `Confirmacion de pedido #${pedidoId}`,
      html: `<h2>Gracias por tu compra, ${cliente}!</h2>
             <p>Pedido <b>#${pedidoId}</b></p>
             <p>Productos: ${detalle}</p>
             <p>Total: <b>$${total.toLocaleString()}</b></p>`,
    });

    if (sesion) await redis.del(`cart:${sesion}`);

    res.json({ ok: true, pedidoId, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`API en puerto ${PORT}`));
