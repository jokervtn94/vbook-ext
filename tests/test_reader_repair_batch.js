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
assert.equal(catalog.data.length,19, 'Catalog must only publish Vietnamese and Chinese sources');
assert.ok(catalog.data.some(item=>item.path.includes('/shuba69/plugin.zip')));
assert.ok(catalog.data.some(item=>item.path.includes('/uukanshu/plugin.zip')));
assert.ok(!catalog.data.some(item=>item.path.includes('/manhwahentai/')));
console.log('PASS repair tests: SachHay links/TOC/full chapter; BookQQ; Tencent covers; Tiên Vực last page; 19 active sources.');
