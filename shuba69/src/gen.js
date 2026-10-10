function execute(category, page) {
    var host = "https://www.69shuba.com";
    var p = parseInt(page || "1", 10);
    if (!p || p < 1) p = 1;
    var c = /^[0-9]$/.test(String(category)) ? String(category) : "0";
    var url = host + "/novels/monthvisit_" + c + "_0_" + p + ".htm";
    try {
        var response = fetch(url);
        if (!response.ok) return Response.error("69Shuba HTTP " + response.status + ": " + url);
        var doc = response.html();
        var links = doc.select("h3 a[href*='/book/'], h4 a[href*='/book/'], .bookbox a[href*='/book/']");
        if (!links.size()) links = doc.select("a[href*='/book/']");
        var list = [], seen = {};
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i), href = a.attr("href") || "";
            var match = href.match(/\/book\/(\d+)(?:\.htm|\/|$)/i);
            if (!match || seen[match[1]]) continue;
            var name = a.text().trim().replace(/\s+/g, " ");
            if (name.length < 2 || name.length > 120 || /^(点击阅读|加入书架|阅读)$/.test(name)) continue;
            seen[match[1]] = true;
            var id = match[1];
            var card = a.parent().parent();
            var img = card.select("img").first();
            var cover = img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else if (cover.indexOf("/") === 0) cover = host + cover;
            if (!/^https?:\/\//.test(cover)) cover = "https://cdn.cdnshu.com/files/article/image/" + Math.floor(Number(id)/1000) + "/" + id + "/" + id + "s.jpg";
            list.push({name:name,link:host + "/book/" + id + ".htm",cover:cover,description:card.text().replace(/\s+/g," ").slice(0,180),host:host});
        }
        return Response.success(list, list.length >= 10 ? String(p + 1) : null);
    } catch (e) {
        return Response.error("69Shuba danh sách: " + e.message);
    }
}
