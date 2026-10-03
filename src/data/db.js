// Xotiradagi ma'lumotlar ombori + seed data
const users = [];
const bookings = [];

const movies = [
  { id: 1, title: "Mad Max: Fury Road", genre: "action", duration: 120 },
  { id: 2, title: "Inception", genre: "sci-fi", duration: 148 },
  { id: 3, title: "The Hangover", genre: "comedy", duration: 100 },
];

const sessions = [
  { id: 1, movieId: 1, time: "2026-10-01T18:00", hall: "A", rows: 5, seatsPerRow: 8 },
  { id: 2, movieId: 1, time: "2026-10-01T21:00", hall: "B", rows: 6, seatsPerRow: 10 },
  { id: 3, movieId: 2, time: "2026-10-02T19:00", hall: "A", rows: 5, seatsPerRow: 8 },
  { id: 4, movieId: 3, time: "2026-10-02T20:30", hall: "C", rows: 4, seatsPerRow: 6 },
];

const counters = { user: 1, booking: 1, movie: 4, session: 5 };

module.exports = { users, bookings, movies, sessions, counters };
