const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// No parent method intentionally: Vbook's HtmlElement API does not expose it.
function collection(items) {
  return {size:()=>items.length, get:i=>items[i], first:()=>items[0],
    text:()=>items.map(x=>x.text()).join(' ')};
}
function element(attrs, value, sub={}) {
  return {attr:key=>attrs[key]||'', text:()=>value,
    select:key=>collection(sub[key]||[])};
}
const a=element({href:'https://www.69shuba.com/book/29590.htm'},'诡秘之主');
const img=element({src:'//cdn.cdnshu.com/files/article/image/29/29590/29590s.jpg'},'');
const author=element({},'爱潜水的乌贼');
const card=element({},'',{
  "h3 a[href*='/book/'], h4 a[href*='/book/'], a[href*='/book/']":[a],
  img:[img], '.intro, .desc, .author, .update, p':[author]
});
function documentMock() {
  return {select:key=>{
    if(key==='.bookbox, .newbox ul li, .mybox li, .booklist li')return collection([card]);
    if(key.startsWith("h3 a[href*='/book/']"))return collection([a]);
    if(key.startsWith(".newbox ul li h3 a,"))return collection([a]);
    return collection([]);
  }};
}
for(const file of ['gen.js','search.js']) {
  const script=fs.readFileSync(path.join(__dirname,'..','shuba69','src',file),'utf8');
  assert.doesNotMatch(script,/\.parent\s*\(/,'Unsupported API in '+file);
  const sandbox={
    fetch:()=>({ok:true,html:documentMock}),
    Response:{success:(items,next)=>({items,next}),error:error=>({error})},
    encodeURIComponent
  };
  vm.runInNewContext(script,sandbox,{filename:file});
  const output=sandbox.execute(file==='gen.js'?'0':'诡秘之主','1');
  assert.equal(output.error,undefined,output.error);
  assert.equal(output.items.length,1);
  assert.equal(output.items[0].name,'诡秘之主');
  assert.equal(output.items[0].link,'https://www.69shuba.com/book/29590.htm');
  assert.equal(output.items[0].cover,
    'https://cdn.cdnshu.com/files/article/image/29/29590/29590s.jpg');
  assert.equal(output.items[0].description,'爱潜水的乌贼');
}
console.log('PASS: 69Shuba Vbook listing/search regression');
