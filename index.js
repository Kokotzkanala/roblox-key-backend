const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// Store keys in memory
let keys = {};

// Generate a new 24-hour key
app.get("/generate", (req, res) => {
  const key = uuidv4(); // Unique key
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  keys[key] = expiry;
  res.json({ key, expiresAt: expiry });
});

// Validate a key
app.get("/validate/:key", (req, res) => {
  const key = req.params.key;
  if (keys[key] && Date.now() < keys[key]) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// Optional: cleanup expired keys every hour
setInterval(() => {
  const now = Date.now();
  for (const key in keys) {
    if (keys[key] < now) delete keys[key];
  }
}, 60 * 60 * 1000);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
