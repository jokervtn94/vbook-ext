const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const dir=path.join(__dirname,"..","acqq","src"),host="https://m.ac.qq.com",book=host+"/comic/index/id/650953",chapter=host+"/chapter/index/id/650953/cid/1";
function arr(items) {return {size:()=>items.length,first:()=>items[0]||empty,get:i=>items[i],forEach:fn=>items.forEach(fn),text:()=>items.map(x=>x.text()).join(" "),attr:k=>items[0]?.attr(k)||"",html:()=>items[0]?.html()||""};}
const empty={text:()=>"",attr:()=>"",html:()=>"",select:()=>arr([])};
function el(attrs={},txt="",children={}){return {text:()=>txt,attr:k=>attrs[k]||"",html:()=>txt,select:k=>arr(children[k]||[])};}
function doc(children={}){return {select:k=>arr(children[k]||[])};}
function boot(script,fetcher,browser){
 const seen=[],cx=vm.createContext({Response:{success:(data,next)=>({ok:true,data,next}),error:e=>({ok:false,error:e})},fetch:(url)=>{seen.push(url);return fetcher(url);},Engine:browser,encodeURIComponent,Number,Array});
 cx.load=x=>vm.runInContext(fs.readFileSync(path.join(dir,x),"utf8"),cx,{filename:x});
 vm.runInContext(fs.readFileSync(path.join(dir,script),"utf8"),cx,{filename:script});
 return {execute:cx.execute,seen};
}
const http=d=>({ok:true,status:200,html:()=>d});
const img=el({src:"//manhua.acimg.cn/vertical/sample.jpg/210"});
const anchor=el({href:"/comic/index/id/650953",title:"男主和后宫都是我的了"},"",{
 ".comic-title":[el({},"男主和后宫都是我的了")],
 ".comic-desc":[el({},"玄幻 战斗")],
 "img.cover-image, img.comic-cover, img.head-cover, img.item-cover, img":[img]
});
const feed=doc({"a.comic-link[href], a[href*='/comic/index/id/']":[anchor,anchor]});
let result=boot("home.js",()=>http(feed)).execute();
assert.equal(result.ok,true);assert.equal(result.data.length,3);
let run=boot("gen.js",url=>{assert.equal(url,host+"/");return http(feed);});
result=run.execute(host+"/","1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1,"Must deduplicate repeated cards");
assert.equal(result.data[0].link,book);
assert.equal(result.data[0].cover,"https://manhua.acimg.cn/vertical/sample.jpg/210");
assert.equal(result.data[0].name,"男主和后宫都是我的了");
run=boot("gen.js",url=>{assert.match(url,/\/category\/listAll\?type=xh&rank=pgv$/);return http(feed);});
result=run.execute(host+"/category/listAll?type=xh&rank=pgv","1");
assert.equal(result.ok,true,result.error);
result=run.execute(host+"/category/listAll?type=xh&rank=pgv","2");
assert.equal(result.ok,true);assert.equal(result.data.length,0);
const genreDoc=doc({"a[href*='/category/listAll?']":[el({href:"/category/listAll?type=xh&rank=pgv"},"| 玄幻"),el({href:"/category/listAll?type=rx&rank=pgv"},"| 热血")]});
run=boot("genre.js",url=>{assert.equal(url,host+"/category/index");return http(genreDoc);});
result=run.execute();
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,4);
assert.equal(result.data[2].title,"玄幻");
assert.equal(result.data[3].input,host+"/category/listAll?type=rx&rank=pgv");
run=boot("search.js",url=>{assert.equal(url,host+"/search/result?word="+encodeURIComponent("一人之下"));return http(feed);});
result=run.execute("一人之下","1");assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
const detailDoc=doc({
 "h1.top-title":[el({},"男主和后宫都是我的了")],
 "meta[property='og:image']":[el({content:"https://manhua.acimg.cn/horizontal/detail.jpg/0"})],
 ".head-info-desc":[el({},"测试简介")],
 ".chapter-info":[el({},"连载中")]
});
run=boot("detail.js",url=>{assert.equal(url,book);return http(detailDoc);});
result=run.execute("https://ac.qq.com/Comic/ComicInfo/id/650953");
assert.equal(result.ok,true,result.error);assert.equal(result.data.name,"男主和后宫都是我的了");
assert.equal(result.data.cover,"https://manhua.acimg.cn/horizontal/detail.jpg/0");
assert.equal(result.data.host,host);
const ch1=el({href:"/chapter/index/id/650953/cid/1"},"",{
 ".chapter-title":[el({},"1 - 预热")]});
const ch2=el({href:"/chapter/index/id/650953/cid/2"},"",{
 ".chapter-title":[el({},"2 - 序章")]});
const tocDoc=doc({"a.chapter-link[href*='/chapter/index/id/']":[ch1,ch2,ch1]});
run=boot("toc.js",url=>{assert.equal(url,book);return http(tocDoc);});
result=run.execute("https://ac.qq.com/Comic/ComicInfo/id/650953");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,2);
assert.equal(result.data[0].url,chapter);assert.equal(result.data[0].name,"1 - 预热");
const pic=el({"data-src":"//manhua.acimg.cn/pg/1.jpg"});
const imageDoc=doc({".comic-pic-list img, #comicContain img, .chapter-content img, .comic-pic img, img.comic-pic-image":[pic,pic]});
run=boot("chap.js",url=>{assert.equal(url,chapter);return http(imageDoc);});
result=run.execute("https://ac.qq.com/ComicView/index/id/650953/cid/1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
assert.equal(result.data[0],"https://manhua.acimg.cn/pg/1.jpg");
let closed=0;
const browser={newBrowser:()=>({launch:()=>imageDoc,html:()=>imageDoc,close:()=>{closed++;}})};
run=boot("chap.js",()=>http(doc()),browser);
result=run.execute(chapter);assert.equal(result.ok,true,result.error);assert.equal(closed,1);
run=boot("chap.js",()=>http(doc()));
result=run.execute(chapter);assert.equal(result.ok,false);assert.match(result.error,/chưa có ảnh công khai/);
result=run.execute("not-a-chapter");assert.equal(result.ok,false);assert.match(result.error,/không hợp lệ/);
run=boot("gen.js",()=>({ok:false,status:403}));
result=run.execute(host+"/","1");assert.equal(result.ok,false);assert.match(result.error,/HTTP 403/);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,"..","plugin.json"),"utf8"));
assert.equal(manifest.metadata.version,4);
assert.equal(manifest.script.search,"search.js");
for(const x of ["config.js","gen.js","genre.js","detail.js","toc.js","chap.js","search.js"]){
 const src=fs.readFileSync(path.join(dir,x),"utf8");
 assert.doesNotMatch(src,/\.parent\s*\(|\.remove\s*\(/);
}
console.log("PASS AC QQ v4: mobile home, categories, search, list/cards, covers, desktop links, details, chapter TOC, WebView and explicit errors");
