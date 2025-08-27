const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(cors());
app.use(express.json());

// Keys file
const KEYS_FILE = "./keys.json";
let keys = {};

// Load keys from file
if (fs.existsSync(KEYS_FILE)) {
    keys = fs.readJsonSync(KEYS_FILE);
}

// Generate key (3 hours)
app.get("/generate", (req, res) => {
    const key = uuidv4();
    const expiry = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
    keys[key] = expiry;
    fs.writeJsonSync(KEYS_FILE, keys);
    res.json({ key, expiresAt: expiry });
});

// Validate key
app.get("/validate/:key", (req, res) => {
    const key = req.params.key;
    if (keys[key] && Date.now() < keys[key]) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

// Cleanup expired keys every hour
setInterval(() => {
    const now = Date.now();
    for (const key in keys) {
        if (keys[key] < now) delete keys[key];
    }
    fs.writeJsonSync(KEYS_FILE, keys);
}, 60 * 60 * 1000);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
