// Minimal Vbook runtime contracts. This tests control flow, not DOM parsing.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

function run(file, globals) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const context = { JSON, Array, Number, String, encodeURIComponent, ...globals };
  vm.runInNewContext(code, context, { filename: file });
  return context.execute;
}

function responses() {
  return {
    success: value => ({ kind: 'success', value }),
    error: message => ({ kind: 'error', message })
  };
}
const slug = 'example-novel';
const title = 'https://novelbuddy.me/' + slug;
const manga = {
  id: 'EXAMPLE123',
  stats: { chaptersCount: 285 },
  chapters: Array.from({length: 50}, (_, i) => ({name:'Chapter '+(285-i),number:285-i,url:'/'+slug+'/chapter-'+(285-i)}))
};
const payload = {
  props: {
    pageProps: {
      initialManga: manga,
      siteConfig: { apiUrl:'https://api.novelbuddy.me' }
    }
  }
};
const html = '<html><script id="__NEXT_DATA__" type="application/json">' +
  JSON.stringify(payload) + '</script></html>';
const apiChapters = Array.from({length: 285}, (_, i) => ({
  number: 285-i, name:'Chapter '+(285-i), url:'/'+slug+'/chapter-'+(285-i)
}));
function novelFetch(apiWorks=true) {
  return url => {
    if (url === title) return {ok:true,text:()=>html};
    if (url === 'https://api.novelbuddy.me/titles/EXAMPLE123/chapters') {
      return {ok:apiWorks,json:()=>({success:true,data:{chapters:apiChapters}})};
    }
    throw Error('Unexpected URL '+url);
  };
}
const toc = run('novelbuddy/src/toc.js', {fetch:novelFetch(), Response:responses()});
const result = toc(title);
assert.strictEqual(result.kind, 'success');
assert.strictEqual(result.value.length, 285);
assert.strictEqual(result.value[0].name, 'Chapter 1');
assert.strictEqual(result.value[284].name, 'Chapter 285');
const tocOffline=run('novelbuddy/src/toc.js', {fetch:novelFetch(false), Response:responses()});
assert.strictEqual(tocOffline(title).kind,'error', 'Do not silently present 50/285 chapters');

function nodeImage(src) { return {attr:k=>k==='data-original'?src:''}; }
const freeDoc = {
  select(selector) {
    if (selector==='#chapcontent .vip-lock') return {size:()=>0};
    if (selector==='#chapcontent .page-chapter img[data-original]') {
      return {forEach:fn=>[nodeImage('//cdn.example/chapter-1.webp'),nodeImage('/images/2.jpg'),nodeImage('/images/loading.gif')].forEach(fn)};
    }
    throw Error('Unexpected selector '+selector);
  }
};
const lockedDoc = {
  select(selector) {
    if (selector==='#chapcontent .vip-lock') return {size:()=>1};
    throw Error('Cannot read locked content: '+selector);
  }
};
const chap = run('manhuavn/src/chap.js', {
  load:()=>{},
  BASE_URL:'https://manhuavn2.com',
  BASE_API:'https://mhvn.truyensieuhay.com',
  Response:responses(),
  fetch:url=> {
    if (url.endsWith('chapter-1.html')) return {ok:true,html:()=>freeDoc};
    if (url.endsWith('chapter-915.html')) return {ok:true,html:()=>lockedDoc};
    throw Error('Unexpected URL '+url);
  }
});
const publicChapter = chap('https://manhuavn2.com/doc-truyen/example-chapter-1.html');
assert.strictEqual(publicChapter.kind,'success');
assert.strictEqual(publicChapter.value.length,2);
assert.strictEqual(publicChapter.value[0],'https://cdn.example/chapter-1.webp');
assert.strictEqual(publicChapter.value[1],'https://manhuavn2.com/images/2.jpg');
const protectedChapter = chap('https://manhuavn2.com/doc-truyen/example-chapter-915.html');
assert.strictEqual(protectedChapter.kind,'error');
console.log('PASS Vbook mock regression: 285 chapters; incomplete API rejected; 2 public images; app-only locked.');
