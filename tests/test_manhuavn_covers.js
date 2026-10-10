const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
function executeWith(scriptName, fetcher, params) {
    const context = vm.createContext({
        fetch: fetcher, encodeURIComponent,
        Response: { success: (data,next) => ({data,next}), error: message=>({error:message}) }
    });
    context.load = function(filename) {
        vm.runInContext(fs.readFileSync(path.join(root,'manhuavn/src',filename),'utf8'),context);
    };
    const source=fs.readFileSync(path.join(root,'manhuavn/src',scriptName),'utf8');
    vm.runInContext(source,context);
    return context.execute.apply(null,params);
}
const sample = { Id:'123abc', StoryName:'Ví dụ truyện',
    StoryImage:'dai-quan-gia-la-ma-hoang.jpg',
    StoryTitleLastChap:'Chapter 99' };
const websiteHost = 'https://admin.manhuavn2.com/Pictures/Truyen/Large/';
const fetchApi = url => ({
    ok:true,
    json:()=>({success:true,data:{list:[sample]}})
});
const home=executeWith('gen.js',fetchApi,['2','1']);
assert.strictEqual(home.data.length,1);
assert.strictEqual(home.data[0].cover,websiteHost+'dai-quan-gia-la-ma-hoang.jpg');
assert.strictEqual(home.data[0].host,'https://manhuavn2.com');
assert.strictEqual(home.data[0].next,undefined);
const genre=executeWith('source.js',fetchApi,['abc','1']);
assert.strictEqual(genre.data.length,1);
assert.strictEqual(genre.data[0].cover,home.data[0].cover);
assert.ok(!genre.data[0].cover.includes('/Large//'));
assert.strictEqual(genre.data[0].host,'https://manhuavn2.com');

const coverNodes = [{
    select:s=>{
        if (s==='a[href$="-0.html"]') return {first:()=>({attr:k=>k==='href'?'/dai-quan-gia-la-ma-hoang-0.html':'',text:()=>''})};
        if (s==='img[data-original]') return {first:()=>({attr:k=>k==='data-original'?websiteHost+'dai-quan-gia-la-ma-hoang.jpg':k==='alt'?'Đại Quản Gia Là Ma Hoàng':''})};
        throw Error('Invalid selector '+s);
    }
}];
const fallbackFetch = url => {
    if (url.includes('/api/newstory/')) return {ok:false};
    return {ok:true,html:()=>({select:s=>{
        if(s==='li.item') return {forEach:callback=>coverNodes.forEach(callback)};
        throw Error('Unknown selector '+s);
    }})};
};
const fallback=executeWith('gen.js',fallbackFetch,['2','1']);
assert.strictEqual(fallback.data.length,1);
assert.strictEqual(fallback.data[0].cover,websiteHost+'dai-quan-gia-la-ma-hoang.jpg');
assert.strictEqual(fallback.data[0].name,'Đại Quản Gia Là Ma Hoàng');

const manifest = JSON.parse(fs.readFileSync(path.join(root,'manhuavn/plugin.json')));
assert.strictEqual(manifest.metadata.version,5);
console.log('PASS ManhuaVN v5 cover regressions: API listing, genre listing, web lazy image fallback, host and URL normalization.');