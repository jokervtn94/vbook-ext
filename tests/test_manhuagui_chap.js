const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"..","manhuagui","src");
const source=fs.readFileSync(path.join(root,"chap.js"),"utf8");
const book="https://www.manhuagui.com/comic/26729/346817.html";
function boot(fetcher){
  const ctx=vm.createContext({fetch:fetcher,Response:{
    success:value=>({ok:true,value}),error:error=>({ok:false,error})}});
  vm.runInContext(source,ctx,{filename:"chap.js"});
  return ctx;
}
function packed(method,info){
  // Use the real unpacker with c=0 (no dictionary substitutions).
  // This synthetic payload tests the chapter contract without chapter assets.
  const program="SMH."+method+"("+JSON.stringify(info)+").preInit();";
  const suffix="'['\\x73\\x70\\x6c\\x69\\x63']('\\x7c'),0,{}))";
  return "(function(p,a,c,k,e,d)function loader(){} p;}('"+
    program+"',62,0,'dictionary"+suffix;
}
const desktop={bid:26729,cid:346817,files:["1.jpg.webp","2.jpg.webp"],
  path:"/ps4/s/supercub_xd/第01回/",sl:{e:1792599934,m:"signed_token"}};
const mobile={bookId:26729,chapterId:346817,images:[
  "/ps4/s/supercub_xd/第01回/1.jpg.webp",
  "/ps4/s/supercub_xd/第01回/2.jpg.webp"
],sl:{e:1792599934,m:"signed_token"}};
for(const [type,info] of [["imgData",desktop],["reader",mobile]]){
  const html=packed(type,info);
  const c=boot(url=>{assert.equal(url,book);return {ok:true,text:()=>html};});
  c.LZString.decompressFromBase64=()=> "placeholder|dictionary";
  const out=c.execute(book);
  assert.equal(out.ok,true,type+": "+out.error);
  assert.equal(out.value.length,2);
  assert.match(out.value[0],/^https:\/\/i\.hamreus\.com\/ps4\/s\/supercub_xd\/%E7%AC%AC01%E5%9B%9E\/1\.jpg\.webp\?e=1792599934&m=signed_token$/);
  assert.match(out.value[1],/2\.jpg\.webp\?e=1792599934/);
}
let c=boot(()=>({ok:true,text:()=>"<html>Not a readable chapter</html>"}));
let r=c.execute(book);
assert.equal(r.ok,false);assert.match(r.error,/không tìm thấy dữ liệu chương/);
c=boot(()=>({ok:false,status:429}));
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/429/);
c=boot(()=>null);
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/không nhận được phản hồi/);
c=boot(()=>({ok:true,text:()=>""}));
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/HTML/);
c=boot(()=>({ok:true,text:()=>packed("reader",{images:[]})}));
c.LZString.decompressFromBase64=()=> "mock|dict";
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/không có danh sách ảnh/);
c=boot(()=>({ok:true,text:()=>packed("reader",{images:["/a.webp"]})}));
c.LZString.decompressFromBase64=()=> "mock|dict";
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/thiếu chữ ký/);
c=boot(()=>{throw new Error("network blocked");});
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/network blocked/);
c=boot(()=>({ok:true,text:()=>packed("reader",mobile)}));
c.LZString.decompressFromBase64=()=> "mock|dict";
r=c.execute("bad-url");assert.equal(r.ok,false);assert.match(r.error,/không hợp lệ/);
const metadata=JSON.parse(fs.readFileSync(path.join(root,"..","plugin.json"),"utf8")).metadata;
assert.equal(metadata.version,8);
assert.equal(metadata.author,"Jokervtn94");
console.log("PASS ManhuaGui v8: mobile images, desktop files, CDN signatures, execute and chapter errors");
