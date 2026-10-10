function execute(url) {
    var host = "https://www.69shuba.com";
    var match = String(url).match(/\/book\/(\d+)/);
    var target = match ? host + "/book/" + match[1] + ".htm" : url;
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error("69Shuba HTTP " + response.status);
        var doc = response.html();
        var name = doc.select(".booknav2 h1 a").first().text().trim() ||
                   doc.select(".booknav2 h1").first().text().trim() ||
                   doc.select("h1").first().text().trim();
        var author = doc.select(".booknav2 a[href*='author']").first().text().trim();
        if (!author) author = doc.select("meta[property='og:novel:author']").attr("content") || "";
        var cover = doc.select(".bookimg2 img").first().attr("src") ||
                    doc.select("meta[property='og:image']").attr("content") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover.charAt(0) === "/") cover = host + cover;
        var description = doc.select(".navtxt").first().text().trim() ||
                          doc.select(".nav_txt").first().text().trim() ||
                          doc.select("meta[name='description']").attr("content") || "";
        var extra = doc.select(".booknav2").first().text().replace(/\s+/g," ").slice(0,500);
        if (!name) return Response.error("69Shuba: không tìm thấy tên truyện");
        return Response.success({
            name:name,author:author,cover:cover,description:description,
            detail:extra,ongoing:!/全本|已完结|完本/.test(extra),host:host
        });
    } catch (e) {
        return Response.error("69Shuba chi tiết: " + e.message);
    }
}
