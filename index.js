const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs-extra");

const app = express();
app.use(cors());
app.use(express.json());

const KEYS_FILE = "keys.json";

// Load keys from file
let data = { keys: {}, ips: {} };
if (fs.existsSync(KEYS_FILE)) {
  data = fs.readJsonSync(KEYS_FILE);
}

// Save data to file
function saveData() {
  fs.writeJsonSync(KEYS_FILE, data);
}

// Helper: reset IP count at midnight
function resetIPCounts() {
  const today = new Date().toDateString();
  for (const ip in data.ips) {
    if (data.ips[ip].lastDate !== today) {
      data.ips[ip].count = 0;
      data.ips[ip].lastDate = today;
    }
  }
}

// Generate a new 3-hour key
app.get("/generate", (req, res) => {
  resetIPCounts();

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  if (!data.ips[ip]) {
    data.ips[ip] = { count: 0, lastDate: new Date().toDateString() };
  }

  if (data.ips[ip].count >= 2) {
    return res.status(429).json({ error: "IP has reached the daily key limit (2 keys per day)." });
  }

  const key = uuidv4();
  const expiry = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

  data.keys[key] = expiry;
  data.ips[ip].count += 1;

  saveData();

  res.json({ key, expiresAt: expiry });
});

// Validate a key
app.get("/validate/:key", (req, res) => {
  const key = req.params.key;
  if (data.keys[key] && Date.now() < data.keys[key]) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// Cleanup expired keys every hour
setInterval(() => {
  const now = Date.now();
  for (const key in data.keys) {
    if (data.keys[key] < now) delete data.keys[key];
  }
  saveData();
}, 60 * 60 * 1000);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
