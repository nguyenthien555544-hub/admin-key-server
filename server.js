const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const KEY_FILE = "./keys.json";

/* ================= UTILS ================= */
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}
function saveKeys(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ================= TEST API ================= */
app.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "SERVER ALIVE" });
});

/* ================= CREATE KEY ================= */
app.post("/create-key", (req, res) => {
  try {
    const { key, type, days, device } = req.body;

    if (!device) {
      return res.json({ ok: false, msg: "Thiếu Device ID" });
    }

    const keys = loadKeys();

    const newKey = key && key.length > 3
      ? key
      : "KEY-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    if (keys.find(k => k.key === newKey)) {
      return res.json({ ok: false, msg: "Key đã tồn tại" });
    }

    const expire = Date.now() + Number(days || 1) * 86400000;

    keys.push({
      key: newKey,
      type: type || "FREE",
      device,
      expire
    });

    saveKeys(keys);

    res.json({
      ok: true,
      key: newKey,
      type: type || "FREE",
      expire
    });
  } catch (e) {
    res.json({ ok: false, msg: "Lỗi server" });
  }
});

/* ================= CHECK KEY ================= */
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
    return res.json({
      ok: false,
      msg: "Key gắn cứng Device ID khác"
    });
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

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("ADMIN KEY SERVER OK");
});

/* ================= LISTEN ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
