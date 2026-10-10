// Regression coverage for chapter pages with different actual encodings.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "..", "shuba69", "src", "chap.js"), "utf8");
const url = "https://www.69shuba.com/txt/90442/41051911";

function elements(items) {
  return {size: () => items.length, first: () => items[0] || null,
          get: index => items[index] || null};
}
function element(text, html) {
  return {text: () => text || "", html: () => html || "", attr: () => ""};
}
function document(title, body) {
  const root = element(title + " " + body, "<h1>" + title + "</h1><p>" + body + "</p>");
  return {
    select: query => {
      if (query === ".txtnav") return elements([root]);
      if (query === ".txtnav h1, h1") return elements([element(title, "")]);
      return elements([]);
    }
  };
}
function run(pages) {
  const calls = [];
  let count = 0;
  const ctx = {
    fetch: () => {
      const responseIndex = count++;
      const page = pages[Math.min(responseIndex, pages.length - 1)];
      let parsed = false;
      return {
        ok: true, status: 200,
        html: charset => {
          // Each response must be decoded only once, matching VBook's
          // potential one-shot response semantics.
          assert.equal(parsed, false, "Cannot decode one response twice");
          parsed = true;
          calls.push(charset);
          return page;
        }
      };
    },
    Response: {
      success: value => ({ok: true, value}),
      error: error => ({ok: false, error})
    }
  };
  vm.runInNewContext(script, ctx, {filename: "chap.js"});
  return {result: ctx.execute(url), calls};
}

// Modern source page contains UTF-8 bytes even when its HTML declares GBK.
const modernTitle = "第568章 566：任意门";
const modern = document(modernTitle, "希恩穿过任意门，哈利赶忙追了上去。");
let actual = run([modern, document("绗568绔", "鍙戝緟")]);
assert.equal(actual.result.ok, true, actual.result.error);
assert.deepEqual(actual.calls, ["utf-8"], "Valid UTF-8 needs only one HTTP request");
assert.match(actual.result.value, /希恩穿过任意门/);

// Real legacy GBK page: UTF-8 interpretation contains replacement characters.
const corruptUtf8 = document("第568章 � � �", "希恩� �，哈利� �。");
const legacyGbk = document(modernTitle, "哈利打开了火弩箭的包装。");
actual = run([corruptUtf8, legacyGbk]);
assert.equal(actual.result.ok, true, actual.result.error);
assert.deepEqual(actual.calls, ["utf-8", "gbk"], "Only damaged UTF-8 retries GBK");
assert.match(actual.result.value, /哈利打开了火弩箭/);
assert.doesNotMatch(actual.result.value, /�/);

// Ordinary Han characters that previously triggered false positives are valid.
const validRareHan = document("第1417章 新书已发", "涓涓细流经过河谷，浣熊伏在岸边。");
actual = run([validRareHan, corruptUtf8]);
assert.deepEqual(actual.calls, ["utf-8"]);
assert.match(actual.result.value, /涓涓细流经过河谷/);

// Alternative charset fails or is an anti-bot page: preserve the content instead
// of presenting a verification message as if it were a chapter.
const challenge = document("Access denied", "Please verify you are human");
actual = run([corruptUtf8, challenge]);
assert.equal(actual.result.ok, true, actual.result.error);
assert.deepEqual(actual.calls, ["utf-8", "gbk"]);
assert.doesNotMatch(actual.result.value, /Please verify/);

// If UTF-8 decoding throws, a new request may still decode legacy GBK.
let fetchCount = 0;
const ctx = {
  fetch: () => {
    const index = fetchCount++;
    return {ok: true, status: 200, html: charset => {
      if (index === 0) {assert.equal(charset, "utf-8"); throw Error("Malformed UTF-8");}
      assert.equal(charset, "gbk"); return legacyGbk;
    }};
  },
  Response: {success: value => ({ok: true, value}), error: error => ({ok: false, error})}
};
vm.runInNewContext(script, ctx, {filename: "chap.js"});
const recovered = ctx.execute(url);
assert.equal(recovered.ok, true, recovered.error);
assert.equal(fetchCount, 2);
assert.match(recovered.value, /火弩箭/);

console.log("PASS 69Shuba v10: UTF-8 first, GBK fallback per chapter, no false positives, one-shot HTTP response");
