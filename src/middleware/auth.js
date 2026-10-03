const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Token talab qilinadi" });
  }

  const token = match[1].trim();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, role: payload.role || "user" };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token yaroqsiz yoki muddati tugagan" });
  }
};
