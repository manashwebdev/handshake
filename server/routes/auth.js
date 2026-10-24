const router = require("express").Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { EMAIL } = require("../config");
const { auth } = require("../middleware/auth");
const { ah, pub, cookieOpts, sign, DUMMY } = require("../utils");

const lim = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.post("/auth/signup", lim, ah(async (req, res) => {
  const b = req.body || {}, name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (!name || name.length > 80) return res.status(400).json({ error: "Enter your name." });
  if (!EMAIL.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
  if (pw.length < 8 || pw.length > 72) return res.status(400).json({ error: "Use 8 to 72 characters for the password." });
  if (!["freelancer", "client"].includes(b.role)) return res.status(400).json({ error: "Choose Freelancer or Client." });
  if (await User.exists({ email })) return res.status(409).json({ error: "That email already has an account. Log in instead." });
  const u = await User.create({ name, email, role: b.role, password: await bcrypt.hash(pw, 12) });
  sign(res, u); res.status(201).json({ user: pub(u) });
}));

router.post("/auth/login", lim, ah(async (req, res) => {
  const b = req.body || {}, u = await User.findOne({ email: String(b.email || "").trim().toLowerCase() });
  const ok = await bcrypt.compare(String(b.password || ""), u ? u.password : DUMMY);
  if (!u || !ok) return res.status(401).json({ error: "Email or password is incorrect." });
  sign(res, u); res.json({ user: pub(u) });
}));

router.post("/auth/logout", (req, res) => { res.clearCookie("hs", cookieOpts); res.json({ ok: true }); });
router.get("/me", auth, (req, res) => res.json({ user: pub(req.user) }));

module.exports = router;
