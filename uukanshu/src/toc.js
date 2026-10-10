function execute(url) {
    var host = "https://uukanshu.cc", m = String(url).match(/\/book\/(\d+)/);
    if (!m) return Response.error("UUKanShu: URL truyện không hợp lệ");
    try {
        var response = fetch(host + "/book/" + m[1] + "/");
        if (!response.ok) return Response.error("UUKanShu mục lục HTTP " + response.status);
        var doc = response.html();
        var els = doc.select("#list-chapterAll a, dl.book.chapterlist a, .chapterlist dd a");
        var chapters = [], seen = {}, path = new RegExp("/book/" + m[1] + "/[0-9]+\\.html(?:$|[?#])");
        for (var i = 0; i < els.size(); i++) {
            var a = els.get(i), href = a.attr("href") || "";
            if (!path.test(href)) continue;
            var full = href.indexOf("//") === 0 ? "https:" + href :
                /^https?:\/\//.test(href) ? href : href.charAt(0)==="/" ? host + href : host + "/book/" + m[1] + "/" + href;
            if (seen[full]) continue;
            seen[full] = true;
            chapters.push({name:a.text().trim(),url:full,host:host});
        }
        if (!chapters.length) return Response.error("UUKanShu: không có danh sách chương");
        return Response.success(chapters);
    } catch (e) {
        return Response.error("UUKanShu mục lục: " + e.message);
    }
}
