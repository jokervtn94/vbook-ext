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
console.log('PASS Vbook mock regression: ManhuaVN 2 public images and locked chapter blocked.');
