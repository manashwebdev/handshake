const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config");
const { ah } = require("../utils");

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

module.exports = { auth, need };
