const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../data/db");
const auth = require("../middleware/auth");

const router = express.Router();

// Bonus: /auth/login — daqiqasiga 5 ta urinish
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Juda ko'p urinish, keyinroq qayta urinib ko'ring" },
});

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email va password majburiy" });
  }

  const normEmail = String(email).toLowerCase().trim();
  if (db.users.some((u) => u.email === normEmail)) {
    return res.status(409).json({ error: "Bu email band" });
  }

  const user = {
    id: db.counters.user++,
    name: String(name).trim(),
    email: normEmail,
    password: await bcrypt.hash(String(password), 10),
    role: role === "admin" ? "admin" : "user",
  };
  db.users.push(user);

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email va password majburiy" });
  }

  const user = db.users.find((u) => u.email === String(email).toLowerCase().trim());
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    return res.status(401).json({ error: "Login yoki parol xato" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token });
});

router.get("/me", auth, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "Foydalanuvchi topilmadi" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role || "user" });
});

module.exports = router;
