const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = "./keys.json";

/* ===== UTILS ===== */
function loadKeys(){
  if(!fs.existsSync(KEY_FILE)){
    fs.writeFileSync(KEY_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}

function saveKeys(data){
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ===== CHECK KEY (BOT GỌI) ===== */
app.post("/check", (req,res)=>{
  const { key, device } = req.body;
  if(!key || !device){
    return res.json({ ok:false, msg:"Thiếu dữ liệu" });
  }

  const keys = loadKeys();
  const info = keys[key];

  if(!info){
    return res.json({ ok:false, msg:"Key không tồn tại" });
  }

  if(info.device && info.device !== device){
    return res.json({ ok:false, msg:"Key đã dùng máy khác" });
  }

  if(!info.device){
    info.device = device;
    saveKeys(keys);
  }

  res.json({ ok:true, type: info.type });
});

/* ===== ADMIN: LẤY DANH SÁCH KEY ===== */
app.get("/admin/keys", (req,res)=>{
  res.json(loadKeys());
});

/* ===== ADMIN: TẠO KEY ===== */
app.post("/admin/create", (req,res)=>{
  const { key, type } = req.body;
  if(!key || !type){
    return res.json({ ok:false, msg:"Thiếu key/type" });
  }

  const keys = loadKeys();
  if(keys[key]){
    return res.json({ ok:false, msg:"Key đã tồn tại" });
  }

  keys[key] = {
    type,
    device: null,
    time: new Date().toLocaleString("vi-VN")
  };

  saveKeys(keys);
  res.json({ ok:true });
});

/* ===== ADMIN: XÓA KEY ===== */
app.post("/admin/delete", (req,res)=>{
  const { key } = req.body;
  const keys = loadKeys();

  if(!keys[key]){
    return res.json({ ok:false, msg:"Key không tồn tại" });
  }

  delete keys[key];
  saveKeys(keys);
  res.json({ ok:true });
});

/* ===== HOME ===== */
app.get("/", (req,res)=>{
  res.send("✅ KEY SERVER RUNNING");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server running", PORT));
