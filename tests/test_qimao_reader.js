const assert=require("node:assert/strict"), fs=require("node:fs"), vm=require("node:vm"), path=require("node:path"), crypto=require("node:crypto");
const dir=path.resolve(__dirname,"..","qimao","src");
const qm="https://www.qimao.com", id="151581", book=qm+"/shuku/"+id+"/";
function element(attrs={},value="",children={}) {
    return {attr:n=>attrs[n]||"",text:()=>value,select:s=>collection(children[s]||[])};
}
function collection(elements) {
    return {size:()=>elements.length,first:()=>elements[0]||element(),
        get:i=>elements[i],forEach:fn=>elements.forEach(fn),text:()=>elements.map(e=>e.text()).join(" "),attr:n=>elements[0]?.attr(n)||""};
}
function document(nodes={}) {return {select:s=>collection(nodes[s]||[])};}
function boot(script,handleRequest,browser) {
    const urls=[],ctx=vm.createContext({fetch:(url,opts)=>{urls.push({url,opts});return handleRequest(url,opts);},
        Engine:browser,Response:{success:(data,next)=>({ok:true,data,next}),error:error=>({ok:false,error})},
        encodeURIComponent,Array,Number,String,console});
    ctx.load=function(name){vm.runInContext(fs.readFileSync(path.join(dir,name),"utf8"),ctx,{filename:name});};
    vm.runInContext(fs.readFileSync(path.join(dir,script),"utf8"),ctx,{filename:script});
    return {execute:ctx.execute,urls};
}
function http(doc){return {ok:true,status:200,html:()=>doc};}
function api(data){return {ok:true,status:200,json:()=>({data})};}
const title=element({href:book},"神医毒妃不好惹");
const cover=element({src:"//cdn.wtzw.com/test-cover.jpg"});
const card=element({},"",{
    ".s-tit a":[title],
    ".qm-book-cover img":[cover],
    ".s-author":[element({},"姑苏小七")],
    ".s-desc":[element({},"内容简介")]
});
const listDoc=document({"li.qm-cover-text-item":[card]});
let flow=boot("home.js",()=>http(listDoc));
assert.equal(flow.execute().data.length,4);
flow=boot("gen.js",url=>{assert.match(url,/\/shuku\/a-a-a-a-a-a-a-update_time-1\/$/);return http(listDoc);});
let result=flow.execute("a-a-a","1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
assert.equal(result.data[0].link,book);
assert.equal(result.data[0].cover,"https://cdn.wtzw.com/test-cover.jpg");
flow=boot("gen.js",url=>{assert.match(url,/\/shuku\/0-56-a-a-a-a-a-update_time-2\/$/);return http(listDoc);});
result=flow.execute("0-56-a","2");assert.equal(result.ok,true);
let closes=0;
const browser={newBrowser:()=>({launch:()=>listDoc,html:()=>listDoc,close:()=>{closes++}})};
flow=boot("gen.js",()=>({ok:false,status:403}),browser);
result=flow.execute("a-a-a","1");assert.equal(result.ok,true,result.error);assert.equal(closes,1);
flow=boot("gen.js",()=>({ok:false,status:403}));
result=flow.execute("a-a-a","1");assert.equal(result.ok,false);assert.match(result.error,/xác minh/);

const books=[
  {id,original_title:"",title:"<b>神医</b>毒妃不好惹",original_author:"",author:"姑苏小七",
   image_link:"https://cdn.wtzw.com/151581.jpg",show_type:"0"},
  {id:"22",original_title:"Audio Only",show_type:"4"},
  {id:"23",original_title:"Advertisement",show_type:"2"}
];
flow=boot("search.js",url=>{assert.match(url,/\/api\/v7\/search\/words\?wd=/);return api({books});});
result=flow.execute("神医","1");
assert.equal(result.ok,true,result.error);assert.equal(result.data.length,1);
assert.equal(result.data[0].link,book);assert.equal(result.data[0].name,"神医毒妃不好惹");
assert.equal(result.data[0].description,"姑苏小七");
assert.equal(flow.urls[0].opts.headers["app-version"],"71900");
const actualBook={title:"神医毒妃不好惹",author_uid:"48712",author:"姑苏小七",
  thumb_image_link:"https://cdn.wtzw.com/cover.jpg",intro:"介绍",latest_chapter_title:"最终章",is_over:"1"};
flow=boot("detail.js",url=>{assert.match(url,/\/api\/v5\/book\/detail\?id=151581/);return api({book:actualBook,author_info:{name:"备用作者"}});});
result=flow.execute(id);
assert.equal(result.ok,true,result.error);assert.equal(result.data.author,"姑苏小七");
assert.equal(result.data.ongoing,false);assert.equal(result.data.cover,actualBook.thumb_image_link);
assert.equal(flow.execute(book).data.name,"神医毒妃不好惹");
assert.equal(flow.execute("https://api-bc.wtzw.com/item?id=151581").ok,true);
flow=boot("detail.js",()=>({ok:false,status:403}));
result=flow.execute(book);assert.equal(result.ok,false);assert.match(result.error,/403/);
flow=boot("detail.js",()=>api({book:{title:"Book",is_over:0},author_info:{name:"备用作者"}}));
result=flow.execute(id);assert.equal(result.data.author,"备用作者");assert.equal(result.data.ongoing,true);

const chapters=[{id:"345141",title:"第1章 王妃投湖"},{id:"345157",title:"第2章 穿成弃妃"}];
flow=boot("toc.js",url=>{assert.match(url,/\/chapter\/chapter-list\?id=151581/);return api({chapter_lists:chapters});});
result=flow.execute(book);assert.equal(result.ok,true,result.error);assert.equal(result.data.length,2);
assert.equal(result.data[0].url,"chapterId=345141&id=151581");
const key=Buffer.from("242ccb8230d709e1","utf8");
const iv=Buffer.from("00112233445566778899aabbccddeeff","hex");
const plain="正文测试\n第二行";
const cipher=crypto.createCipheriv("aes-128-cbc",key,iv);
const ciphertext=Buffer.concat([cipher.update(plain,"utf8"),cipher.final()]);
const encrypted=Buffer.concat([iv,ciphertext]).toString("base64");
flow=boot("chap.js",url=>{assert.match(url,/\/chapter\/content\?chapterId=345141&id=151581&sign=/);return api({content:encrypted});});
result=flow.execute("chapterId=345141&id=151581");
assert.equal(result.ok,true,result.error);assert.equal(result.data,"正文测试<br>第二行");
result=flow.execute("https://api-bc.wtzw.com/chapterId=345141&id=151581");
assert.equal(result.ok,true,result.error);
result=flow.execute("invalid");
assert.equal(result.ok,false);assert.match(result.error,/chapterId/);
flow=boot("chap.js",()=>api({content:""}));
result=flow.execute("chapterId=345141&id=151581");
assert.equal(result.ok,false);assert.match(result.error,/nội dung/);

for(const file of ["config.js","gen.js","search.js","detail.js","toc.js","chap.js"])
    assert.doesNotMatch(fs.readFileSync(path.join(dir,file),"utf8"),/\.parent\s*\(|\.remove\s*\(/);
console.log("PASS Qimao v6: updated listing, pagination, WebView fallback, search, numeric and URL IDs, metadata, TOC, AES chapter, error paths.");
