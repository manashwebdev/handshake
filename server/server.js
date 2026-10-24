const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { MONGODB_URI, PORT, prod } = require("./config");

const app = express();
if (prod) app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["https://fonts.gstatic.com"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"],
  "upgrade-insecure-requests": prod ? [] : null
} } }));
app.use(express.json({ limit: "10kb" }), cookieParser());

/* ---------- API ---------- */
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/deals"));
app.use("/api", require("./routes/billing"));
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

/* ---------- client (static) + errors ---------- */
app.use(express.static(path.join(__dirname, "..", "client")));
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ error: "That email already has an account. Log in instead." });
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") return res.status(400).json({ error: "Bad request." });
  console.error(err); res.status(500).json({ error: "Something went wrong." });
});

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log("Handshake running on http://localhost:" + PORT)))
  .catch(e => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
