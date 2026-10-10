function execute(url) {
    var host = "https://uukanshu.cc";
    var book = String(url).match(/\/book\/(\d+)/);
    if (!book) return Response.error("UUKanShu: URL truyện không hợp lệ");
    var bookid = book[1];
    try {
        var response = fetch(host + "/book/" + bookid + "/");
        if (!response.ok) return Response.error("UUKanShu mục lục HTTP " + response.status);
        var doc = response.html();
        var els = doc.select("#list-chapterAll a, dl.book.chapterlist a, .chapterlist dd a");
        if (!els.size()) els = doc.select(".chapterlist a, #list a");
        if (!els.size()) els = doc.select("a[href*='/book/" + bookid + "/']");
        var chapters = [], seen = {};
        var fullPath = new RegExp("(?:^|/)book/" + bookid + "/([0-9]+)\\.html(?:$|[?#])", "i");
        var relativePath = /^([0-9]+)\.html(?:$|[?#])/i;
        for (var i = 0; i < els.size(); i++) {
            var a = els.get(i);
            var href = String(a.attr("href") || "").trim();
            var absolute = href.match(fullPath);
            var relative = absolute ? null : href.match(relativePath);
            var chapterId = absolute ? absolute[1] : relative ? relative[1] : "";
            var name = String(a.text() || "").trim();
            if (!chapterId || !name) continue;
            var link = host + "/book/" + bookid + "/" + chapterId + ".html";
            if (seen[link]) continue;
            seen[link] = true;
            chapters.push({name:name,url:link,host:host});
        }
        if (!chapters.length) return Response.error("UUKanShu: không có danh sách chương");
        return Response.success(chapters);
    } catch (e) {
        return Response.error("UUKanShu mục lục: " + e.message);
    }
}
