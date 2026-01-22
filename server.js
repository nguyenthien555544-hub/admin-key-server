const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ====== DÙNG DISK RENDER ====== */
const DATA_DIR = "/data";
const KEY_FILE = DATA_DIR + "/keys.json";

/* ====== INIT ====== */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, "{}");

/* ====== LOAD / SAVE ====== */
function loadKeys() {
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}
function saveKeys(keys) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
}

/* ====== ROOT ====== */
app.get("/", (req, res) => {
  res.send("✅ ADMIN KEY SERVER RUNNING");
});

/* ====== CREATE KEY (ADMIN) ====== */
app.post("/create", (req, res) => {
  const { key, type, days, device } = req.body;

  if (!type || device == null || days == null) {
    return res.json({ ok: false, msg: "Thiếu dữ liệu" });
  }

  const keys = loadKeys();

  const newKey =
    key ||
    "KEY-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  if (keys[newKey]) {
    return res.json({ ok: false, msg: "Key đã tồn tại" });
  }

  const expire =
    days == 0 ? 0 : Date.now() + days * 86400000;

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

/* ====== CHECK KEY (BOT) ====== */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  const keys = loadKeys();
  const k = keys[key];

  if (!k) return res.json({ ok: false, msg: "Key không tồn tại" });

  if (k.expire !== 0 && Date.now() > k.expire) {
    return res.json({ ok: false, msg: "Key hết hạn" });
  }

  if (k.device !== device) {
    return res.json({ ok: false, msg: "Sai thiết bị" });
  }

  res.json({
    ok: true,
    type: k.type,
    expire: k.expire
  });
});

/* ====== LIST KEYS (ADMIN) ====== */
app.get("/keys", (req, res) => {
  res.json(loadKeys());
});

/* ====== DELETE KEY ====== */
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

/* ====== START ====== */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
