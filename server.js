const express=require("express");
const fs=require("fs");
const cors=require("cors");
const app=express();

app.use(cors());
app.use(express.json());

const FILE="./keys.json";

/* LOAD */
function load(){
 if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,"{}");
 return JSON.parse(fs.readFileSync(FILE));
}
function save(d){fs.writeFileSync(FILE,JSON.stringify(d,null,2))}

/* CHECK KEY */
app.post("/check",(req,res)=>{
 const {key,device}=req.body;
 const data=load();
 const k=data[key];
 if(!k) return res.json({ok:false,msg:"Key không tồn tại"});
 if(k.device && k.device!==device)
  return res.json({ok:false,msg:"Sai thiết bị"});
 if(k.expire && Date.now()>k.expire)
  return res.json({ok:false,msg:"Key hết hạn"});
 res.json({ok:true,type:k.type,expire:k.expire});
});

/* ADMIN */
app.get("/admin/keys",(req,res)=>res.json(load()));

app.post("/admin/create",(req,res)=>{
 const {key,type,device}=req.body;
 let data=load();
 if(data[key]) return res.json({ok:false,msg:"Key đã tồn tại"});
 let expire=null;
 if(type==="FREE") expire=Date.now()+86400000;
 data[key]={type,device,expire};
 save(data);
 res.json({ok:true});
});

app.post("/admin/delete",(req,res)=>{
 const {key}=req.body;
 let data=load();
 delete data[key];
 save(data);
 res.json({ok:true});
});

app.listen(3000,()=>console.log("SERVER OK"));
