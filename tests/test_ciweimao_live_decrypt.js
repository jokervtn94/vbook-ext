// End-to-end CiWeiMao public-chapter decrypt test. Requires an ephemeral
// encrypted fixture created by tools/probe_ciweimao_chapter.py on the same runner.
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const fixture="/tmp/vbook-ciweimao-live.json";
if(!fs.existsSync(fixture)) {
    console.log("SKIP real CiWeiMao decryption: public API was unavailable");
    process.exit(0);
}
const data=JSON.parse(fs.readFileSync(fixture,"utf8"));
const root=path.join(__dirname,"..","ciweimao","src");
const context=vm.createContext({
    fetch:(url,options)=>({
        ok:true,
        status:200,
        json:()=>url.includes("ajax_get_session_code")?data.session:data.chapter
    }),
    Response:{
        success:value=>({ok:true,value}),
        error:error=>({ok:false,error})
    }
});
context.load=name=>vm.runInContext(
    fs.readFileSync(path.join(root,name),"utf8"),context,{filename:name});
vm.runInContext(fs.readFileSync(path.join(root,"chap.js"),"utf8"),context,{filename:"chap.js"});
const result=context.execute("https://www.ciweimao.com/chapter/111827220");
assert.equal(result.ok,true,result.error);
assert.ok(result.value.length>120,"Decrypted chapter unexpectedly short");
assert.match(result.value,/[\u3400-\u9fff]/,"Expected Chinese content from free chapter");
assert.doesNotMatch(result.value,/chapter_content|encryt_keys/);
console.log("PASS LIVE CiWeiMao: decrypted genuine free-chapter payload; "+
            result.value.length+" HTML characters, no content printed");
