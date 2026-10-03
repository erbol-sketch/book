const err = (description, example) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { error: example },
    },
  },
});

const json = (schema) => ({ "application/json": { schema } });
const secured = [{ bearerAuth: [] }];

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "CineBook API",
    version: "1.0.0",
    description:
      "Kinoteatr joy band qilish REST API backend xizmati. Node.js + Express yordamida yozilgan.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Auth", description: "Autentifikatsiya va foydalanuvchilar" },
    { name: "Movies", description: "Filmlar va seanslar" },
    { name: "Bookings", description: "Joy band qilish va boshqarish" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token kiriting: masalan 'eyJhbGciOiJIUzI1NiIsIn...'",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Ali" },
          email: { type: "string", example: "ali@mail.com" },
          role: { type: "string", example: "user" },
        },
      },
      Movie: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Mad Max: Fury Road" },
          genre: { type: "string", example: "action" },
          duration: { type: "integer", example: 120 },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          movieId: { type: "integer", example: 1 },
          time: { type: "string", example: "2026-10-01T18:00" },
          hall: { type: "string", example: "A" },
          rows: { type: "integer", example: 5 },
          seatsPerRow: { type: "integer", example: 8 },
        },
      },
      MovieDetail: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Mad Max: Fury Road" },
          genre: { type: "string", example: "action" },
          duration: { type: "integer", example: 120 },
          sessions: {
            type: "array",
            items: { $ref: "#/components/schemas/Session" },
          },
        },
      },
      Seat: {
        type: "object",
        properties: {
          row: { type: "integer", example: 1 },
          seat: { type: "integer", example: 1 },
          taken: { type: "boolean", example: false },
        },
      },
      SeatsMap: {
        type: "object",
        properties: {
          sessionId: { type: "integer", example: 1 },
          rows: { type: "integer", example: 5 },
          seatsPerRow: { type: "integer", example: 8 },
          seats: {
            type: "array",
            items: { $ref: "#/components/schemas/Seat" },
          },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          sessionId: { type: "integer", example: 1 },
          row: { type: "integer", example: 3 },
          seat: { type: "integer", example: 5 },
          createdAt: { type: "string", example: "2026-10-01T12:00:00.000Z" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Ro'yxatdan o'tish",
        description: "Yangi foydalanuvchini ro'yxatdan o'tkazish. Parol bcrypt bilan hashlanadi.",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", example: "Ali" },
              email: { type: "string", example: "ali@mail.com" },
              password: { type: "string", example: "123456" },
              role: { type: "string", example: "user", enum: ["user", "admin"] },
            },
          }),
        },
        responses: {
          201: {
            description: "Muvaffaqiyatli ro'yxatdan o'tdi",
            content: json({ $ref: "#/components/schemas/User" }),
          },
          400: err("Maydonlar yetishmayapti", "name, email va password majburiy"),
          409: err("Email band", "Bu email band"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Tizimga kirish (Login)",
        description: "Email va parol orqali JWT token olish (daqiqasiga 5 ta so'rov chegarasi).",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", example: "ali@mail.com" },
              password: { type: "string", example: "123456" },
            },
          }),
        },
        responses: {
          200: {
            description: "Muvaffaqiyatli kirish, JWT token qaytadi",
            content: json({
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            }),
          },
          400: err("Maydonlar yetishmayapti", "email va password majburiy"),
          401: err("Login yoki parol xato", "Login yoki parol xato"),
          429: err("Rate limit oshdi", "Juda ko'p urinish, keyinroq qayta urinib ko'ring"),
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Joriy foydalanuvchi ma'lumotlari",
        description: "Token orqali joriy foydalanuvchini olish (parolsiz qaytadi).",
        security: secured,
        responses: {
          200: {
            description: "Foydalanuvchi ma'lumotlari",
            content: json({ $ref: "#/components/schemas/User" }),
          },
          401: err("Token yo'q yoki yaroqsiz", "Token talab qilinadi"),
        },
      },
    },
    "/movies": {
      get: {
        tags: ["Movies"],
        summary: "Filmlar ro'yxati (filter va pagination bilan)",
        parameters: [
          {
            name: "genre",
            in: "query",
            schema: { type: "string" },
            description: "Janr bo'yicha filter (masalan: action, sci-fi, comedy)",
            example: "action",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Sahifa raqami",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Har bir sahifadagi elementlar soni",
          },
        ],
        responses: {
          200: {
            description: "Filmlar sahifalangan ro'yxati",
            content: json({
              type: "object",
              properties: {
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Movie" },
                },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 2 },
                total: { type: "integer", example: 3 },
                totalPages: { type: "integer", example: 2 },
              },
            }),
          },
          400: err("Noto'g'ri page/limit", "page va limit musbat son bo'lishi kerak"),
        },
      },
      post: {
        tags: ["Movies"],
        summary: "Yangi film qo'shish (Bonus: faqat Admin)",
        description: "Faqat role: 'admin' bo'lgan userlar yangi film qo'shishi mumkin.",
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["title", "genre", "duration"],
            properties: {
              title: { type: "string", example: "Interstellar" },
              genre: { type: "string", example: "sci-fi" },
              duration: { type: "integer", example: 169 },
            },
          }),
        },
        responses: {
          201: {
            description: "Film muvaffaqiyatli qo'shildi",
            content: json({ $ref: "#/components/schemas/Movie" }),
          },
          400: err("Maydonlar noto'g'ri", "title, genre va duration (musbat son) majburiy"),
          401: err("Token yo'q yoki yaroqsiz", "Token talab qilinadi"),
          403: err("Ruxsat berilmagan", "Faqat admin filmlar qo'sha oladi"),
        },
      },
    },
    "/movies/{id}": {
      get: {
        tags: ["Movies"],
        summary: "Film ma'lumoti va uning seanslari",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 1,
          },
        ],
        responses: {
          200: {
            description: "Film va seanslar ma'lumoti",
            content: json({ $ref: "#/components/schemas/MovieDetail" }),
          },
          404: err("Film topilmadi", "Film topilmadi"),
        },
      },
    },
    "/sessions/{id}/seats": {
      get: {
        tags: ["Movies"],
        summary: "Seansdagi joylar xaritasi (taken holatlari bilan)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 1,
          },
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["map"] },
            description: "map — ASCII ko'rinishidagi xarita qaytaradi ([ ][X][ ])",
          },
        ],
        responses: {
          200: {
            description: "Joylar xaritasi yoki ASCII xarita",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SeatsMap" },
              },
              "text/plain": {
                schema: { type: "string", example: "[ ][ ][ ][ ][ ][ ][ ][ ]\n[ ][ ][ ][ ][ ][ ][ ][ ]" },
              },
            },
          },
          404: err("Seans topilmadi", "Seans topilmadi"),
        },
      },
    },
    "/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Joy band qilish",
        description:
          "Seansdagi joyni band qilish. Zal chegarasi, bandlik va bitta userga 4 ta joy limiti tekshiriladi.",
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["sessionId", "row", "seat"],
            properties: {
              sessionId: { type: "integer", example: 1 },
              row: { type: "integer", example: 3 },
              seat: { type: "integer", example: 5 },
            },
          }),
        },
        responses: {
          201: {
            description: "Joy muvaffaqiyatli band qilindi",
            content: json({ $ref: "#/components/schemas/Booking" }),
          },
          400: err(
            "Chegaradan tashqari yoki bitta seansda 4 tadan oshiq",
            "Joy zal chegarasidan tashqarida (qator: 1-5, joy: 1-8)"
          ),
          401: err("Token yo'q yoki yaroqsiz", "Token talab qilinadi"),
          404: err("Seans topilmadi", "Seans topilmadi"),
          409: err("Joy allaqachon band", "Bu joy band"),
        },
      },
    },
    "/bookings/my": {
      get: {
        tags: ["Bookings"],
        summary: "Mening band qilgan joylarim",
        description: "Faqat joriy autentifikatsiyadan o'tgan foydalanuvchining band qilgan joylari ro'yxati.",
        security: secured,
        responses: {
          200: {
            description: "Foydalanuvchining bandlari",
            content: json({
              type: "array",
              items: { $ref: "#/components/schemas/Booking" },
            }),
          },
          401: err("Token yo'q yoki yaroqsiz", "Token talab qilinadi"),
        },
      },
    },
    "/bookings/{id}": {
      delete: {
        tags: ["Bookings"],
        summary: "Bandni bekor qilish",
        description:
          "Band qilingan joyni bekor qilish. Faqat ushbu bandni qilgan foydalanuvchi bekor qila oladi.",
        security: secured,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 1,
          },
        ],
        responses: {
          204: { description: "Band muvaffaqiyatli bekor qilindi" },
          401: err("Token yo'q yoki yaroqsiz", "Token talab qilinadi"),
          403: err("Birovning bandi", "Bu band sizniki emas"),
          404: err("Band topilmadi", "Band topilmadi"),
        },
      },
    },
  },
};
