const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = "./keys.json";

/* ================= LOAD KEY ================= */
function loadKeys(){
  if(!fs.existsSync(KEY_FILE)){
    fs.writeFileSync(KEY_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
}

function saveKeys(data){
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2));
}

/* ================= CHECK KEY API ================= */
app.post("/check", (req, res) => {
  const { key, device } = req.body;
  if(!key || !device){
    return res.json({ ok:false, msg:"Thiếu dữ liệu" });
  }

  const keys = loadKeys();
  const info = keys[key];

  if(!info){
    return res.json({ ok:false, msg:"Key không tồn tại" });
  }

  // khóa 1 key = 1 máy
  if(info.device && info.device !== device){
    return res.json({ ok:false, msg:"Key đã dùng trên máy khác" });
  }

  // gán máy lần đầu
  if(!info.device){
    info.device = device;
    keys[key] = info;
    saveKeys(keys);
  }

  return res.json({
    ok: true,
    type: info.type
  });
});

/* ================= HOME ================= */
app.get("/", (req,res)=>{
  res.send("✅ KEY SERVER RUNNING");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server running on", PORT));
