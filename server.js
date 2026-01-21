const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 3000;
const KEY_FILE = "./keys.json";
const ADMIN_KEY = "ADMIN-123456"; // 🔴 đổi key admin tại đây

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
 const k = req.headers["x-admin-key"];
 if (k !== ADMIN_KEY) {
  return res.json({ ok: false, msg: "No permission" });
 }
 next();
}

/* ================= ADMIN CREATE KEY ================= */
app.post("/admin/create-key", checkAdmin, (req, res) => {
 const { device, type, days } = req.body;
 if (!device) return res.json({ ok: false, msg: "Thiếu Device ID" });

 const keys = loadKeys();
 const key = "KEY-" + Math.random().toString(36).slice(2, 10);

 let expire = 0;
 if (Number(days) > 0) {
  expire = Date.now() + Number(days) * 86400000;
 }

 keys.push({
  key,
  device,
  type: type || "FREE",
  expire
 });

 saveKeys(keys);
 res.json({ ok: true, key, expire });
});

/* ================= ADMIN LIST ================= */
app.get("/admin/list", checkAdmin, (req, res) => {
 res.json(loadKeys());
});

/* ================= ADMIN DELETE ================= */
app.get("/admin/delete/:key", checkAdmin, (req, res) => {
 let keys = loadKeys();
 keys = keys.filter(k => k.key !== req.params.key);
 saveKeys(keys);
 res.json({ ok: true });
});

/* ================= BOT CHECK API ================= */
app.post("/check", (req, res) => {
 const { key, device } = req.body;
 if (!key || !device) {
  return res.json({ ok: false, msg: "Thiếu dữ liệu" });
 }

 const keys = loadKeys();
 const found = keys.find(k => k.key === key);

 if (!found) return res.json({ ok: false, msg: "Key sai" });
 if (found.device !== device) return res.json({ ok: false, msg: "Sai device" });
 if (found.expire !== 0 && Date.now() > found.expire)
  return res.json({ ok: false, msg: "Key hết hạn" });

 res.json({
  ok: true,
  type: found.type,
  expire: found.expire
 });
});

/* ================= ADMIN PANEL ================= */
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "public/admin.html"));
});

/* ================= START ================= */
app.listen(PORT, () => {
 console.log("SERVER RUNNING PORT " + PORT);
});
