require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET .env yoki environment variables ichida berilishi kerak");
  process.exit(1);
}

const app = express();

// Render reverse proxy va rate limit uchun
app.set("trust proxy", 1);

// CORS sozlamasi
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Asosiy sahifa Swagger hujjatlariga yo'naltiradi
app.get("/", (req, res) => res.redirect("/api-docs"));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Marshrutlar (Routes)
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/movies"));
app.use("/bookings", require("./routes/bookings"));

// 404 Route topilmadi
app.use((req, res) => res.status(404).json({ error: "Route topilmadi" }));

// Xatoliklarni ushlovchi middleware
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Noto'g'ri JSON" });
  }
  console.error("Server xatosi:", err);
  res.status(500).json({ error: "Server xatosi" });
});

// Port va serverni ishga tushirish
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎬 CineBook API ishga tushdi: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
