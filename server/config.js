require("dotenv").config();

const { MONGODB_URI, JWT_SECRET, PORT = 3000, NODE_ENV, DEMO_BILLING } = process.env;

if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Set MONGODB_URI and a JWT_SECRET of 32+ characters in .env");
  process.exit(1);
}

module.exports = {
  MONGODB_URI, JWT_SECRET, PORT, DEMO_BILLING,
  prod: NODE_ENV === "production",
  FREE_LIMIT: 3,
  EMAIL: /^\S+@\S+\.\S+$/
};
