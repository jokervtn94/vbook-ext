// Vbook HtmlElement regression: absent optional HTML nodes must never crash.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function element(attrs, text, html) {
  return {
    attr: name => attrs[name] || "",
    text: () => text || "",
    html: () => html || ""
  };
}
function collection(items) {
  return {
    size: () => items.length,
    first: () => items[0] || null,
    get: i => items[i],
    text: () => items.map(x => x.text()).join(" ")
  };
}
function mockDoc(map) {
  return {select: query => collection(map[query] || [])};
}
function invoke(script, url, doc, code=200) {
  const source = fs.readFileSync(path.join(__dirname,"..","shuba69","src",script),"utf8");
  assert.doesNotMatch(source, /\.parent\s*\(|\.remove\s*\(/);
  const urls = [];
  const globals = {
    fetch: u => { urls.push(u); return {ok:code===200, status:code, html:()=>doc}; },
    Response: {success: value => ({ok:true,value}),error: error => ({ok:false,error})}
  };
  vm.runInNewContext(source, globals, {filename:script});
  return {result:globals.execute(url),urls};
}
const bookUrl = "https://www.69shuba.com/book/29590.htm";
const bookMeta = mockDoc({
  "meta[property='og:novel:book_name']":[element({content:"诡秘之主"})],
  "meta[property='og:novel:author']":[element({content:"爱潜水的乌贼"})],
  "meta[property='og:description']":[element({content:"蒸汽与机械的浪潮中，谁能触及非凡？"})],
  "meta[property='og:image']":[element({content:"//cdn.cdnshu.com/files/article/image/29/29590/29590s.jpg"})],
  "meta[property='og:novel:status']":[element({content:"全本"})],
  "meta[property='og:novel:category']":[element({content:"玄幻魔法"})]
});
let info = invoke("detail.js",bookUrl,bookMeta);
assert.equal(info.result.ok,true,info.result.error);
assert.equal(info.result.value.name,"诡秘之主");
assert.equal(info.result.value.author,"爱潜水的乌贼");
assert.equal(info.result.value.ongoing,false);
assert.equal(info.result.value.cover,"https://cdn.cdnshu.com/files/article/image/29/29590/29590s.jpg");
assert.equal(info.urls[0],bookUrl);
// Only meta tags available: no booknav2, h1, or navtxt. Must not invoke .text() on null.
let blocked = invoke("detail.js",bookUrl,mockDoc({}),403);
assert.equal(blocked.result.ok,false);
assert.match(blocked.result.error,/403/);
const tocUrl = "https://www.69shuba.com/book/29590/";
const urls=[
  element({href:"/txt/29590/25167831"},"1417.新书已发"),
  element({href:"/txt/29590/25167830"},"1416.不是诈尸"),
  element({href:"/txt/29590/25167829"},"1415.日常")
];
let list = invoke("toc.js",bookUrl,mockDoc({"#catalog li a[href*='/txt/'], #catalog ul li a":urls}));
assert.equal(list.result.ok,true,list.result.error);
assert.equal(list.urls[0],tocUrl);
assert.equal(list.result.value.length,3);
assert.equal(list.result.value[0].name,"1415.日常");
assert.equal(list.result.value[2].url,"https://www.69shuba.com/txt/29590/25167831");
const contentHtml='<h1 class="hide720">1417.新书已发</h1>' +
  '<div class="txtinfo hide720">2021-02-21 作者</div>' +
  '<div class="contentadv">Advertisement</div>' +
  '<div>新书已发，《长夜余火》，大家可以去看了~</div><br>(本章完)';
let chapter=invoke("chap.js","https://www.69shuba.com/txt/29590/25167831",
  mockDoc({".txtnav":[element({},"",contentHtml)]}));
assert.equal(chapter.result.ok,true,chapter.result.error);
assert.match(chapter.result.value,/长夜余火/);
assert.doesNotMatch(chapter.result.value,/Advertisement|<h1/);
let shortChapter=invoke("chap.js","https://www.69shuba.com/txt/29590/25167831",
  mockDoc({".txtnav":[element({},"","<p>终。</p>")]}));
assert.equal(shortChapter.result.ok,true,"Short chapter should not be rejected");
console.log("PASS: 69Shuba v3 detail, TOC order, chapter body and short-chapter regressions");
