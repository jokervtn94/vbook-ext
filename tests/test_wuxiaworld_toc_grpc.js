const assert=require("node:assert/strict");
const fs=require("node:fs"), vm=require("node:vm"), path=require("node:path");
const file=path.join(__dirname,"..","wuxiaworld","src","toc.js");
const code=fs.readFileSync(file,"utf8");
const varint=n=>{let o=[];do{let b=n%128;n=Math.floor(n/128);o.push(b+(n?128:0));}while(n);return o;};
const field=(id,buf)=>[(id<<3)|2,...varint(buf.length),...buf];
const vint=(id,n)=>[(id<<3),...varint(n)];
const utf8=text=>Array.from(Buffer.from(text,"utf8"));
function chapter(slug,name,i){
 return [...vint(1,i),...field(2,utf8(name)),...field(3,utf8(slug))];
}
function group(id,order,items){
 let bytes=[...vint(1,id),...field(2,utf8("Book "+order)),...vint(3,order)];
 for(let i=0;i<items.length;i++)bytes.push(...field(6,chapter(items[i][0],items[i][1],100+i)));
 return bytes;
}
const packet=groups=>{
 let bytes=[];for(const g of groups)bytes.push(...field(1,group(g.id,g.order,g.items)));
 const length=bytes.length;
 return Buffer.from([0,length>>>24&255,length>>>16&255,length>>>8&255,length&255,...bytes]).toString("base64");
};
function run(meta,groups,status=200) {
 let calls=[];
 const item={id:6,chapterInfo:{
   chapterCount:{value:meta.reduce((n,g)=>n+g.count,0)},
   chapterGroups:meta.map(g=>({id:g.id,order:g.order,counts:{total:g.count}}))
 }};
 const page='<html><script>window.__REACT_QUERY_STATE__ = '+
   JSON.stringify({queries:[{queryKey:["novel","coiling-dragon",null],state:{data:{item}}}]})+
   ';</script></html>';
 const context={
   fetch:(url,opts)=>{
     calls.push({url,opts});
     if(!opts)return {ok:true,text:()=>page};
     return {ok:status===200,status,text:()=>packet(groups)};
   },
   Response:{success:value=>({ok:true,value}),error:error=>({ok:false,error})},
   decodeURIComponent
 };
 vm.runInNewContext(code,context,{filename:"toc.js"});
 return {result:context.execute("https://www.wuxiaworld.com/novel/coiling-dragon"),calls};
}
const metadata=[{id:318,order:1,count:1},{id:319,order:2,count:2}];
let a=run(metadata,[
 {id:319,order:2,items:[["chapter-2","Chapter 2 – Café"],["chapter-3","Chapter 3"]]},
 {id:318,order:1,items:[["chapter-1","Chapter 1"]]}
]);
assert.equal(a.result.ok,true,a.result.error);
assert.equal(a.result.value.length,3);
assert.equal(a.result.value[0].name,"Chapter 1");
assert.equal(a.result.value[1].name,"Chapter 2 – Café");
assert.equal(a.result.value[2].url,"https://www.wuxiaworld.com/novel/coiling-dragon/chapter-3");
assert.equal(a.calls.length,2);
assert.equal(a.calls[1].url,"https://api2.wuxiaworld.com/wuxiaworld.api.v2.Chapters/GetChapterList");
assert.equal(a.calls[1].opts.headers["Content-Type"],"application/grpc-web-text");
const request=Buffer.from(a.calls[1].opts.body,"base64");
assert.equal(request[0],0);
assert.equal(request[5],8);
assert.equal(request[6],6);
a=run(metadata,[{id:318,order:1,items:[["chapter-1","Chapter 1"]]}]);
assert.equal(a.result.ok,false);
assert.match(a.result.error,/thiếu nhóm/);
a=run(metadata,[{id:318,order:1,items:[["chapter-1","Chapter 1"]]},
{ id:319,order:2,items:[["chapter-2","Chapter 2"]]}]);
assert.equal(a.result.ok,false);
assert.match(a.result.error,/thiếu chương/);
a=run(metadata,[],403);
assert.equal(a.result.ok,false);assert.match(a.result.error,/403/);
const counts=[23,25,26,21,17,32,25,59,50,48,39,40,45,31,42,32,64,32,64,48,44];
const ids=[318,319,320,321,322,323,324,325,327,326,328,329,330,331,332,333,334,335,336,337,338];
let number=0;
const meta=counts.map((count,i)=>({id:ids[i],order:i+1,count}));
const volumes=meta.map(g=>({id:g.id,order:g.order,
  items:Array.from({length:g.count},()=>{number++;return ["chapter-"+number,"Chapter "+number];})}));
assert.equal(number,807);
const full=run(meta,volumes);
assert.equal(full.result.ok,true,full.result.error);
assert.equal(full.result.value.length,807);
assert.equal(full.result.value[0].name,"Chapter 1");
assert.equal(full.result.value[806].name,"Chapter 807");
assert.equal(full.calls.length,2,"807 chapters require exactly one chapter-list RPC");
console.log("PASS WuxiaWorld protobuf/gRPC-Web: 21 volumes, 807 chapters, UTF-8, order, incomplete/errors");
