const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= FILE PATH ================= */
const KEY_FILE = path.join(__dirname, "keys.json");

/* ================= INIT FILE ================= */
if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, JSON.stringify({}, null, 2));
}

/* ================= LOAD / SAVE ================= */
function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveKeys(keys) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
}

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("✅ ADMIN KEY SERVER RUNNING");
});

/* ================= CREATE KEY ================= */
app.post("/create", (req, res) => {
  const { key, type, days, device } = req.body;

  if (!type || !device) {
    return res.json({ ok: false, msg: "Thiếu type hoặc device" });
  }

  const keys = loadKeys();

  const newKey =
    key && key.length > 0
      ? key
      : "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  if (keys[newKey]) {
    return res.json({ ok: false, msg: "Key đã tồn tại" });
  }

  const expire =
    days === 0
      ? 0
      : Date.now() + Number(days) * 86400000;

  keys[newKey] = {
    type,
    device,
    expire,
    created: Date.now()
  };

  saveKeys(keys);

  res.json({
    ok: true,
    key: newKey,
    type,
    device,
    expire
  });
});

/* ================= CHECK KEY (BOT) ================= */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  const keys = loadKeys();
  const data = keys[key];

  if (!data) {
    return res.json({ ok: false, msg: "Key không tồn tại" });
  }

  if (data.device !== device) {
    return res.json({ ok: false, msg: "Sai thiết bị" });
  }

  if (data.expire !== 0 && Date.now() > data.expire) {
    return res.json({ ok: false, msg: "Key hết hạn" });
  }

  res.json({
    ok: true,
    type: data.type,
    expire: data.expire
  });
});

/* ================= LIST KEYS (ADMIN) ================= */
app.get("/keys", (req, res) => {
  res.json(loadKeys());
});

/* ================= DELETE KEY ================= */
app.post("/delete", (req, res) => {
  const { key } = req.body;
  const keys = loadKeys();

  if (!keys[key]) {
    return res.json({ ok: false, msg: "Key không tồn tại" });
  }

  delete keys[key];
  saveKeys(keys);

  res.json({ ok: true });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
