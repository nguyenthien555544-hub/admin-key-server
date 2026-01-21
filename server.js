const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIG ================= */
const KEY_FILE = "./keys.json";

/* ================= UTILS ================= */
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}

function saveKeys(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("✅ ADMIN KEY SERVER RUNNING");
});

/* =================================================
   🔑 BOT CHECK KEY
================================================= */
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

  if (found.locked) {
    return res.json({ ok: false, msg: "Key đã bị khóa" });
  }

  if (found.device !== device) {
    return res.json({ ok: false, msg: "Key gắn với thiết bị khác" });
  }

  if (Date.now() > found.expire) {
    return res.json({ ok: false, msg: "Key đã hết hạn" });
  }

  return res.json({
    ok: true,
    type: found.type,
    expire: found.expire
  });
});

/* =================================================
   🔐 ADMIN – TẠO KEY
================================================= */
app.post("/admin/create-key", (req, res) => {
  const { type, days, device, key } = req.body;

  if (!device) {
    return res.json({ ok: false, msg: "Thiếu Device ID" });
  }

  const keys = loadKeys();

  const newKey = key || "KEY-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  const expire = Date.now() + (Number(days || 1) * 86400000);

  keys.push({
    key: newKey,
    type: type || "FREE",
    device,
    expire,
    locked: false,
    created: Date.now()
  });

  saveKeys(keys);

  res.json({
    ok: true,
    key: newKey,
    expire
  });
});

/* =================================================
   📋 ADMIN – LIST KEY
================================================= */
app.get("/admin/keys", (req, res) => {
  const keys = loadKeys();
  res.json(keys);
});

/* =================================================
   ❌ ADMIN – DELETE KEY
================================================= */
app.post("/admin/delete-key", (req, res) => {
  const { key } = req.body;
  let keys = loadKeys();

  const before = keys.length;
  keys = keys.filter(k => k.key !== key);

  if (keys.length === before) {
    return res.json({ ok: false, msg: "Không tìm thấy key" });
  }

  saveKeys(keys);
  res.json({ ok: true });
});

/* =================================================
   🔒 ADMIN – LOCK / UNLOCK KEY
================================================= */
app.post("/admin/lock-key", (req, res) => {
  const { key, lock } = req.body;
  const keys = loadKeys();
  const found = keys.find(k => k.key === key);

  if (!found) {
    return res.json({ ok: false, msg: "Không tìm thấy key" });
  }

  found.locked = !!lock;
  saveKeys(keys);

  res.json({ ok: true, locked: found.locked });
});

/* =================================================
   🎮 GAME API TRUNG GIAN (MOCK – SAU GẮN THẬT)
================================================= */
app.post("/game/fetch", (req, res) => {
  // MOCK DATA – sau này thay bằng API game thật
  res.json({
    ok: true,
    rooms: {
      "ANTOÀN": Math.random(),
      "MAY MẮN": Math.random(),
      "TỬ THẦN": Math.random(),
      "BÍ ẨN": Math.random(),
      "MẠO HIỂM": Math.random()
    },
    time: Date.now()
  });
});

/* ================= LISTEN ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
