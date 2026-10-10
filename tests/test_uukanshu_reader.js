const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const HOST="https://uukanshu.cc";
const DOC="https://uukanshu.cc/book/25044/";
function list(arr){
  return {size:()=>arr.length,first:()=>arr[0],get:i=>arr[i]};
}
function link(href,name){
  return {attr:()=>href,text:()=>name};
}
function reader(html){
  return {html:()=>html,select:()=>({remove:()=>{}})};
}
function run(file,doc,url,status=200){
  const script=fs.readFileSync(path.join(__dirname,'..','uukanshu','src',file),'utf8');
  const requests=[];
  const box={
    fetch:u=>{requests.push(u);return {ok:status===200,status,html:()=>doc};},
    Response:{success:value=>({ok:true,value}),error:error=>({ok:false,error})}
  };
  vm.runInNewContext(script,box,{filename:file});
  return {res:box.execute(url),requests};
}
// Catalog links on different deployments can be absolute, root-relative or numeric-relative.
// All variants must result in the same canonical chapter URL; non-chapter links are ignored.
const links=[
  link('/book/25044/16039379.html','第1章 歸零'),
  link('16039380.html','第2章 親戚'),
  link('https://uukanshu.cc/book/25044/16039381.html','第3章 石中火'),
  link('/book/25044/16039379.html','第1章 歸零'),
  link('/book/12345/16039382.html','Wrong book'),
  link('/book/25044/','書籍詳情')
];
const tocDoc={select:s=>list(
 s==="#list-chapterAll a, dl.book.chapterlist a, .chapterlist dd a"?links:[]
)};
let toc=run('toc.js',tocDoc,DOC);
assert.equal(toc.res.ok,true,toc.res.error);
assert.equal(toc.res.value.length,3);
assert.equal(toc.res.value[0].url,DOC+'16039379.html');
assert.equal(toc.res.value[1].url,DOC+'16039380.html');
assert.equal(toc.res.value[2].url,DOC+'16039381.html');
let fallback=run('toc.js',{select:s=>list(s===".chapterlist a, #list a"?links:[])},DOC);
assert.equal(fallback.res.value.length,3);
let contentDoc={select:s=>list(s===".read .readcontent, .read .readcotent, div.readcotent, #contentbox"?
 [reader('<p>洛城，秋。</p><p>這是一個漫長的故事。</p>')]:[])};
let chapter=run('chap.js',contentDoc,DOC+'16039379.html');
assert.equal(chapter.res.ok,true,chapter.res.error);
assert.match(chapter.res.value,/洛城，秋/);
let shortDoc={select:s=>list(s===".readcontent, #chaptercontent, #content, .chapter-content"?
 [reader('<p>完。</p>')]:[])};
assert.equal(run('chap.js',shortDoc,DOC+'16039379.html').res.ok,true);
let emptyDoc={select:s=>list(s===".read .readcontent, .read .readcotent, div.readcotent, #contentbox"?
 [reader('<p></p>')]:[])};
assert.equal(run('chap.js',emptyDoc,DOC+'16039379.html').res.ok,false);
console.log('PASS: UUKanShu canonical TOC links, deduplication, chapter extraction and short chapters');
