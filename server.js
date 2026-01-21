const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = "./keys.json";

/* ================= UTIL ================= */
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEY_FILE));
}
function saveKeys(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ================= CREATE KEY ================= */
app.post("/create-key", (req, res) => {
  const { key, type, days, device } = req.body;
  if (!device) return res.json({ ok: false, msg: "Thiếu Device ID" });

  const keys = loadKeys();
  const newKey = key || "KEY-" + Math.random().toString(36).slice(2, 10);
  const expire = Date.now() + (Number(days || 1) * 86400000);

  keys.push({
    key: newKey,
    type: type || "FREE",
    device,
    expire,
    created: Date.now()
  });

  saveKeys(keys);
  res.json({ ok: true, key: newKey, expire });
});

/* ================= CHECK KEY (BOT) ================= */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  if (!key || !device) {
    return res.json({ ok: false, msg: "Thiếu key hoặc device" });
  }

  const keys = loadKeys();
  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ ok: false, msg: "Key không tồn tại" });

  if (found.device !== device) {
    return res.json({ ok: false, msg: "Sai Device ID" });
  }

  if (Date.now() > found.expire) {
    return res.json({ ok: false, msg: "Key đã hết hạn" });
  }

  res.json({
    ok: true,
    type: found.type,
    expire: found.expire
  });
});

/* ================= ADMIN: LIST KEY ================= */
app.get("/admin/keys", (req, res) => {
  res.json(loadKeys());
});

/* ================= ADMIN: DELETE KEY ================= */
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  let keys = loadKeys();
  const before = keys.length;
  keys = keys.filter(k => k.key !== key);
  saveKeys(keys);

  res.json({
    ok: before !== keys.length
  });
});

/* ================= ADMIN: EXTEND KEY ================= */
app.post("/admin/extend", (req, res) => {
  const { key, days } = req.body;
  const keys = loadKeys();
  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ ok: false });

  found.expire += Number(days) * 86400000;
  saveKeys(keys);
  res.json({ ok: true, expire: found.expire });
});

/* ================= API TRUNG GIAN (BOT / GAME) ================= */
app.post("/api/game", (req, res) => {
  const { key, device, action } = req.body;

  const keys = loadKeys();
  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ ok: false });

  if (found.device !== device) return res.json({ ok: false });
  if (Date.now() > found.expire) return res.json({ ok: false });

  // xử lý logic game / bot ở đây
  res.json({
    ok: true,
    action,
    vip: found.type === "VIP"
  });
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("ADMIN KEY SERVER OK");
});

/* ================= LISTEN (RENDER) ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
