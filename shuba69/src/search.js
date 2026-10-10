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
function execute(key, page) {
    var host = "https://www.69shuba.com", p = parseInt(page || "1", 10);
    if (!p || p < 1) p = 1;
    var url = host + "/search.htm?searchkey=" + encodeURIComponent(key) + "&page=" + p;
    try {
        var response = fetch(url);
        if (!response.ok) {
            response = fetch(host + "/modules/article/search.php", {
                method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
                body:"searchkey=" + encodeURIComponent(key) + "&submit=Search"
            });
        }
        if (!response.ok) return Response.error("69Shuba tìm kiếm HTTP " + response.status);
        var doc = shubaSafeHtml(response,url,"h3 a[href*='/book/']");
        var cards = doc.select(".bookbox, .newbox ul li, .mybox li, .booklist li");
        var cardById = {};
        for (var j = 0; j < cards.size(); j++) {
            var card = cards.get(j);
            var cardLinks = card.select("h3 a[href*='/book/'], h4 a[href*='/book/'], a[href*='/book/']");
            if (!cardLinks.size()) continue;
            var cardHref = cardLinks.first().attr("href") || "";
            var cardMatch = cardHref.match(/\/book\/(\d+)(?:\.htm|\/|$)/i);
            if (!cardMatch) continue;
            var imgs = card.select("img");
            var img = imgs.size() ? imgs.first() : null;
            cardById[cardMatch[1]] = {
                cover: img ? (img.attr("data-original") || img.attr("data-src") || img.attr("src") || "") : "",
                description: card.select(".intro, .desc, .author, .update, p").text().replace(/\s+/g, " ").slice(0, 150)
            };
        }
        var els = doc.select(".newbox ul li h3 a, .bookbox h3 a, h3 a[href*='/book/'], h4 a[href*='/book/']");
        if (!els.size()) els = doc.select("a[href*='/book/']");
        var data = [], seen = {};
        for (var i = 0; i < els.size(); i++) {
            var e = els.get(i), href = e.attr("href") || "";
            var m = href.match(/\/book\/(\d+)(?:\.htm|\/|$)/);
            if (!m || seen[m[1]]) continue;
            var name = e.text().trim();
            if (!name || name.length > 120) continue;
            seen[m[1]] = true;
            var info = cardById[m[1]] || {};
            var cover = info.cover || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else if (cover.charAt(0) === "/") cover = host + cover;
            if (!/^https?:\/\//.test(cover)) cover = "https://cdn.cdnshu.com/files/article/image/" + Math.floor(Number(m[1])/1000) + "/" + m[1] + "/" + m[1] + "s.jpg";
            data.push({name:name,link:host + "/book/" + m[1] + ".htm",cover:cover,description:info.description || "",host:host});
        }
        return Response.success(data, data.length >= 10 ? String(p + 1) : null);
    } catch (e) {
        return Response.error("69Shuba tìm kiếm: " + e.message);
    }
}
