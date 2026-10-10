// 69Shuba: the TOC title is correct, but the chapter page repeats a title
// inside the HTML body. Preserve actual prose while removing the duplicate.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "..", "shuba69", "src", "chap.js"), "utf8");
const url = "https://www.69shuba.com/txt/90442/41051911";
const heading = "第568章 566：任意门";
function collection(items) {
    return {size: () => items.length, first: () => items[0] || null,
            get: i => items[i] || null};
}
function element(text, html) {
    return {text: () => text || "", html: () => html || "", attr: () => ""};
}
function run(body, pageTitle=heading) {
    const root = element(body.replace(/<[^>]*>/g, " "), body);
    const doc = {
        select: q => {
            if (q === ".txtnav") return collection([root]);
            if (q === ".txtnav h1, h1") return collection([element(pageTitle, "")]);
            if (q === "title") return collection([element("正常章节", "")]);
            return collection([]);
        }
    };
    let requests = 0;
    const ctx = {
        fetch: () => {requests++; return {ok: true, status: 200, html: () => doc};},
        Response: {success: value => ({ok: true, value}),
                   error: error => ({ok: false, error})}
    };
    vm.runInNewContext(script, ctx, {filename:"chap.js"});
    const result = ctx.execute(url);
    assert.equal(result.ok, true, result.error);
    return {html: result.value, requests};
}
function verify(body, present, absent) {
    const result = run(body);
    assert.match(result.html, present);
    if (absent) assert.doesNotMatch(result.html, absent);
    assert.equal(result.requests, 1, "Normal chapter should be fetched once");
}

// Actual website pattern: title in H1 then duplicated as first paragraph.
verify('<h1>' + heading + '</h1><div class="txtinfo hide720">Author</div>' +
       '<div id="txt"><p>　　' + heading + '</p><p>“咦？”</p><p>希恩有些意外。</p></div>',
       /希恩有些意外/, /第568章/);
// Same heading in a raw text node before a BR, encoded full-width spaces.
verify('<h1>' + heading + '</h1><div id="txt">&#12288;&#12288;' + heading +
       '<br><br>“咦？”<br>希恩有些意外。</div>', /希恩有些意外/, /第568章/);
// A mojibake version of the duplicated heading still starts with the same number.
verify('<h1>' + heading + '</h1><div id="txt"><p>绗568绔犲 566 锛 乱码</p>' +
       '<p>希恩有些意外。</p></div>', /希恩有些意外/, /绗568/);
// Do not throw away the first real prose paragraph.
verify('<h1>' + heading + '</h1><p>希恩有些意外。</p><p>哈利惊喜地招呼。</p>',
       /希恩有些意外/, /<h1/);
// A real sentence containing current chapter number is not a repeated heading.
verify('<h1>' + heading + '</h1><p>第568章的战斗令人不寒而栗。</p>' +
       '<p>哈利赶忙追了上去。</p>', /第568章的战斗/, /<h1/);
// A paragraph with the previous chapter number is not stripped.
verify('<h1>' + heading + '</h1><p>第567章的谜团还没有解决。</p>',
       /第567章的谜团/, /<h1/);
console.log("PASS 69Shuba v9: duplicate chapter title removed, real prose preserved");
