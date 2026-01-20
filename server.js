const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB = "./keys.json";

function load(){
  if(!fs.existsSync(DB)) fs.writeFileSync(DB, "{}");
  return JSON.parse(fs.readFileSync(DB));
}
function save(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

/* ===== CHECK KEY ===== */
app.post("/check",(req,res)=>{
  const { key, device } = req.body;
  const db = load();
  if(!db[key]) return res.json({ok:false,msg:"Key không tồn tại"});

  const k = db[key];
  if(Date.now() > k.expire) return res.json({ok:false,msg:"Key hết hạn"});

  if(k.device && k.device !== device)
    return res.json({ok:false,msg:"Key đã gắn máy khác"});

  k.device = device;
  k.last = Date.now();
  save(db);

  res.json({
    ok:true,
    type:k.type,
    expire:k.expire
  });
});

/* ===== ADMIN ===== */
app.get("/admin/keys",(req,res)=>{
  res.json(load());
});

app.post("/admin/create",(req,res)=>{
  const { key, type } = req.body;
  const db = load();
  if(db[key]) return res.json({ok:false,msg:"Key đã tồn tại"});

  const day = 86400000;
  db[key] = {
    type,
    device:"",
    create:Date.now(),
    expire: type==="FREE" ? Date.now()+day : Date.now()+day*3650
  };
  save(db);
  res.json({ok:true});
});

app.post("/admin/delete",(req,res)=>{
  const { key } = req.body;
  const db = load();
  delete db[key];
  save(db);
  res.json({ok:true});
});

app.listen(3000,()=>console.log("SERVER KEY RUNNING"));
