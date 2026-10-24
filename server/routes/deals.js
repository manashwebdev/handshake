const router = require("express").Router();
const mongoose = require("mongoose");
const Deal = require("../models/Deal");
const { EMAIL, FREE_LIMIT } = require("../config");
const { auth, need } = require("../middleware/auth");
const { ah, dealOut } = require("../utils");

// Authorization: each side only sees and moves its own deals.
router.get("/deals", auth, ah(async (req, res) => {
  const filter = req.user.role === "client" ? { clientEmail: req.user.email } : { owner: req.user._id };
  const deals = await Deal.find(filter).sort({ createdAt: -1 }).limit(500).populate("owner", "name").lean();
  res.json({ deals: deals.map(d => ({ ...dealOut(d), owner: d.owner && { name: d.owner.name } })) });
}));

router.post("/deals", auth, need("freelancer"), ah(async (req, res) => {
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

router.post("/deals/:id/approve", ...move("sent", "approved", "approvedAt"));
// TODO(payments): "pay" is simulated. Replace with Razorpay: create an order, then mark paid only
// from a verified webhook (payment.captured), never from a client request.
router.post("/deals/:id/pay", ...move("approved", "paid", "paidAt"));

module.exports = router;
