// Regression: 69Shuba chapter titles are correct in the TOC but previously
// became garbled during chapter fetch due to false-positive charset switching.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const chapterURL = "https://www.69shuba.com/txt/90442/41051911";
const script = fs.readFileSync(path.join(__dirname, "..", "shuba69", "src", "chap.js"), "utf8");

function col(items) {
  return {size: () => items.length, first: () => items[0] || null, get: i => items[i] || null};
}
function el(text, html) {
  return {text: () => text || "", html: () => html || "", attr: () => ""};
}
function doc(title, text, body) {
  const root = el(text, "<h1>" + title + "</h1><p>" + body + "</p>");
  return {
    select: key => {
      if (key === ".txtnav") return col([root]);
      if (key === ".txtnav h1, h1") return col([el(title, "")]);
      return col([]);
    }
  };
}
function execute(responses) {
  const requests = [];
  const sandbox = {
    fetch: url => {
      requests.push(url);
      const candidate = responses[requests.length - 1] || responses[responses.length - 1];
      return {
        ok: true, status: 200,
        html: charset => {
          assert.equal(charset, requests.length === 1 ? "gbk" : "utf-8");
          return candidate;
        }
      };
    },
    Response: {
      success: value => ({ok: true, value}),
      error: error => ({ok: false, error})
    }
  };
  vm.runInNewContext(script, sandbox, {filename: "chap.js"});
  return {result: sandbox.execute(chapterURL), requests};
}

const correctTitle = "第568章 566：任意门";
const genuineHan = doc(correctTitle, correctTitle + " 涓涓细流 浣熊 璇字 濡养 锛", 
                       "涓涓细流穿过森林。海面上微风阵阵，巫师开始练习。");
const wrongUtf8 = doc("Ã¤Â¸Â‹ ...", "Please verify that you are human", "Please verify");
let case1 = execute([genuineHan, wrongUtf8]);
assert.equal(case1.result.ok, true, case1.result.error);
assert.match(case1.result.value, /涓涓细流穿过森林/);
assert.equal(case1.requests.length, 1, "Valid Chinese must not trigger a charset retry");
assert.doesNotMatch(case1.result.value, /�/);

const broken = doc("第568章 � � � �", "第568章 � � � � 文本�", "错误�内容�");
const goodUtf8 = doc(correctTitle, correctTitle, "希恩穿过任意门，和哈利一起返回学校。");
const case2 = execute([broken, goodUtf8]);
assert.equal(case2.result.ok, true, case2.result.error);
assert.equal(case2.requests.length, 2, "Refetch with UTF-8 only for proven corruption");
assert.match(case2.result.value, /希恩穿过任意门/);
assert.doesNotMatch(case2.result.value, /�/);

const challenge = doc("Access Denied", "Please verify you are human", "Please verify");
const case3 = execute([broken, challenge]);
assert.equal(case3.result.ok, true, case3.result.error);
assert.equal(case3.requests.length, 2);
assert.doesNotMatch(case3.result.value, /Please verify/, "Never replace chapter with a challenge page");

assert.doesNotMatch(script, /var marks = text\.match/, "Old false positive detection was removed");
console.log("PASS 69Shuba v8: valid chapter Han text stays GBK; genuinely broken chapter title retries UTF-8; challenge cannot win");
