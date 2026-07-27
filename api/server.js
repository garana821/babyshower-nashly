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

// ---------- Mesa de Regalos ----------

function getDefaultGifts() {
  const list = [
    "Silla alta de comer para bebé",
    "Mecedora / Sillón de lactancia",
    "Corral cuna de viaje",
    "Bolso pañalera cambiador",
    "Silla de seguridad para carro",
    "Cochecito de bebé / Silla de paseo",
    "Almohada / Cojín de lactancia",
    "Set de biberones anticólicos y tetinas",
    "Cambiador portátil acolchado",
    "Esterilizador de biberones",
    "Procesador / Licuadora Baby Bullet",
    "Almohada de embarazo para dormir",
    "Extractor de leche (Saca leches) eléctrico",
    "Calentador de biberones rápido",
    "Bañera para bebé con soporte",
    "Pañales Talla RN (Recién Nacido)",
    "Pañales Talla P (Pequeño)",
    "Pañales Talla M (Mediano)",
    "Pañales Talla G (Grande)",
    "Toallitas húmedas para bebé (Packs)"
  ];
  return list.map((name, index) => {
    const nameLower = name.toLowerCase();
    const isUnlimited = (nameLower.includes("pañal") || nameLower.includes("pamper") || nameLower.includes("toallit") || nameLower.includes("toalla")) && !nameLower.includes("pañalera");
    return {
      id: `gift-${index + 1}`,
      name,
      reserved: false,
      reservedBy: "",
      unlimited: isUnlimited,
      reservations: []
    };
  });
}

// Obtener lista de regalos
api.get("/gifts", (req, res) => {
  const db = readDB();
  if (!db.gifts) {
    db.gifts = getDefaultGifts();
    writeDB(db);
  } else {
    // Migración: asegurar que los regalos existentes tengan el flag unlimited y el array de reservas
    let updated = false;
    db.gifts.forEach(gift => {
      const nameLower = gift.name.toLowerCase();
      const shouldBeUnlimited = gift.unlimited || ((nameLower.includes("pañal") || nameLower.includes("pamper") || nameLower.includes("toallit") || nameLower.includes("toalla")) && !nameLower.includes("pañalera"));
      if (gift.unlimited !== shouldBeUnlimited) {
        gift.unlimited = shouldBeUnlimited;
        updated = true;
      }
      if (gift.unlimited) {
        if (!gift.reservations) {
          gift.reservations = [];
          if (gift.reserved && gift.reservedBy) {
            gift.reservations.push({
              reservedBy: gift.reservedBy,
              reservedAt: gift.reservedAt || new Date().toISOString()
            });
          }
          updated = true;
        }
        if (gift.reserved) {
          gift.reserved = false;
          gift.reservedBy = "";
          if (gift.reservedAt) delete gift.reservedAt;
          updated = true;
        }
      }
    });
    if (updated) {
      writeDB(db);
    }
  }
  res.json(db.gifts);
});

// Reservar un regalo
api.post("/gifts/:id/reserve", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre de la persona que reserva es obligatorio" });
  }

  const db = readDB();
  if (!db.gifts) {
    db.gifts = getDefaultGifts();
  }

  const gift = db.gifts.find(g => g.id === req.params.id);
  if (!gift) return res.status(404).json({ error: "Regalo no encontrado" });

  if (gift.unlimited) {
    if (!gift.reservations) gift.reservations = [];
    gift.reservations.push({
      reservedBy: name.trim(),
      reservedAt: new Date().toISOString()
    });
    gift.reserved = false;
    gift.reservedBy = "";
    if (gift.reservedAt) delete gift.reservedAt;
  } else {
    if (gift.reserved) return res.status(400).json({ error: "Este regalo ya está reservado" });
    gift.reserved = true;
    gift.reservedBy = name.trim();
    gift.reservedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json(gift);
});

// Reservar múltiples regalos a la vez
api.post("/gifts/reserve-multiple", (req, res) => {
  const { name, giftIds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre de la persona que reserva es obligatorio" });
  }
  if (!giftIds || !Array.isArray(giftIds) || giftIds.length === 0) {
    return res.status(400).json({ error: "Debes seleccionar al menos un regalo" });
  }

  const db = readDB();
  if (!db.gifts) {
    db.gifts = getDefaultGifts();
  }

  const reservedGifts = [];
  const errors = [];

  giftIds.forEach(id => {
    const gift = db.gifts.find(g => g.id === id);
    if (!gift) {
      errors.push(`Regalo con ID ${id} no encontrado`);
      return;
    }

    if (gift.unlimited) {
      if (!gift.reservations) gift.reservations = [];
      gift.reservations.push({
        reservedBy: name.trim(),
        reservedAt: new Date().toISOString()
      });
      gift.reserved = false;
      gift.reservedBy = "";
      if (gift.reservedAt) delete gift.reservedAt;
    } else {
      if (gift.reserved) {
        errors.push(`El regalo "${gift.name}" ya está reservado`);
        return;
      }
      gift.reserved = true;
      gift.reservedBy = name.trim();
      gift.reservedAt = new Date().toISOString();
    }
    reservedGifts.push(gift);
  });

  if (errors.length > 0 && reservedGifts.length === 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }

  writeDB(db);
  res.json({ success: true, reserved: reservedGifts, errors });
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

// --- Métodos de administración para Mesa de Regalos ---

// Crear regalo (Admin)
api.post("/gifts/admin", (req, res) => {
  const { name, unlimited } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre del regalo es obligatorio" });
  }

  const db = readDB();
  if (!db.gifts) db.gifts = getDefaultGifts();

  const nameLower = name.toLowerCase();
  const isUnlimited = !!unlimited || ((nameLower.includes("pañal") || nameLower.includes("pamper") || nameLower.includes("toallit") || nameLower.includes("toalla")) && !nameLower.includes("pañalera"));

  const newGift = {
    id: "gift-" + crypto.randomBytes(3).toString("hex"),
    name: name.trim(),
    reserved: false,
    reservedBy: "",
    unlimited: isUnlimited,
    reservations: []
  };

  db.gifts.push(newGift);
  writeDB(db);
  res.status(201).json(newGift);
});

// Eliminar regalo (Admin)
api.delete("/gifts/admin/:id", (req, res) => {
  const db = readDB();
  if (!db.gifts) db.gifts = getDefaultGifts();

  const idx = db.gifts.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Regalo no encontrado" });

  const [removed] = db.gifts.splice(idx, 1);
  writeDB(db);
  res.json(removed);
});

// Liberar / Desmarcar regalo reservado (Admin)
api.post("/gifts/admin/:id/free", (req, res) => {
  const { reservationIndex } = req.body;
  const db = readDB();
  if (!db.gifts) db.gifts = getDefaultGifts();

  const gift = db.gifts.find(g => g.id === req.params.id);
  if (!gift) return res.status(404).json({ error: "Regalo no encontrado" });

  if (gift.unlimited) {
    if (gift.reservations && reservationIndex !== undefined && reservationIndex >= 0 && reservationIndex < gift.reservations.length) {
      gift.reservations.splice(reservationIndex, 1);
    } else {
      gift.reservations = [];
    }
  } else {
    gift.reserved = false;
    gift.reservedBy = "";
    if (gift.reservedAt) delete gift.reservedAt;
  }

  writeDB(db);
  res.json(gift);
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
