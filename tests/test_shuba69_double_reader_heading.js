// Screenshot regression: the VBook reader heading is correct, but the chapter
// body contains two extra headings, first as ��1418�� and then 第1418章.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const script = fs.readFileSync(path.join(__dirname, "..", "shuba69", "src", "chap.js"), "utf8");
const url = "https://www.69shuba.com/txt/29590/25167832";
const actualTitle = "第1418章 不想这么多";
function coll(nodes) {
  return {size: () => nodes.length, first: () => nodes[0] || null,
          get: i => nodes[i] || null};
}
function elm(text, html) {
  return {text: () => text || "", html: () => html || "", attr: () => ""};
}
function execute(html, title=actualTitle) {
  const root = elm(html.replace(/<[^>]+>/g, " "), html);
  const page = {
    select: query => {
      if (query === ".txtnav") return coll([root]);
      if (query === ".txtnav h1, h1") return coll([elm(title)]);
      if (query === "title") return coll([elm(title)]);
      return coll([]);
    }
  };
  let fetches = 0;
  const sandbox = {
    fetch: () => {
      fetches++;
      return {ok: true, status: 200, html: () => page};
    },
    Response: {
      success: value => ({ok: true, value}),
      error: error => ({ok: false, error})
    }
  };
  vm.runInNewContext(script, sandbox, {filename: "chap.js"});
  return {result: sandbox.execute(url), fetches};
}
function chapter(body, title=actualTitle) {
  const o=execute(body,title);
  assert.equal(o.result.ok, true, o.result.error);
  return o.result.value;
}
const screenshot = [
  '<h1>��1418��</h1>',
  '<h2>��1418�� �� 錯誤</h2>',
  '<p>第1418章 不想这么多</p>',
  '<p>牧尘把这件事暂时搁置，回到不死火山福地。</p>',
  '<p>看着眼前熟悉的一切，牧尘安心了。</p>'
].join("");
const repaired = chapter(screenshot);
assert.doesNotMatch(repaired, /�|第1418章|錯誤/);
assert.match(repaired, /牧尘把这件事暂时搁置/);
assert.match(repaired, /看着眼前熟悉的一切/);
assert.doesNotMatch(repaired, /<h1/);

// Both titles may be separated by BRs or actual line breaks, without <p>.
let read = chapter('<div id="txt">&#12288;��1418�� ��' +
                   '<br><br>&#12288;第1418章 不想这么多<br>' +
                   '牧尘把这件事暂时搁置。</div>');
assert.doesNotMatch(read, /�|第1418章/);
assert.match(read, /牧尘把这件事暂时搁置/);

// And another chapter's original heading need not have the 第X章 format.
const proper = chapter('<p>1417.新书已发</p><p>新书已发，《长夜余火》</p>', "1417.新书已发");
assert.doesNotMatch(proper, /1417.新书已发/);
assert.match(proper, /新书已发，《长夜余火》/);

// Do not erase story prose that mentions the current chapter number.
read = chapter('<p>第1418章的事情先不说了。</p><p>牧尘继续修炼。</p>');
assert.match(read, /第1418章的事情先不说了/);
assert.match(read, /牧尘继续修炼/);
// Do not remove a heading from a different chapter; do not search beyond prose.
read = chapter('<p>��1419��</p><p>第1418章 不想这么多</p><p>牧尘继续修炼。</p>');
assert.match(read, /��1419��/);
assert.match(read, /第1418章 不想这么多/);
read = chapter('<p>牧尘刚刚回家。</p><p>第1418章 不想这么多</p>');
assert.match(read, /牧尘刚刚回家/);
assert.match(read, /第1418章 不想这么多/);

console.log("PASS: 69Shuba v11 double (garbled and readable) chapter headings removed, prose retained");
