// CineBook API Avtomatik Sinov To'plami
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_12345";
process.env.PORT = "3099";

const app = require("./src/index");
const db = require("./src/data/db");

let server;
const BASE_URL = "http://localhost:3099";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status, body };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log("=========================================");
  console.log("🎬 CineBook API Test Boshlandi");
  console.log("=========================================\n");

  server = app.listen(3099);

  try {
    // ----------------------------------------------------
    // 1️⃣ Auth testlari
    // ----------------------------------------------------
    console.log("--- 1. Auth Testlari ---");

    // 1.1 Register
    const regRes = await request("/auth/register", {
      method: "POST",
      body: { name: "Ali", email: "ali@cinebook.uz", password: "password123" },
    });
    assert(regRes.status === 201, "Ali ro'yxatdan o'tdi (201)");
    assert(regRes.body.email === "ali@cinebook.uz", "Ali emaili to'g'ri qaytdi");
    assert(!regRes.body.password, "Parol javobda qaytmadi (xavfsiz)");

    // 1.2 Duplicate email
    const dupRes = await request("/auth/register", {
      method: "POST",
      body: { name: "Ali 2", email: "ali@cinebook.uz", password: "password123" },
    });
    assert(dupRes.status === 409, "Bir xil email bilan ro'yxatdan o'tishda 409 qaytdi");

    // 1.3 Missing fields
    const missRes = await request("/auth/register", {
      method: "POST",
      body: { email: "no-name@cinebook.uz", password: "123" },
    });
    assert(missRes.status === 400, "Maydon yetishmaganda 400 qaytdi");

    // 1.4 Wrong login
    const wrongLogin = await request("/auth/login", {
      method: "POST",
      body: { email: "ali@cinebook.uz", password: "wrongpassword" },
    });
    assert(wrongLogin.status === 401, "Noto'g'ri parolda 401 qaytdi");

    // 1.5 Correct login
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: { email: "ali@cinebook.uz", password: "password123" },
    });
    assert(loginRes.status === 200 && !!loginRes.body.token, "To'g'ri login bilan token olindi (200)");
    const aliToken = loginRes.body.token;

    // 1.6 GET /auth/me
    const meRes = await request("/auth/me", {
      headers: { Authorization: `Bearer ${aliToken}` },
    });
    assert(meRes.status === 200, "GET /auth/me muvaffaqiyatli (200)");
    assert(meRes.body.name === "Ali" && !meRes.body.password, "GET /auth/me parolsiz user ma'lumotini qaytardi");

    // 1.7 GET /auth/me without token
    const noTokenRes = await request("/auth/me");
    assert(noTokenRes.status === 401, "Tokensiz GET /auth/me 401 qaytardi");

    // ----------------------------------------------------
    // 2️⃣ Filmlar va seanslar testlari
    // ----------------------------------------------------
    console.log("\n--- 2. Filmlar va Seanslar Testlari ---");

    // 2.1 Seed data
    assert(db.movies.length >= 3, "Kamida 3 ta film seed data mavjud");
    assert(db.sessions.length >= 4, "Kamida 4 ta seans seed data mavjud");

    // 2.2 GET /movies pagination & filter
    const moviesRes = await request("/movies?genre=action&page=1&limit=2");
    assert(moviesRes.status === 200, "GET /movies?genre=action&page=1&limit=2 (200)");
    assert(moviesRes.body.page === 1, "page: 1 to'g'ri");
    assert(moviesRes.body.limit === 2, "limit: 2 to'g'ri");
    assert(typeof moviesRes.body.total === "number", "total maydoni mavjud");
    assert(typeof moviesRes.body.totalPages === "number", "totalPages maydoni mavjud");
    assert(Array.isArray(moviesRes.body.data), "data massiv shaklida");

    // 2.3 GET /movies/:id
    const movieDetail = await request("/movies/1");
    assert(movieDetail.status === 200, "GET /movies/1 film topildi (200)");
    assert(Array.isArray(movieDetail.body.sessions), "Film ichida seanslar ro'yxati mavjud");

    const movieNotFound = await request("/movies/9999");
    assert(movieNotFound.status === 404, "Mavjud bo'lmagan film uchun 404 qaytdi");

    // 2.4 GET /sessions/:id/seats
    const seatsRes = await request("/sessions/1/seats");
    assert(seatsRes.status === 200, "GET /sessions/1/seats joylar xaritasi qaytdi (200)");
    assert(Array.isArray(seatsRes.body.seats), "seats massiv mavjud");

    // 2.5 Bonus: ?format=map
    const mapRes = await request("/sessions/1/seats?format=map");
    assert(mapRes.status === 200 && typeof mapRes.body === "string" && mapRes.body.includes("[ ]"), "Bonus ?format=map ASCII xaritani qaytardi");

    // ----------------------------------------------------
    // 3️⃣ Topshiriqdagi Asosiy Sinov Stsenariysi
    // ----------------------------------------------------
    console.log("\n--- 3. Topshiriqdagi Sinov Stsenariysi (Ali va Vali) ---");

    // Qadam 1: Vali ro'yxatdan o'tadi va login qiladi
    await request("/auth/register", {
      method: "POST",
      body: { name: "Vali", email: "vali@cinebook.uz", password: "vali_password" },
    });
    const valiLogin = await request("/auth/login", {
      method: "POST",
      body: { email: "vali@cinebook.uz", password: "vali_password" },
    });
    const valiToken = valiLogin.body.token;
    assert(!!valiToken, "1. Vali ro'yxatdan o'tdi va login qildi");

    // Qadam 2: Ali 1-seansda 3-qator 5-joyni band qiladi: 201
    const aliBooking = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${aliToken}` },
      body: { sessionId: 1, row: 3, seat: 5 },
    });
    assert(aliBooking.status === 201, "2. Ali 1-seansda 3-qator 5-joyni band qildi (201)");
    const aliBookingId = aliBooking.body.id;

    // Qadam 3: Vali o'sha joyni band qilmoqchi bo'ladi: 409
    const valiBookingConflict = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 3, seat: 5 },
    });
    assert(valiBookingConflict.status === 409, "3. Vali o'sha joyni band qilmoqchi bo'lganda 409 qaytdi");
    assert(valiBookingConflict.body.error === "Bu joy band", "Xatolik matni: 'Bu joy band'");

    // Qadam 4: Vali Alining bandini o'chirmoqchi bo'ladi: 403
    const valiDeleteAli = await request(`/bookings/${aliBookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${valiToken}` },
    });
    assert(valiDeleteAli.status === 403, "4. Vali Alining bandini o'chirmoqchi bo'lganda 403 qaytdi");

    // Qadam 5: Ali o'z bandini o'chiradi, keyin Vali o'sha joyni band qiladi: 201
    const aliDeleteOwn = await request(`/bookings/${aliBookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${aliToken}` },
    });
    assert(aliDeleteOwn.status === 204, "5.1 Ali o'z bandini muvaffaqiyatli bekor qildi (204)");

    const valiBookNow = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 3, seat: 5 },
    });
    assert(valiBookNow.status === 201, "5.2 Vali bo'shagan o'sha joyni band qildi (201)");

    // Qadam 6: /sessions/1/seats so'rovida o'sha joy taken: true bo'lib ko'rinadi
    const session1Seats = await request("/sessions/1/seats");
    const seat35 = session1Seats.body.seats.find((s) => s.row === 3 && s.seat === 5);
    assert(seat35 && seat35.taken === true, "6. /sessions/1/seats da 3-qator 5-joy taken: true bo'lib ko'rindi");

    // ----------------------------------------------------
    // 4️⃣ Cheklovlar va qo'shimcha booking qoidalari
    // ----------------------------------------------------
    console.log("\n--- 4. Qo'shimcha Cheklovlar va Xatoliklar ---");

    // 4.1 Zal chegarasidan tashqarida bo'lsa: 400 (5 qatorli zalda 9-qator)
    const outOfBounds = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 9, seat: 2 },
    });
    assert(outOfBounds.status === 400, "Zal chegarasidan tashqari joy uchun 400 qaytdi");

    // 4.2 Seans topilmasa: 404
    const noSessionBooking = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 9999, row: 1, seat: 1 },
    });
    assert(noSessionBooking.status === 404, "Mavjud bo'lmagan seans uchun 404 qaytdi");

    // 4.3 Bitta seansda 4 tadan ortiq joy band qila olmaydi, oshsa 400
    // Vali hozirda 1 ta joy band qilgan (row 3, seat 5)
    // 2-joy:
    await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 1, seat: 1 },
    });
    // 3-joy:
    await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 1, seat: 2 },
    });
    // 4-joy:
    await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 1, seat: 3 },
    });

    // 5-joy (limitdan oshadi):
    const fifthBooking = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { sessionId: 1, row: 1, seat: 4 },
    });
    assert(fifthBooking.status === 400, "Bitta seansda 5-joyni band qilmoqchi bo'lganda 400 qaytdi (limit 4)");

    // 4.4 GET /bookings/my
    const myBookings = await request("/bookings/my", {
      headers: { Authorization: `Bearer ${valiToken}` },
    });
    assert(myBookings.status === 200, "GET /bookings/my muvaffaqiyatli (200)");
    assert(myBookings.body.length === 4, "Vali uchun to'g'ri 4 ta band qaytdi");

    // ----------------------------------------------------
    // 5️⃣ Bonus: Admin roli testi
    // ----------------------------------------------------
    console.log("\n--- 5. Bonus: Admin Roli Testi ---");

    // Oddiy user POST /movies qilsa 403
    const normalUserAddMovie = await request("/movies", {
      method: "POST",
      headers: { Authorization: `Bearer ${valiToken}` },
      body: { title: "Dune", genre: "sci-fi", duration: 155 },
    });
    assert(normalUserAddMovie.status === 403, "Oddiy foydalanuvchi film qo'shmoqchi bo'lsa 403 qaytdi");

    // Admin user ro'yxatdan o'tadi
    await request("/auth/register", {
      method: "POST",
      body: { name: "Bosh Admin", email: "admin@cinebook.uz", password: "adminsecretpassword", role: "admin" },
    });
    const adminLogin = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@cinebook.uz", password: "adminsecretpassword" },
    });
    const adminToken = adminLogin.body.token;

    const adminAddMovie = await request("/movies", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: "Dune: Part Two", genre: "sci-fi", duration: 166 },
    });
    assert(adminAddMovie.status === 201, "Admin muvaffaqiyatli yangi film qo'shdi (201)");
    assert(adminAddMovie.body.title === "Dune: Part Two", "Qo'shilgan film nomi to'g'ri");

    console.log("\n=========================================");
    console.log(`🎉 BARCHA TESTLAR MUVAFFAQIYATLI O'TDI!`);
    console.log(`O'tdi: ${passed} ta, Xatolar: ${failed} ta`);
    console.log("=========================================\n");
  } catch (err) {
    console.error("\n❌ Test jarayonida xatolik yuz berdi:", err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
