const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const page=fs.readFileSync("/tmp/vbook_ww_page.html","utf8");
const response=fs.readFileSync("/tmp/vbook_ww_grpc.txt","utf8");
const src=fs.readFileSync("wuxiaworld/src/toc.js","utf8");
const calls=[];
const context={
  fetch:(url,options)=>{
    calls.push({url,options});
    if(!options){
      assert.equal(url,"https://www.wuxiaworld.com/novel/coiling-dragon");
      return {ok:true,text:()=>page};
    }
    assert.equal(url,"https://api2.wuxiaworld.com/wuxiaworld.api.v2.Chapters/GetChapterList");
    assert.equal(options.method,"POST");
    assert.equal(options.headers["Content-Type"],"application/grpc-web-text");
    const req=Buffer.from(options.body,"base64");
    assert.equal(req[0],0);
    assert.equal(req[5],8);
    assert.equal(req[6],6);
    return {ok:true,text:()=>response};
  },
  Response:{success:data=>({ok:true,data}),error:error=>({ok:false,error})},
  decodeURIComponent
};
vm.runInNewContext(src,context,{filename:"wuxiaworld/src/toc.js"});
const out=context.execute("https://www.wuxiaworld.com/novel/coiling-dragon");
assert.equal(out.ok,true,out.error);
assert.equal(out.data.length,807,"Live Coiling Dragon chapter total");
assert.equal(calls.length,2,"Only page + one catalog gRPC-Web request");
assert.equal(new Set(out.data.map(x=>x.url)).size,out.data.length,"No duplicate chapters");
assert.ok(out.data.every(x=>x.name && x.url.startsWith("https://www.wuxiaworld.com/novel/coiling-dragon/")));
assert.ok(out.data[0].url.endsWith("/cd-book-1-chapter-1"));
console.log("PASS LIVE WuxiaWorld: "+out.data.length+" chapters from 21 groups with one gRPC-Web request");
