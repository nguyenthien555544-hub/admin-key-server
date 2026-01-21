const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = "./keys.json";
const GAME_FILE = "./game.json";
const ADMIN_SECRET = "GACON46_SECRET";

/* ===== UTIL ===== */
function load(file, def) {
  if (!fs.existsSync(file)) return def;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ===== LOAD DATA ===== */
let keys = load(KEY_FILE, {});
let game = load(GAME_FILE, { round: 0, result: [], time: 0 });

/* ===== CHECK KEY ===== */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  if (!keys[key]) return res.json({ ok: false, msg: "Key không tồn tại" });

  const k = keys[key];
  if (Date.now() > k.expire) return res.json({ ok: false, msg: "Key hết hạn" });

  if (k.device && k.device !== device)
    return res.json({ ok: false, msg: "Key đã gắn thiết bị khác" });

  if (!k.device) {
    k.device = device;
    save(KEY_FILE, keys);
  }

  res.json({
    ok: true,
    type: k.type,
    expire: k.expire
  });
});

/* ===== ADMIN CREATE KEY ===== */
app.post("/admin/create", (req, res) => {
  if (req.headers["x-secret"] !== ADMIN_SECRET)
    return res.status(403).json({ ok: false });

  const { key, type, days } = req.body;
  if (!key || !days) return res.json({ ok: false });

  keys[key] = {
    type: type || "FREE",
    expire: Date.now() + days * 86400000,
    device: null
  };
  save(KEY_FILE, keys);
  res.json({ ok: true });
});

/* ===== GAME API ===== */
app.post("/game/update", (req, res) => {
  if (req.headers["x-secret"] !== ADMIN_SECRET)
    return res.status(403).json({ ok: false });

  const { round, result } = req.body;
  if (!round || !Array.isArray(result))
    return res.json({ ok: false });

  game = { round, result, time: Date.now() };
  save(GAME_FILE, game);
  res.json({ ok: true });
});

app.get("/game", (req, res) => {
  res.json(game);
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("SERVER RUN", PORT));
