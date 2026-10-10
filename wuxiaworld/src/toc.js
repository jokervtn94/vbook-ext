function execute(url) {
    var host = "https://www.wuxiaworld.com";
    var match = String(url).match(/\/novel\/([^/?#]+)/);
    if (!match) return Response.error("WuxiaWorld: URL truyện không hợp lệ");
    var slug = match[1];
    function read(doc) {
        var nodes = doc.select("ul.list-chapters a, .chapter-item a, a[href*='/novel/" + slug + "/']");
        var list = [], seen = {};
        for (var i = 0; i < nodes.size(); i++) {
            var a = nodes.get(i), href = String(a.attr("href") || "");
            var m = href.match(new RegExp("/novel/" + slug + "/([^/?#]+)"));
            if (!m) continue;
            var full = host + "/novel/" + slug + "/" + m[1];
            if (seen[full]) continue;
            seen[full] = true;
            var name = String(a.text() || "").trim();
            if (!name) name = m[1].replace(/-/g, " ");
            list.push({name: name, url: full, host: host});
        }
        return list;
    }
    var expected = 0, result = [];
    try {
        var response = fetch(host + "/novel/" + slug);
        if (!response.ok) return Response.error("WuxiaWorld mục lục HTTP " + response.status);
        var doc = response.html();
        var body = doc.select("body").text();
        var total = String(body || "").match(/(\d{1,5})\s+Chapters\b/i);
        if (total) expected = parseInt(total[1], 10);
        result = read(doc);
        if ((!expected || result.length < expected) &&
            typeof Engine !== "undefined" && Engine.newBrowser) {
            var browser = null;
            try {
                browser = Engine.newBrowser();
                browser.launch(host + "/novel/" + slug, 12000);
                browser.callJs(
                    "(function(){var b=Array.from(document.querySelectorAll('button')).filter(" +
                    "function(el){return (el.textContent||'').trim()==='Chapters';})[0];" +
                    "if(b){b.click();return 'clicked';}return 'missing';})()", 600);
                var rendered = browser.html(2200);
                var extra = read(rendered);
                if (extra.length > result.length) result = extra;
            } catch (ignored) {
            } finally {
                if (browser) {
                    try { browser.close(); } catch (ignoredClose) {}
                }
            }
        }
        if (!result.length || (expected && result.length < expected)) {
            return Response.error(
                "WuxiaWorld: mục lục được tải động; chỉ tìm được " + result.length +
                (expected ? "/" + expected : "") +
                " chương. Extension không hiển thị danh sách thiếu chương."
            );
        }
        return Response.success(result);
    } catch (e) {
        return Response.error("WuxiaWorld mục lục: " + e.message);
    }
}
