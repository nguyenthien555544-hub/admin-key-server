const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB = "./keys.json";

function load(){
  if(!fs.existsSync(DB)) fs.writeFileSync(DB,"{}");
  return JSON.parse(fs.readFileSync(DB));
}
function save(d){ fs.writeFileSync(DB, JSON.stringify(d,null,2)); }

/* ===== CHECK KEY ===== */
app.post("/check",(req,res)=>{
  const { key, device } = req.body;
  const db = load();
  const k = db[key];

  if(!k) return res.json({ok:false,msg:"Key không tồn tại"});
  if(Date.now() > k.expire) return res.json({ok:false,msg:"Key đã hết hạn"});
  if(k.device && k.device !== device)
    return res.json({ok:false,msg:"Key đã gắn máy khác"});

  if(!k.device){
    k.device = device;
    save(db);
  }

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
  const { key, type, days } = req.body;
  const db = load();
  if(db[key]) return res.json({ok:false,msg:"Key đã tồn tại"});

  db[key] = {
    type,
    expire: Date.now() + days*86400000,
    device: ""
  };
  save(db);
  res.json({ok:true});
});

app.post("/admin/delete",(req,res)=>{
  const db = load();
  delete db[req.body.key];
  save(db);
  res.json({ok:true});
});

app.listen(3000,()=>console.log("SERVER KEY RUNNING"));
