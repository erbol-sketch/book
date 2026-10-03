const express = require("express");
const db = require("../data/db");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /movies?genre=action&page=1&limit=2
router.get("/movies", (req, res) => {
  const { genre } = req.query;
  const page = parseInt(req.query.page ?? "1", 10);
  const limit = parseInt(req.query.limit ?? "10", 10);

  if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ error: "page va limit musbat son bo'lishi kerak" });
  }

  let list = db.movies;
  if (genre) {
    list = list.filter((m) => m.genre.toLowerCase() === String(genre).toLowerCase().trim());
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const data = list.slice((page - 1) * limit, page * limit);

  res.json({ data, page, limit, total, totalPages });
});

// Bonus: POST /movies (faqat role: "admin" bo'lgan userga)
router.post("/movies", auth, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Faqat admin filmlar qo'sha oladi" });
  }

  const { title, genre, duration } = req.body || {};
  if (!title || !genre || !duration || isNaN(Number(duration)) || Number(duration) <= 0) {
    return res.status(400).json({ error: "title, genre va duration (musbat son) majburiy" });
  }

  const movie = {
    id: db.counters.movie++,
    title: String(title).trim(),
    genre: String(genre).toLowerCase().trim(),
    duration: Number(duration),
  };
  db.movies.push(movie);

  res.status(201).json(movie);
});

// GET /movies/:id
router.get("/movies/:id", (req, res) => {
  const movieId = Number(req.params.id);
  const movie = db.movies.find((m) => m.id === movieId);
  if (!movie) return res.status(404).json({ error: "Film topilmadi" });

  res.json({
    ...movie,
    sessions: db.sessions.filter((s) => s.movieId === movie.id),
  });
});

// GET /sessions/:id/seats
router.get("/sessions/:id/seats", (req, res) => {
  const sessionId = Number(req.params.id);
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) return res.status(404).json({ error: "Seans topilmadi" });

  const taken = new Set(
    db.bookings
      .filter((b) => b.sessionId === session.id)
      .map((b) => `${b.row}-${b.seat}`)
  );

  const seats = [];
  for (let row = 1; row <= session.rows; row++) {
    for (let seat = 1; seat <= session.seatsPerRow; seat++) {
      seats.push({ row, seat, taken: taken.has(`${row}-${seat}`) });
    }
  }

  // Bonus: ?format=map — ASCII xarita
  if (req.query.format === "map") {
    const lines = [];
    for (let row = 1; row <= session.rows; row++) {
      lines.push(
        seats
          .filter((s) => s.row === row)
          .map((s) => (s.taken ? "[X]" : "[ ]"))
          .join("")
      );
    }
    return res.type("text/plain").send(lines.join("\n"));
  }

  res.json({
    sessionId: session.id,
    rows: session.rows,
    seatsPerRow: session.seatsPerRow,
    seats,
  });
});

module.exports = router;
