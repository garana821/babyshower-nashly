/**
 * Baby Shower — API de invitados
 * Node.js + Express + base de datos en archivo JSON (sin dependencias externas de DB).
 * Sirve también el sitio estático (invitación + panel admin) desde la raíz del proyecto,
 * así que con "npm start" queda todo funcionando en un solo puerto.
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "..", "database", "db.json");
const ROOT_DIR = path.join(__dirname, "..");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Utilidades de la "base de datos" ----------

function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function newId() {
  return "g" + crypto.randomBytes(4).toString("hex");
}

const VALID_STATUS = ["confirmed", "pending", "declined"];

// ---------- Autenticación Básica (Opcional) ----------
function adminAuth(req, res, next) {
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedPass) {
    return next(); // Si no se configura contraseña, el panel queda libre
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Baby Shower Admin"');
    return res.status(401).send("Autenticación requerida.");
  }

  try {
    const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf-8").split(":");
    const user = auth[0];
    const pass = auth[1];

    const expectedUser = process.env.ADMIN_USER || "admin";

    if (user !== expectedUser || pass !== expectedPass) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Baby Shower Admin"');
      return res.status(401).send("Credenciales incorrectas.");
    }

    next();
  } catch (err) {
    return res.status(400).send("Formato de autenticación inválido.");
  }
}

function computeStats(guests) {
  const total = guests.length;
  const confirmed = guests.filter((g) => g.status === "confirmed");
  const pending = guests.filter((g) => g.status === "pending");
  const declined = guests.filter((g) => g.status === "declined");

  const confirmedAttendees = confirmed.reduce((sum, g) => sum + (Number(g.attendees) || 0), 0);

  return {
    totalGuests: total,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    declinedCount: declined.length,
    confirmedAttendees,
    confirmationRate: total === 0 ? 0 : Math.round((confirmed.length / total) * 100)
  };
}

// ---------- Rutas API ----------

const api = express.Router();

// Info del evento (Público)
api.get("/event", (req, res) => {
  const db = readDB();
  res.json(db.event);
});

// Crear invitado (usado por el formulario público de RSVP) - (Público)
api.post("/guests", (req, res) => {
  const { firstName, lastName, phone, attendees, status, message } = req.body;

  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  const db = readDB();

  const guest = {
    id: newId(),
    firstName: String(firstName).trim(),
    lastName: String(lastName || "").trim(),
    phone: String(phone || "").trim(),
    attendees: Math.max(1, Number(attendees) || 1),
    status: VALID_STATUS.includes(status) ? status : "confirmed",
    message: String(message || "").trim(),
    createdAt: new Date().toISOString()
  };

  db.guests.push(guest);
  writeDB(db);
  res.status(201).json(guest);
});

// --- Rutas protegidas por autenticación básica ---
api.use(adminAuth);

// Editar info del evento
api.put("/event", (req, res) => {
  const db = readDB();
  db.event = { ...db.event, ...req.body };
  writeDB(db);
  res.json(db.event);
});

// Listar invitados
api.get("/guests", (req, res) => {
  const db = readDB();
  let guests = db.guests;

  const { status, q } = req.query;
  if (status && VALID_STATUS.includes(status)) {
    guests = guests.filter((g) => g.status === status);
  }
  if (q) {
    const needle = String(q).toLowerCase();
    guests = guests.filter((g) =>
      `${g.firstName} ${g.lastName} ${g.phone}`.toLowerCase().includes(needle)
    );
  }

  res.json(guests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Un invitado
api.get("/guests/:id", (req, res) => {
  const db = readDB();
  const guest = db.guests.find((g) => g.id === req.params.id);
  if (!guest) return res.status(404).json({ error: "Invitado no encontrado" });
  res.json(guest);
});

// Editar invitado completo
api.put("/guests/:id", (req, res) => {
  const db = readDB();
  const idx = db.guests.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invitado no encontrado" });

  const current = db.guests[idx];
  const { firstName, lastName, phone, attendees, status, message } = req.body;

  db.guests[idx] = {
    ...current,
    firstName: firstName !== undefined ? String(firstName).trim() : current.firstName,
    lastName: lastName !== undefined ? String(lastName).trim() : current.lastName,
    phone: phone !== undefined ? String(phone).trim() : current.phone,
    attendees: attendees !== undefined ? Math.max(1, Number(attendees) || 1) : current.attendees,
    status: VALID_STATUS.includes(status) ? status : current.status,
    message: message !== undefined ? String(message).trim() : current.message
  };

  writeDB(db);
  res.json(db.guests[idx]);
});

// Cambiar solo el estado
api.patch("/guests/:id/confirm", (req, res) => {
  const db = readDB();
  const idx = db.guests.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invitado no encontrado" });

  const { status } = req.body;
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  db.guests[idx].status = status;
  writeDB(db);
  res.json(db.guests[idx]);
});

// Eliminar invitado
api.delete("/guests/:id", (req, res) => {
  const db = readDB();
  const idx = db.guests.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invitado no encontrado" });

  const [removed] = db.guests.splice(idx, 1);
  writeDB(db);
  res.json(removed);
});

// Estadísticas para el dashboard
api.get("/stats", (req, res) => {
  const db = readDB();
  res.json(computeStats(db.guests));
});

app.use("/api", api);

// ---------- Sitio estático ----------

// Proteger el acceso a los archivos del panel de administración
app.use((req, res, next) => {
  const url = req.path.toLowerCase();
  if (
    url === "/admin.html" ||
    url === "/admin" ||
    url.startsWith("/js/admin.js") ||
    url.startsWith("/css/admin.css")
  ) {
    return adminAuth(req, res, next);
  }
  next();
});

app.use(express.static(ROOT_DIR));

app.get("/admin", adminAuth, (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "admin.html"));
});

app.listen(PORT, () => {
  console.log(`\n🐚  Baby Shower app corriendo en http://localhost:${PORT}`);
  console.log(`🌊  Panel admin en       http://localhost:${PORT}/admin.html`);
  console.log(`🔌  API en               http://localhost:${PORT}/api/guests\n`);
});
