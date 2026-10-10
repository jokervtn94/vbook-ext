const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
function boot(folder,file,fetcher) {
  const context=vm.createContext({
    fetch:fetcher,Response:{
      success:(value,next)=>({kind:'success',value,next}),
      error:msg=>({kind:'error',message:msg})
    },encodeURIComponent,decodeURIComponent,console
  });
  context.load=function(name) {
    vm.runInContext(fs.readFileSync(path.join(root,folder,'src',name),'utf8'),context);
  };
  vm.runInContext(fs.readFileSync(path.join(root,folder,'src',file),'utf8'),context);
  return context.execute;
}
function els(data){
  return {
    forEach:fn=>data.forEach(fn),
    first:()=>data[0]||{attr:()=>'',text:()=>'',select:()=>els([])},
    last:()=>data[data.length-1]||{attr:()=>'',text:()=>''},
    size:()=>data.length
  };
}
function attr(o) {
  return {attr:k=>o[k]||'',text:()=>o.text||'',
    select:sel=>{
      if(sel==='img[src]')return els([{attr:k=>k==='src'?o.cover:''}]);
      if(sel==='img')return els([{attr:k=>o[k]||o['data-original']||''}]);
      return els([]);
    }};
}
const omegaUrl='https://omegascans.org/series/love-quest';
const omegaDoc={
  select:sel=>{
    if(sel==='a[href^="/series/"]')return els([
      attr({href:'/series/love-quest',cover:'https://media.omegascans.org/real-cover.webp',text:'Love Quest'}),
      attr({href:'/series/love-quest/chapter-1',cover:'https://media.omegascans.org/chapter.png'}),
      attr({href:'/series/love-quest',cover:'https://media.omegascans.org/real-cover.webp'})
    ]);
    if(sel==='.space-y-2 .flex')return {text:()=> 'Release year 2026 Total chapters 37 Author QRQ'};
    if(sel==='h1')return els([attr({text:'Love Quest'})]);
    if(sel==='.gap-y-2 img')return els([{attr:()=> '/_next/image?url=https%3A%2F%2Fmedia.omegascans.org%2Fcover.webp&w=640&q=75'}]);
    if(sel==='.space-y-2 .flex:contains(Author) span')return els([attr({text:'QRQ'})]);
    if(sel==='meta[name=description]')return {attr:()=> 'Synopsis'};
    if(sel==='img[data-fallback-index][src]')return els([
      {attr:()=> 'https://media.omegascans.org/chap/01.jpg'},
      {attr:()=> 'https://media.omegascans.org/chap/02.jpg'}
    ]);
    throw Error('Unexpected Omega CSS '+sel);
  }
};
function omegaFetch(url){
  assert.ok([omegaUrl,omegaUrl+'/chapter-1','https://omegascans.org/'].includes(url),url);
  return {ok:true,html:()=>omegaDoc};
}
const omegaGen=boot('omegascans','gen.js',omegaFetch);
const ol=omegaGen('home','1');
assert.equal(ol.kind,'success'); assert.equal(ol.value.length,1);
assert.equal(ol.value[0].cover,'https://media.omegascans.org/real-cover.webp');
assert.equal(omegaGen('home','2').value.length,0);
const omegaDetail=boot('omegascans','detail.js',omegaFetch)(omegaUrl);
assert.equal(omegaDetail.value.cover,'https://media.omegascans.org/cover.webp');
const omegaToc=boot('omegascans','toc.js',omegaFetch)(omegaUrl);
assert.equal(omegaToc.value.length,37);
assert.equal(omegaToc.value[36].url,omegaUrl+'/chapter-37');
const omegaChap=boot('omegascans','chap.js',omegaFetch)(omegaUrl+'/chapter-1');
assert.equal(omegaChap.value.length,2);

const bookUrl='https://www.sachhayonline.com/tua-sach/ai-tinh-mieu';
const chapterUrl=bookUrl+'/chuong-1/601';
function bookDoc() {
  return {select:sel=>{
    if(sel==='ul.default > li')return els([{select:css=>els([
      attr({href:bookUrl,text:'Ái tình miếu'})
    ]),text:()=> 'Ái tình miếu'}]);
    if(sel==='ul.default li a[href]')return els([attr({href:chapterUrl,text:'Chương 1'})]);
    if(sel==='.chapter-content .reading-white p')return els([
      {html:()=>'<b>Đoạn thứ nhất</b>'},{html:()=> 'Đoạn thứ hai'}
    ]);
    throw Error('Unexpected SachHay CSS '+sel);
  }};
}
const bookFetch=()=>({ok:true,html:bookDoc});
const sachGen=boot('sachhayonline','gen.js',bookFetch)(bookUrl);
assert.equal(sachGen.value[0].link,bookUrl);
const sachToc=boot('sachhayonline','toc.js',bookFetch)(bookUrl);
assert.equal(sachToc.value[0].url,chapterUrl);
const sachChap=boot('sachhayonline','chap.js',bookFetch)(chapterUrl);
assert.ok(sachChap.value.includes('Đoạn thứ nhất'));
assert.ok(sachChap.value.includes('Đoạn thứ hai'));

const tFetch=()=>({ok:true,json:()=>({totalDocs:10,docs:[
 {name:'Test',slug:'test',cover:{domain:'https://cdn',url:'cover.jpg'},author:{name:'A'},vip:false}
]})});
const tienvuc=boot('tienvuc','gen.js',tFetch)('sample','1');
assert.equal(tienvuc.kind,'success');
assert.equal(tienvuc.next,null, 'Do not crash at exact last page');

const qqToc=boot('bookqq','toc.js',()=>({
  ok:true,json:()=>({data:[
   {free:1,chapterName:'One',cid:'11'},
   {free:0,chapterName:'Two',cid:'12'}
  ]})
}))('https://book.qq.com/book-detail/123');
assert.equal(qqToc.value.length,2);
assert.ok(qqToc.value[0].name.includes('【Free】'));
assert.ok(qqToc.value[1].name.includes('【VIP】'));
const acPage={
 select:s=>{
   if(s==='a.mod-cover-list-thumb[href]')return els([attr({href:'/Comic/comicInfo/id/531490',title:'一人之下','data-original':'https://manhua.acimg.cn/cover.jpg'})]);
   throw Error(s);
 }
};
const acGen=boot('acqq','gen.js',()=>({ok:true,html:()=>acPage}))('https://ac.qq.com/Comic/all','1');
assert.equal(acGen.value.length,1);
assert.equal(acGen.value[0].cover,'https://manhua.acimg.cn/cover.jpg');
assert.equal(acGen.value[0].link,'https://ac.qq.com/Comic/comicInfo/id/531490');

const catalog=JSON.parse(fs.readFileSync(path.join(root,'plugin.json'),'utf8'));
assert.equal(catalog.data.length,23, 'Published catalog should include 69Shuba and UUKanShu');
assert.ok(catalog.data.some(item=>item.path.includes('/shuba69/plugin.zip')));
assert.ok(catalog.data.some(item=>item.path.includes('/uukanshu/plugin.zip')));
assert.ok(!catalog.data.some(item=>item.path.includes('/manhwahentai/')));
console.log('PASS repair tests: Omega list/detail/TOC/images; SachHay links/TOC/full chapter; BookQQ; Tencent covers; Tiên Vực last page.');
