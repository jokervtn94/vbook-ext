function execute(url) {
    var host = "https://uukanshu.cc";
    var m = String(url).match(/\/book\/(\d+)/);
    var target = m ? host + "/book/" + m[1] + "/" : url;
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error("UUKanShu HTTP " + response.status);
        var doc = response.html();
        var name = doc.select("h1.booktitle, h1").first().text().trim() ||
                   doc.select("meta[property='og:novel:book_name']").attr("content") || "";
        var author = doc.select(".bookinfo a[href*='author'],p.booktag a[href*='authorarticle']").first().text().trim() ||
                     doc.select(".bookinfo a").first().text().trim() ||
                     doc.select("meta[property='og:novel:author']").attr("content") || "";
        var cover = doc.select(".bookcover img, a.bookImg img").first().attr("src") ||
                    doc.select("meta[property='og:image']").attr("content") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover.charAt(0)==="/") cover = host + cover;
        var desc = doc.select(".bookintro").first().text().trim() ||
                   doc.select("meta[property='og:description']").attr("content") || "";
        var detail = doc.select(".bookinfo,.booktime,.booktag").text().replace(/\s+/g," ").slice(0,450);
        if (!name) return Response.error("UUKanShu: không có thông tin truyện");
        return Response.success({name:name,author:author,cover:cover,description:desc,detail:detail,
            ongoing:!/完結|完本|已完结/.test(detail),host:host});
    } catch (e) {
        return Response.error("UUKanShu chi tiết: " + e.message);
    }
}
