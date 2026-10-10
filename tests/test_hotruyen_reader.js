const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const dir=path.join(__dirname,"..","hotruyen","src");
const base="https://hotruyen1.com";
const story=base+"/truyen/toan-dan-chuyen-chuc-ngu-long-su-ta-co-the-chem-than-323131373837382D32373437353936";
const fallback=base+"/Asset/client/images/default.jpg";
function collection(items) {
  return {size:()=>items.length,first:()=>items[0]||empty,get:i=>items[i],
    forEach:fn=>items.forEach(fn),
    text:()=>items.map(x=>x.text()).join(" "),
    attr:k=>items.length?items[0].attr(k):"",
    html:()=>items.length?items[0].html():""};
}
const empty={attr:()=>"",text:()=>"",html:()=>"",select:()=>collection([])};
function elem(attrs={},str="",html="",nodes={}) {
  return {attr:k=>attrs[k]||"",text:()=>str,html:()=>html,select:s=>collection(nodes[s]||[])};
}
function document(nodes={}) {return {select:s=>collection(nodes[s]||[])};}
function boot(file,fetcher) {
  const calls=[];
  const ctx=vm.createContext({fetch:(url)=>{calls.push(url);return fetcher(url);},
    Response:{success:(data,next)=>({ok:true,data,next}),error:error=>({ok:false,error})},
    encodeURIComponent,console});
  ctx.load=source=>vm.runInContext(fs.readFileSync(path.join(dir,source),"utf8"),ctx,{filename:source});
  vm.runInContext(fs.readFileSync(path.join(dir,file),"utf8"),ctx,{filename:file});
  return {execute:ctx.execute,calls,ctx};
}
function ok(doc) {return {ok:true,status:200,html:()=>doc};}
const detailImg=elem({src:"../Asset/client/images/default.jpg"});
const bookAnchor=elem({href:"/truyen/toan-dan-chuyen-chuc-ngu-long-su-ta-co-the-chem-than-323131373837382D32373437353936"},"Tên thật");
function updateCard(image) {
  const fields={"a[href*='/truyen/']":[bookAnchor],a:[bookAnchor],
    "#namevi":[elem({},"Tên truyện Việt")],".author":[elem({},"Tác giả mẫu")]};
  if(image)fields["img[data-src]"]=[image];
  return elem({},"","",fields);
}
const next=elem({href:"nam-sinh?pg=2"},"2");
const listing=document({
  "#newupdate .uitem":[updateCard()],
  ".pagination li.active + li a":[next]
});
let run=boot("home.js",()=>ok(listing));
const home=run.execute();assert.equal(home.ok,true);assert.equal(home.data.length,6);
const names=Array.from(home.data,x=>x.title);
for(const name of ["Nam sinh","Ngôn tình","Đam mỹ","Vô CP","Bách hợp","Khác"])
  assert.ok(names.some(x=>x.includes(name)),name);
run=boot("genre.js",()=>ok(listing));
const genre=run.execute();assert.equal(genre.ok,true);assert.equal(genre.data.length,6);
assert.equal(genre.data[0].input,base+"/nam-sinh");
assert.equal(genre.data[2].input,base+"/dam-my");
run=boot("gen.js",url=>{
  assert.equal(url,base+"/nam-sinh?pg=1");
  return ok(listing);
});
let result=run.execute(base+"/nam-sinh","1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
assert.equal(result.data[0].name,"Tên truyện Việt");
assert.equal(result.data[0].link,story);
assert.equal(result.data[0].cover,fallback,"Homepage has no cover: use real site-provided JPEG fallback");
assert.equal(result.next,"2");
run=boot("gen.js",url=>{
  assert.equal(url,base+"/ngon-tinh?pg=2");
  return ok(listing);
});
result=run.execute(base+"/ngon-tinh","2");assert.equal(result.ok,true);
run=boot("gen.js",url=>{
  assert.equal(url,base+"/nam-sinh?pg=2");
  return ok(listing);
});
result=run.execute(base+"/truyen-nam-sinh/","2");assert.equal(result.ok,true);
const customImage="https://cdn.example.org/covers/123.webp";
const customCard=updateCard(elem({"data-src":customImage,src:"../Asset/client/images/default.jpg"}));
run=boot("gen.js",url=>ok(document({"#newupdate .uitem":[customCard]})));
result=run.execute(base+"/nam-sinh","1");
assert.equal(result.data[0].cover,customImage,"Actual cover should take precedence over default");
const searchCard=elem({},"","",{
  ".title a":[bookAnchor],
  ".author":[elem({},"Tác giả mẫu")],
  ".sitem img":[elem({"data-src":"../Asset/client/images/default.jpg"})]
});
const searchDoc=document({
  "#searchresult .sitem":[searchCard],
  ".pagination li.active + li a":[elem({onclick:"pageClick(2);"},"2")]
});
run=boot("search.js",url=>{
  assert.equal(url,base+"/tim-truyen?sn=T%C3%AAn%20truy%E1%BB%87n&pg=1");
  return ok(searchDoc);
});
result=run.execute("Tên truyện","1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
assert.equal(result.data[0].cover,fallback);
assert.equal(result.next,"2");
const bookDoc=document({
  "h1":[elem({},"Tên truyện Việt")],
  ".book img":[detailImg],
  "#des-info":[elem({},"","<p>Mô tả</p>")],
  ".dinfo > div:nth-child(2) > span":[elem({},"Tác giả mẫu")],
  ".dinfo > div:nth-child(3) > span":[elem({},"Còn tiếp")]
});
run=boot("detail.js",url=>{
  assert.equal(url,story);
  return ok(bookDoc);
});
result=run.execute(story);
assert.equal(result.ok,true,result.error);assert.equal(result.data.name,"Tên truyện Việt");
assert.equal(result.data.cover,fallback);assert.equal(result.data.ongoing,true);
assert.equal(result.data.author,"Tác giả mẫu");
const actualDetail=document({
  "h1":[elem({},"Truyện có ảnh")],
  ".book img":[elem({"src":customImage})]
});
run=boot("detail.js",()=>ok(actualDetail));
result=run.execute(story);assert.equal(result.data.cover,customImage);
run=boot("gen.js",()=>({ok:false,status:403}));
result=run.execute(base+"/nam-sinh","1");assert.equal(result.ok,false);
assert.match(result.error,/403/);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,"..","hotruyen","plugin.json"),"utf8"));
assert.equal(manifest.metadata.version,8);
assert.equal(manifest.metadata.author,"Jokervtn94");
assert.equal(manifest.script.genre,"genre.js");
console.log("PASS Hotruyen v8: six live categories, real/default cover selection, absolute URLs, search, legacy routes, pagination and metadata.");
