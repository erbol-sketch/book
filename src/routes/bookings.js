const express = require("express");
const db = require("../data/db");
const auth = require("../middleware/auth");

const router = express.Router();
const MAX_SEATS_PER_SESSION = 4;

// Barcha booking yo'llari uchun avtorizatsiya talab qilinadi
router.use(auth);

// POST /bookings
router.post("/", (req, res) => {
  const { sessionId: rawSessionId, row: rawRow, seat: rawSeat } = req.body || {};

  if (
    rawSessionId === undefined ||
    rawRow === undefined ||
    rawSeat === undefined ||
    rawSessionId === "" ||
    rawRow === "" ||
    rawSeat === ""
  ) {
    return res.status(400).json({ error: "sessionId, row va seat butun son bo'lishi kerak" });
  }

  const sessionId = Number(rawSessionId);
  const row = Number(rawRow);
  const seat = Number(rawSeat);

  if (!Number.isInteger(sessionId) || !Number.isInteger(row) || !Number.isInteger(seat)) {
    return res.status(400).json({ error: "sessionId, row va seat butun son bo'lishi kerak" });
  }

  // 1. Seans topilmasa 404
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Seans topilmadi" });
  }

  // 2. Zal chegarasidan tashqarida bo'lsa 400
  if (row < 1 || row > session.rows || seat < 1 || seat > session.seatsPerRow) {
    return res.status(400).json({
      error: `Joy zal chegarasidan tashqarida (qator: 1-${session.rows}, joy: 1-${session.seatsPerRow})`,
    });
  }

  // 3. Joy allaqachon band bo'lsa 409
  if (db.bookings.some((b) => b.sessionId === sessionId && b.row === row && b.seat === seat)) {
    return res.status(409).json({ error: "Bu joy band" });
  }

  // 4. Bitta user bitta seansda 4 tadan ortiq joy band qila olmaydi, oshsa 400
  const userBookingsInSession = db.bookings.filter(
    (b) => b.userId === req.user.id && b.sessionId === sessionId
  );
  if (userBookingsInSession.length >= MAX_SEATS_PER_SESSION) {
    return res.status(400).json({
      error: `Bitta seansda ${MAX_SEATS_PER_SESSION} tadan ortiq joy band qilib bo'lmaydi`,
    });
  }

  const booking = {
    id: db.counters.booking++,
    userId: req.user.id,
    sessionId,
    row,
    seat,
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);

  res.status(201).json(booking);
});

// GET /bookings/my
router.get("/my", (req, res) => {
  res.json(db.bookings.filter((b) => b.userId === req.user.id));
});

// DELETE /bookings/:id
router.delete("/:id", (req, res) => {
  const bookingId = Number(req.params.id);
  const idx = db.bookings.findIndex((b) => b.id === bookingId);

  if (idx === -1) {
    return res.status(404).json({ error: "Band topilmadi" });
  }

  // Birovning bandini o'chirmoqchi bo'lsa 403
  if (db.bookings[idx].userId !== req.user.id) {
    return res.status(403).json({ error: "Bu band sizniki emas" });
  }

  db.bookings.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;
