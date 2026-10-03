# 🎬 CineBook API — Kinoteatr Joy Band Qilish Backend Xizmati

Node.js va Express asosida yaratilgan kinoteatr joylarini band qilish uchun REST API backend xizmati. Ma'lumotlar xotiradagi massivlarda (in-memory) saqlanadi, JWT autentifikatsiya, role-based access, to'liq Swagger hujjati va avtomatik testlar to'plami bilan jihozlangan.

---

## 🚀 Texnologiyalar

- **Runtime:** Node.js (>= 18)
- **Framework:** Express.js
- **Xavfsizlik:** JWT (jsonwebtoken), bcryptjs, express-rate-limit
- **Hujjatlashtirish:** Swagger UI (swagger-ui-express, OpenAPI 3.0.3)
- **Deploy:** Render

---

## 📁 Papka Tuzilmasi

```text
cinebook/
├── src/
│   ├── data/
│   │   └── db.js            # Xotiradagi massivlar va seed data (3 ta film, 4 ta seans)
│   ├── middleware/
│   │   └── auth.js          # JWT Bearer token tekshiruvchi middleware
│   ├── routes/
│   │   ├── auth.js          # Register, Login (rate limit), Me
│   │   ├── movies.js        # Filmlar (pagination, filter), seanslar, o'rindiqlar xaritasi, admin POST
│   │   └── bookings.js      # Joy band qilish, o'zimning bandlarim, bekor qilish
│   ├── index.js             # Express server sozlamasi va entrypoint
│   └── swagger.js           # OpenAPI 3.0.3 Swagger spetsifikatsiyasi
├── .env.example             # Muhit o'zgaruvchilari namunasi
├── package.json             # Loyiha konfiguratsiyasi va skriptlar
├── test.js                  # Avtomatik sinovlar to'plami
└── README.md                # Loyiha qo'llanmasi
```

---

## ⚙️ O'rnatish va Ishga Tushirish

### 1. Qaramliklarni o'rnatish:
```bash
npm install
```

### 2. Muhit o'zgaruvchilarini sozlash:
`.env` faylini yarating (`.env.example` asosida):
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Serverni ishga tushirish:
```bash
# Oddiy ishga tushirish
npm start

# Watch rejimida (avtomatik qayta yuklash)
npm run dev
```

Server ishga tushgach:
- **API va Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 4. Avtomatik testlarni ishga tushirish:
```bash
npm test
```

---

## 📚 API Endpointlar Ro'yxati

### 1️⃣ Autentifikatsiya (`/auth`)

| Method | URL | Himoya | Tavsif | Status kodlar |
|---|---|:---:|---|---|
| `POST` | `/auth/register` | Ochiq | Yangi foydalanuvchini ro'yxatdan o'tkazish | `201`, `400`, `409` |
| `POST` | `/auth/login` | Ochiq | Login qilish va JWT token olish (5 req/min) | `200`, `400`, `401`, `429` |
| `GET` | `/auth/me` | 🔒 Token | Joriy user ma'lumotlarini olish (parolsiz) | `200`, `401` |

### 2️⃣ Filmlar va Seanslar

| Method | URL | Himoya | Tavsif | Status kodlar |
|---|---|:---:|---|---|
| `GET` | `/movies?genre=action&page=1&limit=2` | Ochiq | Filmlar ro'yxati (filter & pagination) | `200`, `400` |
| `POST` | `/movies` | 🔒 Admin | Yangi film qo'shish (⭐️ Bonus: Admin roli) | `201`, `400`, `401`, `403` |
| `GET` | `/movies/:id` | Ochiq | Film ma'lumoti va uning seanslari | `200`, `404` |
| `GET` | `/sessions/:id/seats` | Ochiq | Seansdagi joylar xaritasi (`taken: true/false`) | `200`, `404` |
| `GET` | `/sessions/:id/seats?format=map` | Ochiq | ⭐️ Bonus: Joylarni ASCII xaritada ko'rish (`[ ][X][ ]`) | `200`, `404` |

### 3️⃣ Joy Band Qilish (`/bookings`)

