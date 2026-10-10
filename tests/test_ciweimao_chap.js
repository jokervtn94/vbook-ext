const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"..","ciweimao","src","chap.js"),"utf8");
const CHAPTER="https://www.ciweimao.com/chapter/111827220";
const LOCKED="https://www.ciweimao.com/chapter/111827221/vip";
function run(session,chapter,config={}){
 const calls=[];
 const ctx={
    load:()=>{},
    CryptoJS:{format:{OpenSSL:{parse:s=>s}},enc:{Base64:{parse:s=>s},Utf8:"Utf8"},
      AES:{decrypt:()=>({toString:encoding=>encoding==="Utf8"?"中文章节内容":"dGVzdA=="})}},
    base64:()=>({decode:s=>Buffer.from("1234567890abcdef"+"payload","ascii").toString("ascii"),encode:s=>s}),
    fetch:(url,opt)=>{
      calls.push({url,opt});
      const first=url.includes("ajax_get_session_code");
      const res=first?session:chapter;
      return {ok:(res.status||200)===200,status:res.status||200,json:()=>res.body};
    },
    Response:{success:value=>({ok:true,value}),error:error=>({ok:false,error})},
    Array,Buffer
 };
 vm.runInNewContext(source,ctx,{filename:"chap.js"});
 return {result:ctx.execute(config.vip?LOCKED:CHAPTER),calls};
}
let r=run({body:{chapter_access_key:"abcd"}},{body:{chapter_content:"abc",encryt_keys:null}});
assert.equal(r.result.ok,false);
assert.match(r.result.error,/encryt_keys/);
assert.equal(r.calls.length,2);
r=run({body:{data:{chapter_access_key:"abcd"}}},{body:{data:{chapter_content:"abc",encryt_keys:["keyA","keyB"]}}});
assert.equal(r.result.ok,true,r.result.error);
assert.match(r.result.value,/中文章节内容/);
r=run({body:{chapter_access_key:"abcd"}},{body:{chapter_content:"abc",encrypt_keys:["keyA","keyB"]}});
assert.equal(r.result.ok,true,r.result.error);
r=run({status:403},{body:{}});
assert.equal(r.result.ok,false);
assert.match(r.result.error,/403/);
assert.equal(r.calls.length,1);
r=run({body:{code:403,msg:"验证码错误"}},{body:{}});
assert.equal(r.result.ok,false);
assert.match(r.result.error,/验证码错误/);
assert.equal(r.calls.length,1);
r=run({body:{}},{body:{}},{vip:true});
assert.equal(r.result.ok,false);
assert.match(r.result.error,/VIP/);
assert.equal(r.calls.length,0);
r=run({body:{chapter_access_key:"abcd"}},{body:{code:403,msg:"需要验证",data:{}}});
assert.equal(r.result.ok,false);
assert.match(r.result.error,/需要验证/);
console.log("PASS CiWeiMao missing keys, nested API, free chapter, HTTP 403, verification and VIP guards");
