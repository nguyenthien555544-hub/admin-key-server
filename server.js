const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// 👉 CHO PHÉP LOAD FILE HTML
app.use(express.static(__dirname));

const KEY_FILE = path.join(__dirname, "keys.json");

// tạo file keys.json nếu chưa có
if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, JSON.stringify([]));
}

// test server
app.get("/", (req, res) => {
  res.send("✅ KEY SERVER ONLINE");
});

// check key
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  const keys = JSON.parse(fs.readFileSync(KEY_FILE));

  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ ok: false, msg: "Key không tồn tại" });

  if (found.device && found.device !== device)
    return res.json({ ok: false, msg: "Key đã gắn máy khác" });

  if (!found.device) {
    found.device = device;
    fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
  }

  res.json({ ok: true, type: found.type });
});

// tạo key
app.post("/create", (req, res) => {
  const { key, type } = req.body;
  const keys = JSON.parse(fs.readFileSync(KEY_FILE));
  keys.push({
    id: Date.now(),
    key,
    type,
    time: new Date().toLocaleString("vi-VN"),
    device: null
  });
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
  res.json({ ok: true });
});

// xóa key
app.post("/delete", (req, res) => {
  const { id } = req.body;
  let keys = JSON.parse(fs.readFileSync(KEY_FILE));
  keys = keys.filter(k => k.id !== id);
  fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