| Method | URL | Himoya | Tavsif | Status kodlar |
|---|---|:---:|---|---|
| `POST` | `/bookings` | 🔒 Token | Joy band qilish `{ sessionId, row, seat }` | `201`, `400`, `401`, `404`, `409` |
| `GET` | `/bookings/my` | 🔒 Token | Faqat o'zining band qilgan joylari | `200`, `401` |
| `DELETE` | `/bookings/:id` | 🔒 Token | Band qilingan joyni bekor qilish | `204`, `401`, `403`, `404` |

---

## 🔒 Band Qilish Qoidalari (Biznes Mantiq)

1. **Chegara tekshiruvi:** `row` yoki `seat` zal chegarasidan tashqarida bo'lsa `400` qaytadi.
2. **Bandlik tekshiruvi:** Joy allaqachon band bo'lsa `409` `{ "error": "Bu joy band" }` qaytadi.
3. **Seans tekshiruvi:** Berilgan `sessionId` topilmasa `404` `{ "error": "Seans topilmadi" }` qaytadi.
4. **Boshqaning bandini o'chirish taqiqlanadi:** Birovning bandini o'chirmoqchi bo'lsa `403` `{ "error": "Bu band sizniki emas" }` qaytadi.
5. **Maksimal joy limiti:** Bitta foydalanuvchi bitta seansda 4 tadan ortiq joy band qila olmaydi, oshsa `400` qaytadi.

---

## ⭐️ Qo'shimcha Bonus Imkoniyatlar (Bajarildi)

- ✅ **Login Rate Limit:** `/auth/login` uchun daqiqasiga maksimal 5 ta urinish (`express-rate-limit`).
- ✅ **Admin Roli:** `POST /movies` endpointi faqat `role: "admin"` bo'lgan foydalanuvchilar uchun ochiq (oddiy foydalanuvchilarga `403`).
- ✅ **ASCII Joylar Xaritasi:** `GET /sessions/:id/seats?format=map` so'rovi orqali joylarni chiroyli `[ ][X][ ]` matnli xarita shaklida olish imkoniyati.

---

## ✅ Sinov Stsenariysi (Ali va Vali)

1. **Ali ro'yxatdan o'tadi va login qiladi:**
   - `POST /auth/register` -> `{ name: "Ali", email: "ali@mail.com", password: "123" }` -> `201`
   - `POST /auth/login` -> Token olinadi.
2. **Ali 1-seansda 3-qator 5-joyni band qiladi:**
   - `POST /bookings` -> `{ sessionId: 1, row: 3, seat: 5 }` -> `201`
3. **Vali ro'yxatdan o'tadi va o'sha joyni band qilmoqchi bo'ladi:**
   - `POST /bookings` -> `{ sessionId: 1, row: 3, seat: 5 }` -> `409` (`Bu joy band`)
4. **Vali Alining bandini o'chirmoqchi bo'ladi:**
   - `DELETE /bookings/1` -> `403` (`Bu band sizniki emas`)
5. **Ali o'z bandini o'chiradi, keyin Vali o'sha joyni band qiladi:**
   - Ali: `DELETE /bookings/1` -> `204`
   - Vali: `POST /bookings` -> `{ sessionId: 1, row: 3, seat: 5 }` -> `201`
6. **Joylar xaritasini tekshirish:**
   - `GET /sessions/1/seats` -> 3-qator 5-joy `taken: true` bo'lib ko'rinadi.

---

## 🌐 Render'ga Deploy Qilish Qo'llanmasi

1. Ushbu loyihani GitHub repozitoriyingizga push qiling:
   ```bash
   git init
   git add .
   git commit -m "feat: CineBook API to'liq tayyor"
   git branch -M main
   git remote add origin https://github.com/<sizning-username>/cinebook.git
   git push -u origin main
   ```

2. [Render.com](https://render.com) saytiga kiring:
   - **New +** -> **Web Service** ni tanlang.
   - GitHub repozitoriyingizni ulang.

3. Sozlamalar:
   - **Name:** `cinebook-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (yoki `node src/index.js`)

4. **Environment Variables** bo'limida quyidagilarni kiriting:
   - `PORT` = `10000` (yoki Render avtomatik belgilaydi)
   - `JWT_SECRET` = `renderda_ixtiyoriy_maxfiy_uzun_kalit_soz_123`

5. **Deploy Web Service** tugmasini bosing.
   Deploy tugagach, berilgan havola orqali oching:
   `https://cinebook-api-xxxx.onrender.com/api-docs`
