const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'..','truyenqqko','src');
const story='https://truyenqqko.com/truyen-tranh/hoa-son-tai-khoi-12345',chap=story+'-chap-1',chap2=story+'-chap-2';
function nodes(a){return {size:()=>a.length,first:()=>a[0]||null,get:i=>a[i],forEach:f=>a.forEach(f)};}
function el(attrs={},txt='',html='',children={}){return {attr:k=>attrs[k]||'',text:()=>txt,html:()=>html,select:k=>nodes(children[k]||[])};}
function page(map={}){return {select:k=>nodes(map[k]||[])};}
function run(name,fetcher,browser){
  const globals={fetch:fetcher,Engine:browser,encodeURIComponent,Response:{
    success:(data,next)=>({ok:true,data,next}),error:error=>({ok:false,error})}};
  const cx=vm.createContext(globals);
  cx.load=file=>vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),cx,{filename:file});
  vm.runInContext(fs.readFileSync(path.join(dir,name),'utf8'),cx,{filename:name});
  return cx.execute;
}
const cover=el({'data-original':'//cdn.truyenqqko.com/cover.png'});
const anchor=el({href:'/truyen-tranh/hoa-son-tai-khoi-12345',title:'Hoa Sơn Tái Khởi'},'Hoa Sơn Tái Khởi');
const card=el({},'','',{'.book_name a[href]':[anchor],'.book_avatar img':[cover],'.chapter':[el({},'Chương 2')]});
const listing=page({'ul.list_grid.grid > li':[card],'.pagination li.active + li a[href]':[el({href:'/doc-truyen/trang-2'},'2')]});
const detail=page({'h1.title-detail':[el({},'Hoa Sơn Tái Khởi')],
 "meta[property='og:image']":[el({content:'//cdn.truyenqqko.com/cover.png'})],
 'li.author p:last-child':[el({},'Tác giả mẫu')],
 '.story-detail-info.detail-content':[el({},'','<p>Giới thiệu</p>')],
 'li.status p:last-child':[el({},'Đang cập nhật')]});
const toc=page({'.works-chapter-item a[href]':[el({href:chap2},'Chương 2'),el({href:chap},'Chương 1')]});
const images=page({'div.page-chapter[id^=page_] img':[
 el({'data-original':'//cdn.truyenqqko.com/001.jpg','src':'data:image/gif;base64,test'}),
 el({'data-cdn':'https://cdn.truyenqqko.com/002.jpg'}),
 el({'data-original':'//cdn.truyenqqko.com/001.jpg'})]});
const ok=x=>({ok:true,status:200,html:()=>x});
let output=run('home.js',()=>ok(listing))();
assert.equal(output.ok,true);assert.equal(output.data.length,2);
output=run('gen.js',url=>{assert.match(url,/\/doc-truyen$/);return ok(listing);})(undefined,'1');
assert.equal(output.ok,true,output.error);assert.equal(output.data.length,1);assert.equal(output.next,'2');
assert.equal(output.data[0].link,story);assert.equal(output.data[0].cover,'https://cdn.truyenqqko.com/cover.png');
output=run('gen.js',url=>{assert.match(url,/\/truyen-hoan-thanh\/trang-2\?status=2$/);return ok(listing);})('https://truyenqqko.com/truyen-hoan-thanh','2');
assert.equal(output.ok,true,output.error);
let request=null;
output=run('search.js',(url,opts)=>{request={url,opts};return ok(listing);})('Hoa Sơn','1');
assert.equal(output.ok,true,output.error);assert.equal(output.data.length,1);
assert.equal(request.url,'https://truyenqqko.com/frontend/search/search');
assert.equal(request.opts.method,'POST');assert.match(request.opts.body,/search=Hoa%20S%C6%A1n/);
output=run('detail.js',()=>ok(detail))(story);
assert.equal(output.ok,true,output.error);assert.equal(output.data.name,'Hoa Sơn Tái Khởi');
assert.equal(output.data.author,'Tác giả mẫu');
output=run('toc.js',()=>ok(toc))(story);
assert.equal(output.ok,true,output.error);assert.equal(output.data.length,2);assert.equal(output.data[0].url,chap);
output=run('chap.js',()=>ok(images))(chap);
assert.equal(output.ok,true,output.error);assert.equal(output.data.length,2);
assert.equal(output.data[0],'https://cdn.truyenqqko.com/001.jpg');
output=run('chap.js',()=>({ok:false,status:403}),undefined)(chap);
assert.equal(output.ok,false);assert.match(output.error,/Cloudflare/);
let closed=0;
let browser={newBrowser:()=>({launch:()=>images,html:()=>images,close:()=>{closed++;}})};
output=run('chap.js',()=>({ok:false,status:403}),browser)(chap);
assert.equal(output.ok,true,output.error);assert.equal(closed,1);
const cf=page({'title':[el({},'Just a moment...')]});
browser={newBrowser:()=>({launch:()=>cf,html:()=>cf,close:()=>{closed++;}})};
output=run('chap.js',()=>({ok:false,status:403}),browser)(chap);
assert.equal(output.ok,false);assert.match(output.error,/Cloudflare/);assert.equal(closed,2);
for(const f of ['config.js','listing.js','gen.js','search.js','detail.js','toc.js','chap.js','genre.js'])
  assert.doesNotMatch(fs.readFileSync(path.join(dir,f),'utf8'),/\.parent\s*\(|\.remove\s*\(/);
console.log('PASS TruyenQQKO: catalog, AJAX search, metadata, TOC order, images, Cloudflare and WebView');
