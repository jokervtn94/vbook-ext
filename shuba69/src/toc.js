// VBook-safe decoder: decode each HTTP response once, refetch only if damaged.
function shubaSafeHtml(response, target, selector) {
    var doc = response.html("gbk");
    if (!doc || typeof doc.select !== "function") return doc;
    function sample(d) {
        try {
            var nodes = d.select(selector);
            if (!nodes || !nodes.size()) return "";
            var node = nodes.first();
            return String((node.attr && node.attr("content")) || (node.text && node.text()) || "");
        } catch (ignored) { return ""; }
    }
    function damage(value) {
        var text = String(value || "").slice(0, 1500);
        var marks = text.match(/\uFFFD|锟斤拷|馃|銆|涓|鐨|鍙|宸|璇|鍥|澶|绗|鍐|濡|鍏|鏂|鐩|浣|锛/g);
        return marks ? marks.length : 0;
    }
    var originalScore = damage(sample(doc));
    if (!originalScore) return doc;
    // Never parse the same HTTP body twice: VBook's response may be one-shot.
    try {
        var retry = fetch(target);
        if (retry && retry.ok) {
            var alternate = retry.html("utf-8");
            if (alternate && typeof alternate.select === "function" &&
                damage(sample(alternate)) < originalScore) return alternate;
        }
    } catch (ignored) {}
    return doc;
}
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
        var doc = shubaSafeHtml(response,target,"#catalog li a[href*='/txt/']");
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
