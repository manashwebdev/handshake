const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET, FREE_LIMIT, prod } = require("./config");

const ah = f => (req, res, next) => f(req, res, next).catch(next);
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan, limit: u.plan === "pro" ? null : FREE_LIMIT });
const cookieOpts = { httpOnly: true, sameSite: "lax", secure: prod };
const sign = (res, u) => res.cookie("hs", jwt.sign({ sub: u.id }, JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" }), { ...cookieOpts, maxAge: 7 * 864e5 });
const DUMMY = bcrypt.hashSync("not-a-real-password", 12);
const dealOut = d => { const o = d.toObject ? d.toObject() : d; delete o.__v; return { ...o, id: String(o._id) }; };

module.exports = { ah, pub, cookieOpts, sign, DUMMY, dealOut };
