const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const KEY_FILE = path.join(__dirname, "keys.json");

// tạo file keys.json nếu chưa có
if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, "[]");
}

// trang chủ test
app.get("/", (req, res) => {
  res.send("KEY SERVER ONLINE");
});

// kiểm tra key (bot gọi)
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  const keys = JSON.parse(fs.readFileSync(KEY_FILE));

  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ ok: false });

  // khóa theo thiết bị
  if (found.device && found.device !== device) {
    return res.json({ ok: false });
  }

  if (!found.device) {
    found.device = device;
    fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
  }

  res.json({ ok: true, type: found.type });
});

// tạo key
app.post("/create", (req, res) => {
  const { key, type } = req.body;
  if (!key || !type) return res.json({ ok: false });

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

// admin panel
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
