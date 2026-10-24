const router = require("express").Router();
const { DEMO_BILLING } = require("../config");
const { auth, need } = require("../middleware/auth");
const { ah, pub } = require("../utils");

// TODO(billing): replace with Razorpay Subscriptions + webhook. This demo route grants Pro for free,
// so it only works when DEMO_BILLING=true.
router.post("/billing/upgrade", auth, need("freelancer"), ah(async (req, res) => {
  if (DEMO_BILLING !== "true") return res.status(501).json({ error: "Billing isn't connected yet." });
  req.user.plan = "pro"; await req.user.save();
  res.json({ user: pub(req.user) });
}));

module.exports = router;
