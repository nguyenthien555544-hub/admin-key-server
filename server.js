import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* ===== FILE DATA ===== */
const KEY_FILE = "./keys.json";
const GAME_FILE = "./game.json";

function loadKeys(){
  if(!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE,"{}");
  return JSON.parse(fs.readFileSync(KEY_FILE));
}
function saveKeys(d){
  fs.writeFileSync(KEY_FILE,JSON.stringify(d,null,2));
}
function loadGame(){
  if(!fs.existsSync(GAME_FILE)) fs.writeFileSync(GAME_FILE,"{}");
  return JSON.parse(fs.readFileSync(GAME_FILE));
}
function saveGame(d){
  fs.writeFileSync(GAME_FILE,JSON.stringify(d,null,2));
}

/* ===== CHECK KEY ===== */
app.post("/check",(req,res)=>{
  const { key, device } = req.body;
  let keys = loadKeys();

  if(!keys[key])
    return res.json({ok:false,msg:"Key không tồn tại"});

  let k = keys[key];

  if(Date.now() > k.expire)
    return res.json({ok:false,msg:"Key đã hết hạn"});

  if(k.device && k.device !== device)
    return res.json({ok:false,msg:"Key đã gắn thiết bị khác"});

  if(!k.device){
    k.device = device;
    saveKeys(keys);
  }

  res.json({
    ok:true,
    type:k.type,
    expire:k.expire
  });
});

/* ===== ADMIN ===== */
app.get("/admin/keys",(req,res)=>{
  res.json(loadKeys());
});

app.post("/admin/create",(req,res)=>{
  const { key, type, expire } = req.body;
  let keys = loadKeys();

  if(keys[key])
    return res.json({ok:false,msg:"Key đã tồn tại"});

  keys[key] = {
    type,
    expire,
    device:null,
    created:Date.now()
  };

  saveKeys(keys);
  res.json({ok:true});
});

app.post("/admin/delete",(req,res)=>{
  let keys = loadKeys();
  delete keys[req.body.key];
  saveKeys(keys);
  res.json({ok:true});
});

/* ===== GAME API ===== */
app.post("/game/submit",(req,res)=>{
  saveGame({
    rooms:req.body.rooms,
    time:Date.now()
  });
  res.json({ok:true});
});

app.get("/game/latest",(req,res)=>{
  res.json(loadGame());
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("SERVER RUNNING",PORT));
