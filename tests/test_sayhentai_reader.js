const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"..","sayhentai","src");
function collection(data){
 return {size:()=>data.length,attr:name=>data[0]?.attr(name)||"",
  text:()=>data.map(x=>x.text()).join(" "),
  forEach:fn=>data.forEach(fn)};
}
function node(attrs={},text="",children={}){
 return {attr:key=>attrs[key]||"",text:()=>text,
  select:key=>collection(children[key]||[])};
}
function run(file,input,response){
 let sent=[];
 const context={Response:{success:(data,next)=>({ok:true,data,next}),error:error=>({ok:false,error})}};
 context.fetch=(url,opt)=>{sent.push({url,opt});return response;};
 const sandbox=vm.createContext(context);
 context.load=name=>vm.runInContext(fs.readFileSync(path.join(root,name),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),sandbox);
 return {value:context.execute(input,"1"),sent};
}
const a=node({href:"https://sayhentai.one/truyen-mau.html"},"Truyện mẫu");
const img=node({"data-src":"//cdn.example.com/covers/1.jpg"});
const block=node({},"",{"h3 a":[a],"img.img-responsive, img":[img],".chapter":[node({},"Chương mới")]});
const page={select:s=>s===".page-item-detail"?collection([block]):
 collection([])};
let search=run("search.js","mẫu",{ok:true,html:()=>page});
assert.equal(search.value.ok,true,search.value.error);
assert.equal(search.sent[0].url,"https://sayhentai.cx/search");
assert.equal(search.value.data.length,1);
assert.equal(search.value.data[0].link,"https://sayhentai.cx/truyen-mau.html");
assert.equal(search.value.data[0].cover,"https://cdn.example.com/covers/1.jpg");
const chapterImg=node({"data-original":"//cdn.example.com/pages/01.webp"});
const chapterDoc={select:s=>s==="#chapter_content img[id^=image]"?collection([chapterImg,chapterImg]):collection([])};
let chapter=run("chap.js","https://sayhentai.net/truyen-mau/chuong-1",{ok:true,html:()=>chapterDoc});
assert.equal(chapter.value.ok,true,chapter.value.error);
assert.equal(chapter.sent[0].url,"https://sayhentai.cx/truyen-mau/chuong-1");
assert.equal(chapter.value.data.length,1);
assert.equal(chapter.value.data[0],"https://cdn.example.com/pages/01.webp");
chapter=run("chap.js","https://sayhentai.cx/truyen-mau/chuong-1",{ok:false,status:403});
assert.equal(chapter.value.ok,false);
assert.match(chapter.value.error,/Cloudflare/);
search=run("search.js","mẫu",{ok:false,status:403});
assert.equal(search.value.ok,false);
assert.match(search.value.error,/Cloudflare/);
console.log("PASS Say Hentai current source routing, chapter cover/image normalization and Cloudflare errors");
