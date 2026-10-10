const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..', 'dingdian', 'src');
const DD='https://www.dingdian666.com';
function col(data) {
  return {size:()=>data.length,first:()=>data[0]||empty,get:i=>data[i],
    forEach:fn=>data.forEach(fn),attr:k=>data[0]?.attr(k)||'',
    text:()=>data.map(e=>e.text()).join(''),html:()=>data[0]?.html()||''};
}
const empty = {attr:()=>'',text:()=>'',html:()=>'',select:()=>col([])};
function el(attrs={},txt='',html='',selectors={}) {
  return {attr:key=>attrs[key]||'',text:()=>txt,html:()=>html,
    select:key=>col(selectors[key]||[])};
}
function doc(map={}) {return {select:s=>col(map[s]||[])};}
function boot(file,fetcher) {
  const context=vm.createContext({Http:{get:fetcher},Object,Response:{
    success:(value,next)=>({ok:true,value,next}),
    error:message=>({ok:false,error:message})
  }});
  context.load = name => vm.runInContext(fs.readFileSync(path.join(base,name),'utf8'),context,{filename:name});
  vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
  return context.execute;
}
const bookId='537816',imageId='152799';
const bookUrl=DD+'/xiaoshuo/'+bookId+'/';
const imageUrl=DD+'/files/article/image/152/'+imageId+'/'+imageId+'s.jpg';
const docA=doc({
  '.border_left a img':[el({src:'/files/article/image/152/'+imageId+'/'+imageId+'s.jpg'})],
  'meta[property=og:novel:book_name]':[el({content:'洄天'})],
  'meta[property=og:novel:author]':[el({content:'淮上'})],
  '.hang_1':[el({},'','状态：连载中')],
  '.hang_3':[el({},'简介')]
});
let calls=[];
function get(url) {
  calls.push(url);
  if(url===bookUrl)return {html:()=>docA};
  if(url===DD+'/sort/3_1/')return {html:()=>listingDoc};
  throw new Error('Unexpected URL '+url);
}
let result=boot('detail.js',get)(bookUrl);
assert.equal(result.ok,true,result.error);
assert.equal(result.value.cover,imageUrl);
assert.equal(result.value.name,'洄天');
assert.equal(result.value.author,'淮上');
assert.notEqual(imageId,bookId,'Cover ID must not be invented from book ID');
result=boot('detail.js',get)('https://m.dingdian666.com/ebooks/537816/');
assert.equal(result.value.cover,imageUrl);
const row=el({},'','',{'.name a':[el({href:'/xiaoshuo/537816/'},'洄天')],'.zuo':[el({},'淮上')]});
const listingDoc=doc({'.lastupdate ul li':[row]});
calls=[];
result=boot('gen.js',get)('3','1');
assert.equal(result.ok,true,result.error);
assert.equal(result.value.length,1);
assert.equal(result.value[0].cover,imageUrl);
assert.equal(result.value[0].link,bookUrl);
assert.deepEqual(calls,[DD+'/sort/3_1/',bookUrl]);
const ogDoc=doc({
  "meta[property='og:image']":[el({content:'https://dingdian666.com/files/article/image/7/7899/7899s.jpg'})],
  'meta[property=og:novel:book_name]':[el({content:'书名'})],
  'meta[property=og:novel:author]':[el({content:'作者'})]
});
result=boot('detail.js',url=>({html:()=>ogDoc}))(bookUrl);
assert.equal(result.ok,true,result.error);
assert.equal(result.value.cover,DD+'/files/article/image/7/7899/7899s.jpg');
const brokenDoc=doc({
  '.border_left a img':[el({src:'/files/article/image/000.jpg'})],
  'meta[property=og:novel:book_name]':[el({content:'A'})]
});
result=boot('detail.js',url=>({html:()=>brokenDoc}))(bookUrl);
assert.equal(result.value.cover,'','Never use default placeholder as a real cover');
let i=0;
result=boot('gen.js',url=>{
  if(url===DD+'/sort/1_1/')return {html:()=>listingDoc};
  i++;throw new Error('Cover page unreachable');
})('1','1');
assert.equal(result.ok,true,'Cover fetch failures must not break lists');
assert.equal(result.value.length,1);
assert.equal(result.value[0].cover,'');
assert.equal(i,1);
console.log('PASS Dingdian covers: actual image ID, listing detail lookup, mobile URL, OG fallback, placeholders, fetch errors');
