const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

/* ================= MIDDLEWARE (RẤT QUAN TRỌNG) ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= CONFIG ================= */
const KEY_FILE = "./keys.json";
const ADMIN_TOKEN = "ADMIN_123"; // đổi lại cho riêng bạn

/* ================= UTILS ================= */
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}
function saveKeys(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}
function genKey() {
  return "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}
function authAdmin(req, res, next) {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    return res.status(403).json({ ok: false, msg: "No permission" });
  }
  next();
}

/* ================= CHECK KEY (BOT / WEB) ================= */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  if (!key || !device)
    return res.json({ ok: false, msg: "Thiếu key hoặc device" });

  const keys = loadKeys();
  const found = keys.find(k => k.key === key);

  if (!found) return res.json({ ok: false, msg: "Key không tồn tại" });
  if (found.device !== device)
    return res.json({ ok: false, msg: "Sai Device ID" });
  if (Date.now() > found.expire)
    return res.json({ ok: false, msg: "Key hết hạn" });

  res.json({
    ok: true,
    type: found.type,
    expire: found.expire
  });
});

/* ================= ADMIN – CREATE KEY ================= */
app.post("/admin/create-key", authAdmin, (req, res) => {
  const { type, days, device, key } = req.body;
  if (!device)
    return res.json({ ok: false, msg: "Thiếu Device ID" });

  const keys = loadKeys();
  const newKey = key || genKey();

  keys.push({
    key: newKey,
    type: type || "FREE",
    device,
    expire: Date.now() + (Number(days || 1) * 86400000)
  });

  saveKeys(keys);
  res.json({ ok: true, key: newKey });
});

/* ================= ADMIN – LIST KEY ================= */
app.get("/admin/keys", authAdmin, (req, res) => {
  res.json(loadKeys());
});

/* ================= ADMIN – DELETE KEY ================= */
app.post("/admin/delete-key", authAdmin, (req, res) => {
  const { key } = req.body;
  let keys = loadKeys();
  const before = keys.length;
  keys = keys.filter(k => k.key !== key);

  if (keys.length === before)
    return res.json({ ok: false, msg: "Không tìm thấy key" });

  saveKeys(keys);
  res.json({ ok: true });
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("KEY SERVER OK");
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
