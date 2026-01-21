const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const KEY_FILE = "./keys.json";

/* ================= LOAD / SAVE ================= */
function loadKeys() {
  if (!fs.existsSync(KEY_FILE)) return {};
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}
function saveKeys(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

let keys = loadKeys();

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("✅ ADMIN KEY SERVER RUNNING");
});

/* ================= CREATE KEY (ADMIN) =================
BODY:
{
  "key": "ABC123",        // optional
  "type": "FREE" | "VIP",
  "days": 7,
  "device": "DEV-xxxx"
}
*/
app.post("/create", (req, res) => {
  const { key, type, days, device } = req.body;

  if (!type || !days || !device) {
    return res.json({ ok: false, msg: "Thiếu dữ liệu" });
  }

  const k =
    key ||
    "KEY-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  keys[k] = {
    type,
    device,
    expire: Date.now() + days * 86400000,
    created: Date.now()
  };

  saveKeys(keys);

  res.json({
    ok: true,
    key: k,
    type,
    device,
    expire: keys[k].expire
  });
});

/* ================= CHECK KEY (BOT) =================
BODY:
{
  "key": "ABC123",
  "device": "DEV-xxxx"
}
*/
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  const k = keys[key];

  if (!k) {
    return res.json({ ok: false, msg: "Key không tồn tại" });
  }

  if (Date.now() > k.expire) {
    return res.json({ ok: false, msg: "Key đã hết hạn" });
  }

  if (k.device !== device) {
    return res.json({ ok: false, msg: "Key không đúng thiết bị" });
  }

  res.json({
    ok: true,
    type: k.type,
    expire: k.expire
  });
});

/* ================= LIST KEYS (ADMIN) ================= */
app.get("/keys", (req, res) => {
  res.json(keys);
});

/* ================= DELETE KEY (ADMIN) ================= */
app.post("/delete", (req, res) => {
  const { key } = req.body;
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
