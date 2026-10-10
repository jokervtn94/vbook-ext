const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,"..","shuba69","src");
const host="https://www.69shuba.com",url=host+"/book/29590.htm";
const broken="\uFFFD\uFFFD\uFFFD\uFFFD";
function nodes(items){return {
 size:()=>items.length,first:()=>items[0]||null,get:i=>items[i]||null,
 text:()=>items.map(i=>i.text()).join(" ")
};}
function el(attrs={},text="",html="",selectors={}){return{
 attr:k=>attrs[k]||"",text:()=>text,html:()=>html,
 select:key=>nodes(selectors[key]||[])
};}
function doc(sel={}){return {select:key=>nodes(sel[key]||[])};}
const title=el({content:"诡秘之主"});
const author=el({content:"爱潜水的乌贼"});
const desc=el({content:"蒸汽与机械的浪潮中，谁能触及非凡？"});
const image=el({content:"//cdn.cdnshu.com/files/article/image/29/29590/29590s.jpg"});
const details=doc({
 "meta[property='og:novel:book_name']":[title],
 "meta[property='og:novel:author']":[author],
 "meta[property='og:description']":[desc],
 "meta[property='og:image']":[image],
 "meta[property='og:novel:status']":[el({content:"全本"})],
 "meta[property='og:novel:category']":[el({content:"玄幻魔法"})],
 ".booknav2":[el({},"玄幻魔法 爱潜水的乌贼 全本")]
});
const bookLink=el({href:url},"诡秘之主");
const listCard=el({},"","",{
 "h3 a[href*='/book/'], h4 a[href*='/book/'], a[href*='/book/']":[bookLink],
 "img":[el({src:"//cdn.cdnshu.com/book.jpg"})],
 ".intro, .desc, .author, .update, p":[el({},"爱潜水的乌贼")]
});
const listing=doc({
 ".bookbox, .newbox ul li, .mybox li, .booklist li":[listCard],
 "h3 a[href*='/book/'], h4 a[href*='/book/'], .bookbox a[href*='/book/']":[bookLink],
 ".newbox ul li h3 a, .bookbox h3 a, h3 a[href*='/book/'], h4 a[href*='/book/']":[bookLink]
});
const toc=doc({
 "#catalog li a[href*='/txt/'], #catalog ul li a":[
 el({href:"/txt/29590/25167831"},"1417.新书已发"),
 el({href:"/txt/29590/25167830"},"1416.不是诈尸")
]});
const chapter=doc({
 ".txtnav":[el({},"","<h1>1417.新书已发</h1><p>新书已发，《长夜余火》。</p>")]
});
const mapping={"detail.js":details,"gen.js":listing,"search.js":listing,
 "toc.js":toc,"chap.js":chapter};
function run(script,input){
 const charsets=[];
 const sandbox={Response:{
  success:(value,next)=>({ok:true,value,next}),error:error=>({ok:false,error})
 },fetch:()=>({
  ok:true,status:200,
  html:charset=>{
   charsets.push(charset===undefined?"auto":charset);
   if(String(charset).toLowerCase()!=="gbk"){
    return doc({"meta[property='og:novel:book_name']":[el({content:broken})]});
   }
   return mapping[script];
  }
 }),encodeURIComponent};
 const source=fs.readFileSync(path.join(base,script),"utf8");
 vm.runInNewContext(source,sandbox,{filename:script});
 const result=script==="gen.js"||script==="search.js"?
   sandbox.execute(input,"1"):sandbox.execute(input);
 assert.equal(result.ok,true,script+": "+result.error);
 assert.deepEqual(charsets,["gbk"],script+" must use supported VBook html(charset) API");
 return result.value;
}
let data=run("detail.js",url);
assert.equal(data.name,"诡秘之主");
assert.equal(data.author,"爱潜水的乌贼");
assert.match(data.description,/蒸汽与机械/);
assert.match(data.detail,/玄幻魔法/);
assert.equal(data.ongoing,false);
assert.doesNotMatch(JSON.stringify(data),/\uFFFD/);
for(const s of ["gen.js","search.js"]){
 const results=run(s,s==="gen.js"?"0":"诡秘之主");
 assert.equal(results.length,1);
 assert.equal(results[0].name,"诡秘之主");
 assert.equal(results[0].description,"爱潜水的乌贼");
}
const chapters=run("toc.js",url);
assert.equal(chapters.length,2);
assert.match(chapters[0].name,/不是诈尸/);
const text=run("chap.js",host+"/txt/29590/25167831");
assert.match(text,/长夜余火/);
const meta=JSON.parse(fs.readFileSync(path.resolve(base,"..","plugin.json"),"utf8")).metadata;
assert.equal(meta.version,5);assert.equal(meta.author,"Jokervtn94");
console.log("PASS 69Shuba v5: VBook GBK HTML decode in detail, lists, search, TOC and chapter; Chinese preserved.");
