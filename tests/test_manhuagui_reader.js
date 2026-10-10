const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"..","manhuagui","src");
const www="https://www.manhuagui.com";
function collection(items){
 return {size:()=>items.length,first:()=>items[0]||null,get:i=>items[i]||null,
  forEach:fn=>items.forEach(fn),text:()=>items.map(i=>i.text()).join(" "),
  attr:key=>items.length?items[0].attr(key):""};
}
function el(attrs={},str="",html="",children={}){
 return {attr:k=>attrs[k]||"",text:()=>str,html:()=>html||str,
  select:css=>collection(children[css]||[])};
}
function doc(nodes={}){return {select:css=>collection(nodes[css]||[])};}
function boot(script,fetcher){
 const requests=[];
 const ctx=vm.createContext({
  fetch:url=>{requests.push(url);return fetcher(url);},
  Response:{success:val=>({ok:true,data:val}),error:error=>({ok:false,error})}
 });
 ctx.load=function(file){vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx,{filename:file});};
 vm.runInContext(fs.readFileSync(path.join(root,script),"utf8"),ctx,{filename:script});
 return {execute:ctx.execute,requests};
}
const book="/comic/26729/",full=www+book,cover="https://cf.mhgui.com/cpic/m/26729.jpg";
const mobile=doc({
 "h1":[el({},"super cub")],
 ".main-bar h1":[el({},"super cub")],
 ".book-detail .cont-list .thumb img":[el({src:"//cf.mhgui.com/cpic/m/26729.jpg"})],
 "#bookIntro":[el({},"一台supercub为她所呈现的，每日欢喜愉快的琐事")],
 ".book-detail .cont-list .thumb i":[el({},"连载")],
 ".book-detail .cont-list dl":[
  el({},"","",{"dt":[el({},"更新至：")],"dd":[el({},"第60话")]}),
  el({},"","",{"dt":[el({},"更新于：")],"dd":[el({},"2026-09-07")]}),
  el({},"","",{"dt":[el({},"作者：")],"dd":[el({},"蟹丹,トネ·コーケソ")]}),
  el({},"","",{"dt":[el({},"类别：")],"dd":[el({},"生活")]})
 ],
 ".chapter-list a":[
  el({href:"/comic/26729/906818.html"},"第60话"),
  el({href:"/comic/26729/889923.html"},"第59.2话"),
  el({href:"/comic/26729/889923.html"},"第59.2话")
 ]
});
const desktop=doc({
 ".book-title h1":[el({},"super cub")],
 ".hcover img":[el({src:"//cf.mhgui.com/cpic/h/26729.jpg"})],
 "#intro-all":[el({},"漫画简介")],
 ".detail-list li":[el({},"出品年代：2018","<span>出品年代：2018</span>"),
                     el({},"漫画作者：蟹丹","<span>漫画作者：蟹丹</span>")],
 ".detail-list li a[href*='/author/']":[el({},"蟹丹")],
 ".chapter-list a":[
  el({title:"第60话",href:"/comic/26729/906818.html"},"第60话"),
  el({title:"第59话",href:"/comic/26729/889923.html"},"第59话")
 ]
});
let run=boot("detail.js",url=>{assert.equal(url,full);return {ok:true,html:()=>mobile};});
let res=run.execute("https://m.manhuagui.com/comic/26729/");
assert.equal(res.ok,true,res.error);
assert.equal(res.data.name,"super cub");
assert.equal(res.data.cover,cover);
assert.equal(res.data.author,"蟹丹,トネ·コーケソ");
assert.match(res.data.detail,/第60话/);
assert.match(res.data.detail,/作者/);
assert.equal(res.data.category,"生活");
assert.equal(res.data.ongoing,true);
assert.match(res.data.description,/supercub/);
run=boot("detail.js",()=>({ok:true,html:()=>desktop}));
res=run.execute(full);
assert.equal(res.ok,true,res.error);
assert.equal(res.data.cover,"https://cf.mhgui.com/cpic/h/26729.jpg");
assert.match(res.data.detail,/出品年代/);
assert.match(res.data.category,/漫画作者/);
assert.equal(res.data.author,"蟹丹");
run=boot("detail.js",()=>null);
res=run.execute(full);
assert.equal(res.ok,false);assert.match(res.error,/không nhận được phản hồi/);
run=boot("detail.js",()=>({ok:false,status:403}));
res=run.execute(full);
assert.equal(res.ok,false);assert.match(res.error,/403/);
run=boot("detail.js",()=>({ok:true,html:()=>doc()}));
res=run.execute(full);
assert.equal(res.ok,false);assert.match(res.error,/tên truyện/);
run=boot("detail.js",()=>({ok:true,html:()=>null}));
res=run.execute(full);
assert.equal(res.ok,false);assert.match(res.error,/HTML/);
res=run.execute("not-a-comic");
assert.equal(res.ok,false);assert.match(res.error,/liên kết/);
run=boot("toc.js",url=>{assert.equal(url,full);return {ok:true,html:()=>mobile};});
res=run.execute("https://m.manhuagui.com/comic/26729/");
assert.equal(res.ok,true,res.error);
assert.equal(res.data.length,2);
assert.equal(res.data[0].name,"第59.2话");
assert.equal(res.data[0].url,www+"/comic/26729/889923.html");
assert.equal(res.data[1].name,"第60话");
run=boot("toc.js",()=>({ok:true,html:()=>desktop}));
res=run.execute(full);
assert.equal(res.ok,true,res.error);
assert.equal(res.data.length,2);
assert.equal(res.data[0].name,"第59话");
run=boot("toc.js",()=>({ok:true,html:()=>doc()}));
res=run.execute(full);
assert.equal(res.ok,false);assert.match(res.error,/không có chương/);
const metadata=JSON.parse(fs.readFileSync(path.join(root,"..","plugin.json"),"utf8")).metadata;
assert.equal(metadata.version,8);assert.equal(metadata.author,"Jokervtn94");
console.log("PASS ManhuaGui v8 detail and TOC: mobile/desktop, metadata, covers, null nodes, missing HTTP, 403, deduped chapter names.");
