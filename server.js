<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>ADMIN KEY</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{background:#000;color:#00ff66;font-family:monospace}
.box{max-width:450px;margin:auto;border:2px solid #00ff66;padding:12px}
input,select,button{width:100%;padding:10px;margin:6px 0;background:#000;color:#00ff66;border:1px solid #00ff66}
.key{display:flex;justify-content:space-between;margin:5px 0;font-size:13px}
small{opacity:.8}
</style>
</head>
<body>

<div class="box">
<h3>🔑 ADMIN KEY</h3>

<input id="key" placeholder="Key">
<select id="type">
<option value="FREE">FREE (1 ngày)</option>
<option value="VIP">VIP (Vĩnh viễn)</option>
</select>

<button onclick="create()">➕ TẠO KEY</button>

<div id="list">Loading...</div>
</div>

<script>
const SERVER="https://admin-key-server.onrender.com";

async function load(){
  const res = await fetch(SERVER+"/admin/keys");
  const d = await res.json();
  let html="";
  for(let k in d){
    const e = d[k].expire
      ? new Date(d[k].expire).toLocaleString()
      : "VĨNH VIỄN";
    html+=`
    <div class="key">
      <div>
        <b>${k}</b><br>
        <small>${d[k].type} | ${e}</small><br>
        <small>ID: ${d[k].device||"CHƯA GẮN"}</small>
      </div>
      <button onclick="del('${k}')">❌</button>
    </div>`;
  }
  list.innerHTML = html || "Chưa có key";
}

async function create(){
  if(!key.value) return alert("Nhập key");
  const res = await fetch(SERVER+"/admin/create",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ key:key.value, type:type.value })
  });
  const d = await res.json();
  if(!d.ok) return alert(d.msg);
  key.value="";
  load();
}

async function del(k){
  if(!confirm("Xóa "+k+"?")) return;
  await fetch(SERVER+"/admin/delete",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ key:k })
  });
  load();
}

load();
</script>
</body>
</html>
