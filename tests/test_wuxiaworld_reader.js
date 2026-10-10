const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.join(__dirname,'..','wuxiaworld','src');
function coll(a){return {size:()=>a.length,first:()=>a[0]||{text:()=>'',html:()=>'',attr:()=>''},get:i=>a[i],text:()=>a.map(x=>x.text?.()||'').join(' '),attr:k=>(a[0]?.attr?.(k)||'')};}
function node(text='',attrs={},html=''){return {text:()=>text,attr:key=>attrs[key]||'',html:()=>html,select:()=>({remove:()=>{}})}}
function boot(file,fetcher,engine){
  const sandbox={fetch:fetcher,Response:{success:x=>({ok:true,data:x}),error:x=>({ok:false,error:x})},Engine:engine};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
  return sandbox.execute;
}
const item={name:'Coiling Dragon',authorName:{value:'I Eat Tomatoes'},coverUrl:{value:'https://cdn.wuxiaworld.com/cd.webp'},
 synopsis:{value:'A novel synopsis'},status:'Completed',genres:['Fantasy']};
const state={queries:[{queryKey:['novel','coiling-dragon',null],state:{data:{item}}}]};
const hydrated='<html><script>window.__REACT_QUERY_STATE__ = '+JSON.stringify(state)+';</script></html>';
const detailDoc={select:key=>coll(key==='h1'?[node('Coiling Dragon')]:key==='meta[property="og:image"]'?[node('',{content:'https://cdn.wuxiaworld.com/cd.webp'})]:[])};
let detail=boot('detail.js',()=>({ok:true,html:()=>detailDoc,text:()=>hydrated}))('https://www.wuxiaworld.com/novel/coiling-dragon');
assert.equal(detail.ok,true,detail.error);
assert.equal(detail.data.name,'Coiling Dragon');
assert.equal(detail.data.author,'I Eat Tomatoes');
assert.equal(detail.data.ongoing,false);
const content='<div><p>Linley walked to the courtyard.</p></div>';
const chapterDoc={select:key=>coll(key==='.chapter-content .fr-view'?[node('',{},content)]:[])};
let chap=boot('chap.js',()=>({ok:true,html:()=>chapterDoc}))('https://www.wuxiaworld.com/novel/coiling-dragon/cd-book-1-chapter-1');
assert.equal(chap.ok,true,chap.error);assert.match(chap.data,/Linley/);
const api={result:true,items:[{name:'Coiling Dragon',slug:'coiling-dragon',coverUrl:'https://cdn.wuxiaworld.com/cd.webp',chapterCount:807}]};
let requests=[];
const apiFetch=(url,opt)=>{requests.push({url,opt});return {ok:true,json:()=>api}};
let list=boot('gen.js',apiFetch)('https://www.wuxiaworld.com/api/novels/search','1');
assert.equal(list.ok,true,list.error);
assert.equal(list.data.length,1);assert.equal(list.data[0].link,'https://www.wuxiaworld.com/novel/coiling-dragon');
assert.equal(requests[0].opt.method,'POST');
let found=boot('search.js',apiFetch)('dragon');
assert.equal(found.ok,true);assert.equal(found.data.length,1);assert.equal(requests[1].opt.queries.query,'dragon');
const incompleteDoc={select:key=>coll(key==='body'?[node('807 Chapters')]:key.includes('a[href*=')?[node('Start Reading',{href:'/novel/coiling-dragon/cd-book-1-chapter-1'})]:[])};
let toc=boot('toc.js',()=>({ok:true,html:()=>incompleteDoc}))('https://www.wuxiaworld.com/novel/coiling-dragon');
assert.equal(toc.ok,false,'TOC must not pretend 1/807 chapters is complete');
assert.match(toc.error,/1\/807/);
console.log('PASS: WuxiaWorld current SSR metadata, chapters, API search and incomplete TOC guard');
