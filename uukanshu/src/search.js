function execute(key, page) {
    var host = "https://uukanshu.cc", p = parseInt(page || "1", 10);
    if (!p || p < 1) p = 1;
    var url = host + "/search/" + encodeURIComponent(key) + "/" + p + ".html";
    try {
        if (p === 1) {
            fetch(host + "/search", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
                body:"searchtype=all&searchkey=" + encodeURIComponent(key) + "&action=login&submit="});
        }
        var response = fetch(url);
        if (!response.ok) return Response.error("UUKanShu tìm kiếm HTTP " + response.status);
        var doc = response.html(), blocks = doc.select("div.bookbox"), list = [], seen = {};
        for (var i = 0; i < blocks.size(); i++) {
            var e = blocks.get(i), a = e.select("div.bookname a, h4.bookname a").first();
            var href = a.attr("href") || "", m = href.match(/\/book\/(\d+)/);
            if (!m || seen[m[1]]) continue;
            seen[m[1]] = true;
            var cover = e.select("img").first().attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else if (cover.charAt(0) === "/") cover = host + cover;
            if (!/^https?:\/\//.test(cover)) cover = "https://image.uukanshu.cc/" + String(m[1]).slice(0,2) + "/" + m[1] + "/" + m[1] + "s.jpg";
            list.push({name:a.text().trim(),link:host + "/book/" + m[1] + "/",cover:cover,description:e.select(".author,.update").text().replace(/\s+/g," ").slice(0,180),host:host});
        }
        return Response.success(list,list.length >= 10 ? String(p+1) : null);
    } catch (e) {
        return Response.error("UUKanShu tìm kiếm: " + e.message);
    }
}
