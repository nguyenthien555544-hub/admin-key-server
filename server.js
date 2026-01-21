const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 3000;
const KEY_FILE = "./keys.json";
const ADMIN_KEY = "ADMIN-123456"; // 🔴 ĐỔI KEY NÀY THEO Ý BẠN

/* ================= UTILS ================= */
function loadKeys() {
 if (!fs.existsSync(KEY_FILE)) return [];
 return JSON.parse(fs.readFileSync(KEY_FILE));
}

function saveKeys(data) {
 fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ================= ADMIN AUTH ================= */
function checkAdmin(req, res, next) {
 const adminKey = req.headers["x-admin-key"];
 if (adminKey !== ADMIN_KEY) {
  return res.json({ ok: false, msg: "No permission" });
 }
 next();
}

/* ================= ADMIN CREATE KEY ================= */
app.post("/admin/create-key", checkAdmin, (req, res) => {
 const { key, type, days, device } = req.body;
 if (!device) return res.json({ ok: false, msg: "Thiếu Device ID" });

 const keys = loadKeys();
 const newKey = key || "KEY-" + Math.random().toString(36).slice(2, 10);

 let expire = 0;
 if (Number(days) > 0) {
  expire = Date.now() + Number(days) * 86400000;
 }

 keys.push({
  key: newKey,
  type: type || "FREE",
  device,
  expire
 });

 saveKeys(keys);
 res.json({ ok: true, key: newKey, expire });
});

/* ================= ADMIN LIST KEYS ================= */
app.get("/admin/list", checkAdmin, (req, res) => {
 res.json(loadKeys());
});

/* ================= ADMIN DELETE KEY ================= */
app.get("/admin/delete/:key", checkAdmin, (req, res) => {
 let keys = loadKeys();
 keys = keys.filter(k => k.key !== req.params.key);
 saveKeys(keys);
 res.json({ ok: true });
});

/* ================= BOT CHECK KEY ================= */
app.post("/check", (req, res) => {
 const { key, device } = req.body;
 if (!key || !device) {
  return res.json({ ok: false, msg: "Thiếu key hoặc device" });
 }

 const keys = loadKeys();
 const found = keys.find(k => k.key === key);

 if (!found) {
  return res.json({ ok: false, msg: "Key không tồn tại" });
 }

 if (found.device !== device) {
  return res.json({ ok: false, msg: "Sai Device ID" });
 }

 if (found.expire !== 0 && Date.now() > found.expire) {
  return res.json({ ok: false, msg: "Key đã hết hạn" });
 }

 res.json({
  ok: true,
  type: found.type,
  expire: found.expire
 });
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
 res.send("ADMIN + BOT KEY SERVER OK");
});

/* ================= START ================= */
app.listen(PORT, () => {
 console.log("Server running on port " + PORT);
});
