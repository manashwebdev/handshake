require("dotenv").config();
const path = require("path"), express = require("express"), mongoose = require("mongoose"),
  bcrypt = require("bcryptjs"), jwt = require("jsonwebtoken"), helmet = require("helmet"),
  rateLimit = require("express-rate-limit"), cookieParser = require("cookie-parser");

const { MONGODB_URI, JWT_SECRET, PORT = 3000, NODE_ENV, DEMO_BILLING } = process.env;
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Set MONGODB_URI and a JWT_SECRET of 32+ characters in .env");
  process.exit(1);
}
const prod = NODE_ENV === "production", FREE_LIMIT = 3, EMAIL = /^\S+@\S+\.\S+$/;

/* ---------- models ---------- */
const User = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true },
  role: { type: String, enum: ["freelancer", "client"], required: true },
  plan: { type: String, enum: ["free", "pro"], default: "free" }
}, { timestamps: true }));

const Deal = mongoose.model("Deal", new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  clientName: { type: String, required: true, trim: true, maxlength: 80 },
  clientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  total: { type: Number, required: true, min: 1, max: 1e8 },
  deposit: { type: Number, enum: [30, 50, 100], default: 50 },
  status: { type: String, enum: ["sent", "approved", "paid"], default: "sent" },
  approvedAt: Date, paidAt: Date
}, { timestamps: true }));

/* ---------- helpers ---------- */
const ah = f => (req, res, next) => f(req, res, next).catch(next);
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan, limit: u.plan === "pro" ? null : FREE_LIMIT });
const cookieOpts = { httpOnly: true, sameSite: "lax", secure: prod };
const sign = (res, u) => res.cookie("hs", jwt.sign({ sub: u.id }, JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" }), { ...cookieOpts, maxAge: 7 * 864e5 });
const DUMMY = bcrypt.hashSync("not-a-real-password", 12);
const dealOut = d => { const o = d.toObject ? d.toObject() : d; delete o.__v; return { ...o, id: String(o._id) }; };

const auth = ah(async (req, res, next) => {
  try {
    const { sub } = jwt.verify(req.cookies.hs || "", JWT_SECRET, { algorithms: ["HS256"] });
    req.user = await User.findById(sub);
  } catch (e) { /* invalid or missing token */ }
  if (!req.user) return res.status(401).json({ error: "Please log in." });
  next();
});
const need = role => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: "Not allowed for your account type." });

/* ---------- app ---------- */
const app = express();
if (prod) app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["https://fonts.gstatic.com"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"],
  "upgrade-insecure-requests": prod ? [] : null
} } }));
app.use(express.json({ limit: "10kb" }), cookieParser());
const lim = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

/* ---------- auth ---------- */
app.post("/api/auth/signup", lim, ah(async (req, res) => {
  const b = req.body || {}, name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (!name || name.length > 80) return res.status(400).json({ error: "Enter your name." });
  if (!EMAIL.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
  if (pw.length < 8 || pw.length > 72) return res.status(400).json({ error: "Use 8 to 72 characters for the password." });
  if (!["freelancer", "client"].includes(b.role)) return res.status(400).json({ error: "Choose Freelancer or Client." });
  if (await User.exists({ email })) return res.status(409).json({ error: "That email already has an account. Log in instead." });
  const u = await User.create({ name, email, role: b.role, password: await bcrypt.hash(pw, 12) });
  sign(res, u); res.status(201).json({ user: pub(u) });
}));

app.post("/api/auth/login", lim, ah(async (req, res) => {
  const b = req.body || {}, u = await User.findOne({ email: String(b.email || "").trim().toLowerCase() });
  const ok = await bcrypt.compare(String(b.password || ""), u ? u.password : DUMMY);
  if (!u || !ok) return res.status(401).json({ error: "Email or password is incorrect." });
  sign(res, u); res.json({ user: pub(u) });
}));

app.post("/api/auth/logout", (req, res) => { res.clearCookie("hs", cookieOpts); res.json({ ok: true }); });
app.get("/api/me", auth, (req, res) => res.json({ user: pub(req.user) }));

/* ---------- deals (authorization: each side only sees and moves its own) ---------- */
app.get("/api/deals", auth, ah(async (req, res) => {
  const filter = req.user.role === "client" ? { clientEmail: req.user.email } : { owner: req.user._id };
  const deals = await Deal.find(filter).sort({ createdAt: -1 }).limit(500).populate("owner", "name").lean();
  res.json({ deals: deals.map(d => ({ ...dealOut(d), owner: d.owner && { name: d.owner.name } })) });
}));

app.post("/api/deals", auth, need("freelancer"), ah(async (req, res) => {
  const b = req.body || {}, title = String(b.title || "").trim(), clientName = String(b.clientName || "").trim(),
    clientEmail = String(b.clientEmail || "").trim().toLowerCase(), total = Math.round(Number(b.total)), deposit = Number(b.deposit);
  if (!title || title.length > 120 || !clientName || clientName.length > 80 || !EMAIL.test(clientEmail) ||
      !(total > 0 && total <= 1e8) || ![30, 50, 100].includes(deposit))
    return res.status(400).json({ error: "Fill in every field with a valid email and amount." });
  if (req.user.plan === "free" && await Deal.countDocuments({ owner: req.user._id, status: { $ne: "paid" } }) >= FREE_LIMIT)
    return res.status(402).json({ error: `The Free plan allows ${FREE_LIMIT} active proposals. Upgrade to Pro for unlimited.`, upgrade: true });
  const d = await Deal.create({ title, clientName, clientEmail, owner: req.user._id, total, deposit });
  res.status(201).json({ deal: dealOut(d) });
}));

// Only the addressed client can move a deal, one step at a time (atomic check on status).
const move = (from, to, stamp) => [auth, need("client"), ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Proposal not found." });
  const d = await Deal.findOneAndUpdate(
    { _id: req.params.id, clientEmail: req.user.email, status: from },
    { status: to, [stamp]: new Date() }, { new: true });
  if (!d) return res.status(409).json({ error: "This proposal can't move to that step." });
  res.json({ deal: dealOut(d) });
})];
app.post("/api/deals/:id/approve", ...move("sent", "approved", "approvedAt"));
// TODO(payments): "pay" is simulated. Replace with Razorpay: create an order, then mark paid only
// from a verified webhook (payment.captured), never from a client request.
app.post("/api/deals/:id/pay", ...move("approved", "paid", "paidAt"));

/* ---------- billing ---------- */
// TODO(billing): replace with Razorpay Subscriptions + webhook. This demo route grants Pro for free,
// so it only works when DEMO_BILLING=true.
app.post("/api/billing/upgrade", auth, need("freelancer"), ah(async (req, res) => {
  if (DEMO_BILLING !== "true") return res.status(501).json({ error: "Billing isn't connected yet." });
  req.user.plan = "pro"; await req.user.save();
  res.json({ user: pub(req.user) });
}));

/* ---------- static + errors ---------- */
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));
app.use(express.static(path.join(__dirname, "public")));
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ error: "That email already has an account. Log in instead." });
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") return res.status(400).json({ error: "Bad request." });
  console.error(err); res.status(500).json({ error: "Something went wrong." });
});

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log("Handshake running on http://localhost:" + PORT)))
  .catch(e => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
