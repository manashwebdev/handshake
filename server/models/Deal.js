const mongoose = require("mongoose");

module.exports = mongoose.model("Deal", new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  clientName: { type: String, required: true, trim: true, maxlength: 80 },
  clientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  total: { type: Number, required: true, min: 1, max: 1e8 },
  deposit: { type: Number, enum: [30, 50, 100], default: 50 },
  status: { type: String, enum: ["sent", "approved", "paid"], default: "sent" },
  approvedAt: Date, paidAt: Date
}, { timestamps: true }));
