function execute(key, page) {
    var host = "https://www.69shuba.com", p = parseInt(page || "1", 10);
    if (!p || p < 1) p = 1;
    var url = host + "/search.htm?searchkey=" + encodeURIComponent(key) + "&page=" + p;
    try {
        var response = fetch(url);
        if (!response.ok && response.status !== 403) {
            response = fetch(host + "/modules/article/search.php", {
                method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
                body:"searchkey=" + encodeURIComponent(key) + "&submit=Search"
            });
        }
        if (!response.ok) return Response.error("69Shuba tìm kiếm HTTP " + response.status);
        var doc = response.html();
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
            var card = e.parent().parent(), img = card.select("img").first();
            var cover = img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else if (cover.charAt(0) === "/") cover = host + cover;
            if (!/^https?:\/\//.test(cover)) cover = "https://cdn.cdnshu.com/files/article/image/" + Math.floor(Number(m[1])/1000) + "/" + m[1] + "/" + m[1] + "s.jpg";
            data.push({name:name,link:host + "/book/" + m[1] + ".htm",cover:cover,description:card.text().replace(/\s+/g," ").slice(0,150),host:host});
        }
        return Response.success(data, data.length >= 10 ? String(p + 1) : null);
    } catch (e) {
        return Response.error("69Shuba tìm kiếm: " + e.message);
    }
}
