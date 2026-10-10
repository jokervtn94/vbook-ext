const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','qimao','src','detail.js'),'utf8');
function run(data,status=200){
 const calls=[],ctx={
  load:()=>{},
  CryptoJS:{MD5:x=>'sign_'+x.length},
  fetch:(url,options)=>{calls.push({url,options});return {ok:status===200,status,json:()=>data};},
  Response:{success:v=>({ok:true,data:v}),error:v=>({ok:false,error:v})}
 };
 vm.runInNewContext(source,ctx);
 return {out:ctx.execute('https://www.qimao.com/shuku/151581/'),calls};
}
let r=run({data:{book:{
 title:'示例书名',author_uid:'48712',author:'姑苏小七',
 thumb_image_link:'https://cdn.qimao.com/cover.jpg',
 intro:'内容',latest_chapter_title:'第三千四百九十八章',is_over:0
},author_info:{name:'姑苏小七'}}});
assert.equal(r.out.ok,true,r.out.error);
assert.equal(r.out.data.author,'姑苏小七');
assert.notEqual(r.out.data.author,'48712');
assert.equal(r.out.data.ongoing,true);
assert.match(r.calls[0].url,/id=151581/);
r=run({data:{book:{title:'Book',author_uid:'123',is_over:1},author_info:{name:'Author'}}});
assert.equal(r.out.ok,true);
assert.equal(r.out.data.author,'Author');
assert.equal(r.out.data.ongoing,false);
r=run({data:{}});
assert.equal(r.out.ok,false);
r=run({data:{}},403);
assert.equal(r.out.ok,false);
assert.match(r.out.error,/403/);
console.log('PASS Qimao actual author name, 2026 live API schema, and error handling');
