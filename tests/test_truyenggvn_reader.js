const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),folder='truyenggvn';
function collection(items) {return {size:()=>items.length,first:()=>items[0]||null,get:i=>items[i],forEach:f=>items.forEach(f),text:()=>items.map(x=>x.text()).join(' ')};}
function node(attrs={},txt='',html='',children={}) {return {attr:k=>attrs[k]||'',text:()=>txt,html:()=>html,select:k=>collection(children[k]||[])};}
function doc(map={}) {return {select:selector=>collection(map[selector]||[])};}
const book='https://truyenggvn.com/truyen-tranh/dai-quan-gia-la-ma-hoang-7015';
const chapter=book+'-chap-0.html';
const chapter2=book+'-chap-1.html';
function boot(file,fetcher,browser) {
  const context={fetch:fetcher,Response:{success:(data,next)=>({ok:true,data,next}),error:error=>({ok:false,error})},
    Engine:browser,encodeURIComponent,console};
  const sandbox=vm.createContext(context);
  sandbox.load=function(name){vm.runInContext(fs.readFileSync(path.join(root,folder,'src',name),'utf8'),sandbox,{filename:name});};
  vm.runInContext(fs.readFileSync(path.join(root,folder,'src',file),'utf8'),sandbox,{filename:file});
  return sandbox.execute;
}
const img=node({'data-original':'//hinhtruyen.com/abc/0.jpg','src':'data:image/gif;base64,placeholder'});
const detailDoc=doc({
  'h1[itemprop=name]':[node({},'Đại Quản Gia Là Ma Hoàng')],
  '.thumbblock img':[node({'src':'//i.hinhhinh.com/cover.jpg'})],
  'p:contains(Tác Giả) + p':[node({},'Dạ Kiêu')],
  '.story-detail-info':[node({},'Tình trạng Đang Cập Nhật','<p>Giới thiệu truyện</p>')]
});
const chapterDoc=doc({'.content_detail img':[img,node({'src':'https://hinhtruyen.com/abc/1.jpg'}),img]});
const tocDoc=doc({".list_chap a[href*='-chap-']":[node({href:chapter2},'Chương 1'),node({href:chapter},'Chương 0')]});
const anchor=node({href:'/truyen-tranh/dai-quan-gia-la-ma-hoang-7015'},'Đại Quản Gia Là Ma Hoàng');
const card=node({},'', '',{
    "a.book_name, .title a, h3 a, a[href*='/truyen-tranh/']":[anchor],
    "img":[node({'data-src':'//i.hinhhinh.com/cover.jpg'})],
    ".chapter":[node({},'Chương 1')]
});
const listingDoc=doc({
    '.list_item_home .item_home':[card],
    '.pagination a.active + a[href]':[node({href:'/truyen-moi-cap-nhat/trang-2.html'},'2')]
});
const cfDoc=doc({'title':[node({},'Just a moment...')]});
let run=boot('home.js',()=>({ok:true,status:200,html:()=>listingDoc}));
assert.equal(run().data.length,7);
run=boot('gen.js',u=>({ok:true,status:200,html:()=>listingDoc}));
let list=run('https://truyenggvn.com/truyen-moi-cap-nhat.html','1');
assert.equal(list.ok,true,list.error);assert.equal(list.data[0].link,book);assert.equal(list.next,'2');
assert.equal(list.data[0].cover,'https://i.hinhhinh.com/cover.jpg');
run=boot('search.js',u=>({ok:true,status:200,html:()=>listingDoc}));
assert.equal(run('ma hoàng','1').data.length,1);
run=boot('detail.js',u=>({ok:true,status:200,html:()=>detailDoc}));
let detail=run(book);assert.equal(detail.ok,true,detail.error);assert.equal(detail.data.name,'Đại Quản Gia Là Ma Hoàng');assert.equal(detail.data.author,'Dạ Kiêu');
run=boot('toc.js',u=>({ok:true,status:200,html:()=>tocDoc}));
let toc=run(book);assert.equal(toc.ok,true,toc.error);assert.equal(toc.data[0].url,chapter);assert.equal(toc.data[1].url,chapter2);
run=boot('chap.js',u=>({ok:true,status:200,html:()=>chapterDoc}));
let chap=run(chapter);assert.equal(chap.ok,true,chap.error);assert.equal(chap.data.length,2);assert.equal(chap.data[0],'https://hinhtruyen.com/abc/0.jpg');
run=boot('chap.js',u=>({ok:false,status:403,html:()=>cfDoc}),undefined);
let challenge=run(chapter);assert.equal(challenge.ok,false);assert.match(challenge.error,/Cloudflare/);
let closes=0;
run=boot('chap.js',u=>({ok:false,status:403,html:()=>cfDoc}),{newBrowser:()=>({
  launch:()=>chapterDoc,html:()=>chapterDoc,close:()=>{closes++;}
})});
chap=run(chapter);assert.equal(chap.ok,true,chap.error);assert.equal(chap.data.length,2);assert.equal(closes,1);
run=boot('chap.js',u=>({ok:false,status:403,html:()=>cfDoc}),{newBrowser:()=>({
  launch:()=>cfDoc,html:()=>cfDoc,close:()=>{closes++;}
})});
challenge=run(chapter);assert.equal(challenge.ok,false);assert.match(challenge.error,/Cloudflare/);assert.equal(closes,2);
for(const file of ['config.js','gen.js','search.js','detail.js','toc.js','chap.js','genre.js']) {
  const source=fs.readFileSync(path.join(root,folder,'src',file),'utf8');
  assert.doesNotMatch(source,/\.parent\s*\(|\.remove\s*\(/);
}
console.log('PASS TruyenGGVN: home, listing, pagination, search, detail, TOC, comic image lazy loading, Cloudflare, WebView.');
