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
const desktop={bid:26729,cid:346817,files:["1.jpg.webp","2.jpg.webp"],
  path:"/ps4/s/supercub_xd/第01回/",sl:{e:1792599934,m:"signed_token"}};
const mobile={bookId:26729,chapterId:346817,images:[
  "/ps4/s/supercub_xd/第01回/1.jpg.webp",
  "/ps4/s/supercub_xd/第01回/2.jpg.webp"
],sl:{e:1792599934,m:"signed_token"}};
// Both current page contracts were verified against live ManhuaGui chapter
// HTML: desktop SMH.imgData(files,path), mobile SMH.reader(images).
const okContext=boot(()=>null);
for(const [type,info] of [["imgData",desktop],["reader",mobile]]){
  const json="SMH."+type+"("+JSON.stringify(info)+").preInit();";
  const parsed=okContext.mgChapterManifest(json);
  assert.equal(parsed.sl.m,"signed_token",type);
  const images=okContext.mgChapterImages(parsed);
  assert.equal(images.length,2,type);
  assert.match(images[0],/^https:\/\/i\.hamreus\.com\/ps4\/s\/supercub_xd\/%E7%AC%AC01%E5%9B%9E\/1\.jpg\.webp\?e=1792599934&m=signed_token$/);
  assert.match(images[1],/2\.jpg\.webp\?e=1792599934/);
}
assert.equal(okContext.mgChapterImages({images:[]}).length,0);
assert.equal(okContext.mgChapterImages({images:["/a.webp"]}).length,0);
assert.equal(okContext.mgChapterManifest("invalid"),null);

let c=boot(()=>({ok:true,text:()=>"<html>Not a readable chapter</html>"}));
let r=c.execute(book);
assert.equal(r.ok,false);assert.match(r.error,/không tìm thấy dữ liệu chương/);
c=boot(()=>({ok:false,status:429}));
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/429/);
c=boot(()=>null);
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/không nhận được phản hồi/);
c=boot(()=>({ok:true,text:()=>""}));
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/HTML/);
c=boot(()=>{throw new Error("network blocked");});
r=c.execute(book);assert.equal(r.ok,false);assert.match(r.error,/network blocked/);
r=c.execute("bad-url");assert.equal(r.ok,false);assert.match(r.error,/không hợp lệ/);
const metadata=JSON.parse(fs.readFileSync(path.join(root,"..","plugin.json"),"utf8")).metadata;
assert.equal(metadata.version,8);
assert.equal(metadata.author,"Jokervtn94");
console.log("PASS ManhuaGui v8: mobile images, desktop files, CDN signatures, execute and chapter errors");
