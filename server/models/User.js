const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true },
  role: { type: String, enum: ["freelancer", "client"], required: true },
  plan: { type: String, enum: ["free", "pro"], default: "free" }
}, { timestamps: true }));
