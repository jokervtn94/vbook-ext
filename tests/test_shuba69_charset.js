const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const base=path.join(__dirname,"..","shuba69","src");
const host="https://www.69shuba.com",book=host+"/book/29590.htm";
function col(items){return {size:()=>items.length,first:()=>items[0]||null,get:i=>items[i]||null,text:()=>items.map(e=>e.text()).join(" ")};}
function elem(attributes={},label="",html="",sub={}){return {attr:k=>attributes[k]||"",text:()=>label,html:()=>html,select:k=>col(sub[k]||[])};}
function document(selectors={}){return {select:k=>col(selectors[k]||[])};}
function fixtures(good){
 const title=good?"诡秘之主":"� � � �之主";
 const author=good?"爱潜水的乌贼":"� �潜水� �";
 const description=good?"蒸汽与机械的浪潮中，谁能触及非凡？":"蒸�与�械�浪�中";
 const chapter=good?"第1418章 不想这么多":"��1418�� � �";
 const link=elem({href:book},title);
 const card=elem({},"","",{
  "h3 a[href*='/book/'], h4 a[href*='/book/'], a[href*='/book/']":[link],
  "img":[elem({src:"//cdn.cdnshu.com/test.jpg"})],
  ".intro, .desc, .author, .update, p":[elem({},author)]
 });
 const list=document({
   ".bookbox, .newbox ul li, .mybox li, .booklist li":[card],
   "h3 a[href*='/book/'], h4 a[href*='/book/'], .bookbox a[href*='/book/']":[link],
   ".newbox ul li h3 a, .bookbox h3 a, h3 a[href*='/book/'], h4 a[href*='/book/']":[link]
 });
 const detail=document({
   "meta[property='og:novel:book_name']":[elem({content:title})],
   "meta[property='og:novel:author']":[elem({content:author})],
   "meta[property='og:description']":[elem({content:description})],
   "meta[property='og:image']":[elem({content:"//cdn.cdnshu.com/cover.jpg"})],
   "meta[property='og:novel:status']":[elem({content:"连载"})],
   ".booknav2":[elem({},title+" 作者："+author)]
 });
 const toc=document({
   "#catalog li a[href*='/txt/'], #catalog ul li a":[
     elem({href:"/txt/29590/25167831"},chapter),
     elem({href:"/txt/29590/25167832"},good?"第1419章 新起点":"��1419�� ���")
   ]
 });
 const chap=document({
   ".txtnav":[elem({},chapter,"<h1>"+chapter+"</h1><p>"+(good?"牧尘回到家中，想了很多。":"牧�回�家�，想�很�。")+"</p>")]
 });
 return {"detail.js":detail,"gen.js":list,"search.js":list,"toc.js":toc,"chap.js":chap};
}
function run(file,charset,missingOther=false){
 const good=fixtures(true),bad=fixtures(false),calls=[];
 const context=vm.createContext({
    fetch:()=>({ok:true,status:200,html:code=>{
       calls.push(code);
       if(missingOther&&code!==charset)throw Error("Only one charset supported");
       return (code===charset?good:bad)[file];
    }}),
    Response:{success:(value,next)=>({ok:true,value,next}),error:error=>({ok:false,error})},
    encodeURIComponent
 });
 context.load=name=>vm.runInContext(fs.readFileSync(path.join(base,name),"utf8"),context,{filename:name});
 vm.runInContext(fs.readFileSync(path.join(base,file),"utf8"),context,{filename:file});
 const input=file==="gen.js"?"0":file==="search.js"?"诡秘之主":
   file==="chap.js"?host+"/txt/29590/25167831":book;
 const result=file==="gen.js"||file==="search.js"?context.execute(input,"1"):context.execute(input);
 assert.equal(result.ok,true,file+" "+charset+": "+result.error);
 if(charset==="gbk") assert.deepEqual(calls,["gbk"]);
 else assert.deepEqual(calls,["gbk","utf-8"]);
 assert.ok(context.execute, "VBook execute must remain available");
 const value=result.value;
 let actual="";
 if(file==="detail.js"){
   actual=value.name+" "+value.author+" "+value.description;
   assert.equal(value.name,"诡秘之主");
   assert.equal(value.author,"爱潜水的乌贼");
 }else if(file==="chap.js"){
   actual=value;
   assert.match(value,/牧尘回到家中/);
 }else if(file==="toc.js"){
   actual=value.map(i=>i.name).join(" ");
   assert.ok(value.some(i=>i.name==="第1418章 不想这么多"));
 }else{
   actual=value.map(i=>i.name).join(" ");
   assert.equal(value[0].name,"诡秘之主");
 }
 assert.doesNotMatch(actual,/\uFFFD/,"Do not return replacement chars in "+file);
}
for(const charset of ["utf-8","gbk"]){
 for(const file of ["detail.js","gen.js","search.js","toc.js","chap.js"])
   run(file,charset);
}
const manifest=JSON.parse(fs.readFileSync(path.join(base,"..","plugin.json"),"utf8")).metadata;
assert.equal(manifest.version,7);
assert.equal(manifest.author,"Jokervtn94");
console.log("PASS 69Shuba v7: mixed UTF-8/GBK decoding, repaired novel titles, TOC chapter 1418, metadata and chapter body.");
