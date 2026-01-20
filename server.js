const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const KEY_FILE = "./keys.json";

/* ================= UTILS ================= */
function loadKeys(){
  if(!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE,"[]");
  return JSON.parse(fs.readFileSync(KEY_FILE));
}

function saveKeys(data){
  fs.writeFileSync(KEY_FILE, JSON.stringify(data,null,2));
}

function now(){
  return new Date().toLocaleString("vi-VN");
}

/* ================= HOME ================= */
app.get("/", (req,res)=>{
  res.send("✅ KEY SERVER ONLINE");
});

/* ================= ADMIN PAGE ================= */
app.get("/admin", (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ADMIN KEY</title>
<style>
body{background:#000;color:#00ff66;font-family:monospace}
input,button{padding:8px;margin:5px;background:#000;color:#00ff66;border:1px solid #00ff66}
table{width:100%;border-collapse:collapse;margin-top:10px}
td,th{border:1px solid #00ff66;padding:5px;text-align:center}
</style>
</head>
<body>
<h2>🔑 ADMIN KEY</h2>

<input id="k" placeholder="Key">
<button onclick="add()">TẠO</button>

<table>
<thead>
<tr><th>KEY</th><th>DEVICE</th><th>TẠO LÚC</th><th>XÓA</th></tr>
</thead>
<tbody id="list"></tbody>
</table>

<script>
async function load(){
  const r = await fetch("/keys");
  const d = await r.json();
  list.innerHTML="";
  d.forEach(x=>{
    list.innerHTML+=\`
    <tr>
      <td>\${x.key}</td>
      <td>\${x.device||"-"}</td>
      <td>\${x.time}</td>
      <td><button onclick="del('\${x.key}')">X</button></td>
    </tr>\`;
  });
}
async function add(){
  await fetch("/add",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k.value})});
  k.value="";load();
}
async function del(key){
  await fetch("/del",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
  load();
}
load();
</script>
</body>
</html>
`);
});

/* ================= API ================= */
app.get("/keys",(req,res)=>{
  res.json(loadKeys());
});

app.post("/add",(req,res)=>{
  let keys = loadKeys();
  if(keys.find(x=>x.key===req.body.key)) return res.json({ok:false});
  keys.push({ key:req.body.key, device:null, time:now() });
  saveKeys(keys);
  res.json({ok:true});
});

app.post("/del",(req,res)=>{
  let keys = loadKeys().filter(x=>x.key!==req.body.key);
  saveKeys(keys);
  res.json({ok:true});
});

/* ================= BOT CHECK ================= */
app.post("/check",(req,res)=>{
  const {key,device} = req.body;
  let keys = loadKeys();
  let k = keys.find(x=>x.key===key);
  if(!k) return res.json({ok:false,msg:"Key không tồn tại"});
  if(!k.device){
    k.device = device;
    saveKeys(keys);
  }
  if(k.device !== device) return res.json({ok:false,msg:"Key đã dùng máy khác"});
  res.json({ok:true});
});

app.listen(PORT, ()=>console.log("SERVER RUN",PORT));
