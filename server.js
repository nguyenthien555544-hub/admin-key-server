const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./keys.json";

function loadDB(){
  if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(db){
  fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2));
}

/* ================= CHECK KEY ================= */
app.post("/check",(req,res)=>{
  const { key, device } = req.body;
  const db = loadDB();
  const k = db[key];
  if(!k) return res.json({ok:false,msg:"Key không tồn tại"});

  if(k.expire && Date.now() > k.expire)
    return res.json({ok:false,msg:"Key hết hạn"});

  if(k.device && k.device !== device)
    return res.json({ok:false,msg:"Key đã dùng máy khác"});

  if(!k.device){
    k.device = device;
    saveDB(db);
  }

  res.json({
    ok:true,
    type:k.type,
    expire:k.expire || null
  });
});

/* ================= ADMIN ================= */
app.get("/admin/keys",(req,res)=>{
  res.json(loadDB());
});

app.post("/admin/create",(req,res)=>{
  const { key, type } = req.body;
  const db = loadDB();
  if(db[key]) return res.json({ok:false,msg:"Key đã tồn tại"});

  let expire = null;
  if(type === "FREE") expire = Date.now() + 86400000; // 1 day

  db[key] = {
    type,
    expire,
    device:null,
    created:Date.now()
  };
  saveDB(db);
  res.json({ok:true});
});

app.post("/admin/delete",(req,res)=>{
  const { key } = req.body;
  const db = loadDB();
  delete db[key];
  saveDB(db);
  res.json({ok:true});
});

app.listen(3000,()=>console.log("KEY SERVER RUNNING"));
