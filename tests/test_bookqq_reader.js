const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function run(file,url,payload,status=200){
 const src=fs.readFileSync(path.join(__dirname,'..','bookqq','src',file),'utf8');
 const requests=[];
 const sandbox={load:()=>{},Fock:{unlock:content=>'decoded:'+content},
   fetch:(uri,options)=>{requests.push({uri,options});return {ok:status===200,status,json:()=>payload};},
   Response:{success:value=>({ok:true,value}),error:error=>({ok:false,error})}};
 vm.runInNewContext(src,sandbox,{filename:file});
 return {result:sandbox.execute(url),requests};
}
const book='https://ubook.reader.qq.com/book-detail/39103283';
let toc=run('toc.js',book,{data:[
 {cid:5,free:1,chapterName:'One'},{cid:6,free:0,chapterName:'Two'},
 {cid:5,free:1,chapterName:'Duplicate'}]});
assert.equal(toc.result.ok,true,toc.result.error);
assert.equal(toc.requests[0].options.queries.bid,'39103283');
assert.equal(toc.result.value.length,2);
assert.equal(toc.result.value[0].url,'https://book.qq.com/book-read/39103283/5');
assert.match(toc.result.value[1].name,/VIP/);
let c=run('chap.js','https://book.qq.com/book-read/38504732/5',{data:{chapterPrice:0,content:'Hello'}});
assert.equal(c.result.ok,true,c.result.error);
assert.equal(c.requests[0].options.queries.bid,'38504732');
assert.equal(c.requests[0].options.queries.cid,'5');
assert.match(c.result.value,/decoded:Hello/);
c=run('chap.js',book+'/5',{data:{chapterPrice:0,content:'Hello'}});
assert.equal(c.requests[0].options.queries.bid,'39103283');
assert.equal(c.requests[0].options.queries.cid,'5');
c=run('chap.js','https://book.qq.com/book-read/38504732/6',{data:{chapterPrice:2,content:'premium'}});
assert.equal(c.result.ok,true);
assert.match(c.result.value,/VIP/);
assert.doesNotMatch(c.result.value,/premium/);
c=run('chap.js','https://book.qq.com/book-read/38504732/7',{data:{chapterPrice:0,content:''}});
assert.equal(c.result.ok,false);
c=run('chap.js','https://book.qq.com/book-read/38504732/7',{},403);
assert.equal(c.result.ok,false);
assert.match(c.result.error,/403/);
c=run('chap.js','https://book.qq.com/book-read/38504732',{data:{}});
assert.equal(c.result.ok,false);
assert.equal(c.requests.length,0);
c=run('chap.js','https://book.qq.com/book-read/38504732/5',{
 code:-3001,msg:'书籍已下架',data:null
});
assert.equal(c.result.ok,false);
assert.match(c.result.error,/书籍已下架/);
const removedToc=run('toc.js',book,{code:-3001,msg:'书籍已下架'});
assert.equal(removedToc.result.ok,false);
assert.match(removedToc.result.error,/书籍已下架/);
console.log('PASS Book QQ ID parsing, valid chapter URLs, API errors, free and VIP handling');
