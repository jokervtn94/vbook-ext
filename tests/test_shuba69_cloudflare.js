const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const chapterUrl = 'https://www.69shuba.com/txt/29590/25167831';
const chapter = '<div>新书已发，《长夜余火》，大家可以去看了~</div><br>(本章完)';

function node(html, text='') {
  return {html:()=>html,text:()=>text};
}
function collection(nodes) {
  return {size:()=>nodes.length,first:()=>nodes[0],get:i=>nodes[i]};
}
function makeDocument(opts={}) {
  return {
    select(key) {
      if (key==='.txtnav') return collection(opts.chapter ? [node(opts.chapter)] : []);
      if (key==='title') return collection([node('',opts.title||'')]);
      if (key==='#challenge-form, .cf-turnstile, #cf-challenge-running')
        return collection(opts.challenge ? [node('')] : []);
      return collection([]);
    }
  };
}
function run(status, httpDoc, browserDoc, settings={}) {
  let opens=0, closes=0, urls=[];
  const context={
    fetch(url) {urls.push(url);return {
      ok:status===200,status,html:()=>httpDoc
    }},
    Response: {
      success:data=>({ok:true,data}),
      error:message=>({ok:false,error:message})
    }
  };
  if (settings.withBrowser !== false) {
    context.Engine={newBrowser:()=>({
      launch(url,timeout) {
        opens++;urls.push(url);
        assert.equal(timeout,12000);
        if (settings.throwOnLaunch) throw new Error('Headless WebView unavailable');
        return browserDoc;
      },
      html:()=>browserDoc,
      close:()=>{closes++;}
    })};
  }
  const source=fs.readFileSync(path.join(__dirname,'..','shuba69','src','chap.js'),'utf8');
  assert.doesNotMatch(source,/\.parent\s*\(|\.remove\s*\(/,'Unsupported DOM mutation');
  vm.runInNewContext(source,context,{filename:'chap.js'});
  return {output:context.execute(chapterUrl),opens,closes,urls};
}
const real=makeDocument({chapter});
const cf=makeDocument({challenge:true,title:'Just a moment...'});
let result=run(200,real,cf);
assert.equal(result.output.ok,true);
assert.equal(result.opens,0,'Skip WebView when fetch content is available');
assert.match(result.output.data,/长夜余火/);
result=run(403,null,real);
assert.equal(result.output.ok,true,'Fallback to legitimate WebView if HTTP 403');
assert.equal(result.opens,1);
assert.equal(result.closes,1);
result=run(200,cf,real);
assert.equal(result.output.ok,true,'Fallback for a 200 Cloudflare challenge');
assert.equal(result.closes,1);
result=run(403,null,cf);
assert.equal(result.output.ok,false);
assert.match(result.output.error,/Cloudflare/);
assert.match(result.output.error,/trình duyệt bên trong Vbook/);
assert.equal(result.closes,1);
result=run(403,null,null,{throwOnLaunch:true});
assert.equal(result.output.ok,false);
assert.equal(result.closes,1,'Browser must close after failures');
result=run(403,null,cf,{withBrowser:false});
assert.equal(result.output.ok,false,'Give manual verification instructions without WebView');
assert.match(result.output.error,/Cloudflare/);
result=run(504,null,real);
assert.equal(result.output.ok,false);
assert.match(result.output.error,/HTTP 504/);
assert.equal(result.opens,0);
console.log('PASS: 69Shuba Cloudflare WebView fallback and user-verification guidance');
