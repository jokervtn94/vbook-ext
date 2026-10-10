load("charset.js");
function shubaChapterNumber(name) {
    var m = String(name).match(/^\s*(?:第\s*)?(\d{1,7})(?:[.．。、章]|\s)/);
    return m ? parseInt(m[1], 10) : null;
}
function execute(url) {
    var host = "https://www.69shuba.com";
    var m = String(url).match(/\/book\/(\d+)/);
    if (!m) return Response.error("69Shuba: URL truyện không hợp lệ");
    var bookid = m[1], target = host + "/book/" + bookid + "/";
    try {
        var response = fetch(target);
        if (!response.ok) {
            return Response.error("69Shuba mục lục HTTP " + response.status +
                (response.status == 403 ? ": website yêu cầu xác minh Cloudflare" : ""));
        }
        var doc = shubaDocument(response,"toc");
        var els = doc.select("#catalog li a[href*='/txt/'], #catalog ul li a");
        if (!els.size()) els = doc.select("#catalog a");
        if (!els.size()) els = doc.select("a[href*='/txt/" + bookid + "/']");
        var items = [], seen = {};
        for (var i = 0; i < els.size(); i++) {
            var el = els.get(i), href = String(el.attr("href") || "");
            var name = String(el.text() || "").trim();
            if (!name) continue;
            var chap = href.match(/\/txt\/(\d+)\/(\d+)(?:\.html?)?(?:[?#].*)?$/i);
            if (!chap || chap[1] !== bookid) continue;
            var full = host + "/txt/" + chap[1] + "/" + chap[2];
            if (seen[full]) continue;
            seen[full] = true;
            items.push({name: name, url: full, host: host});
        }
        if (!items.length) {
            return Response.error("69Shuba: không tìm thấy mục lục (có thể bị Cloudflare chặn)");
        }
        if (items.length > 1) {
            var start = shubaChapterNumber(items[0].name);
            var end = shubaChapterNumber(items[items.length - 1].name);
            if (start !== null && end !== null && start > end) items.reverse();
        }
        return Response.success(items);
    } catch (e) {
        return Response.error("69Shuba mục lục: " + e.message);
    }
}
