load("config.js");
function execute(key, page) {
    var query = String(key || "").trim();
    if (!query) return Response.success([],null);
    var p = parseInt(page || "1",10);
    if (!(p > 0)) p = 1;
    try {
        var target = BASE_URL + "/tim-truyen?sn=" + encodeURIComponent(query) + "&pg=" + p;
        var response = fetch(target);
        if (!response.ok) return Response.error("Hố Truyện tìm kiếm: HTTP " + response.status);
        var doc = response.html();
        var nodes = doc.select("#searchresult .sitem");
        var data = [], seen = {};
        nodes.forEach(function(row) {
            var href = htAttr(row, ".title a", "href");
            var link = htBookUrl(href);
            var name = htText(row, ".title a");
            if (!link || !name || seen[link]) return;
            seen[link] = true;
            data.push({
                name:name,link:link,
                cover:htCoverFrom(row),
                description:htText(row,".author"),
                host:BASE_URL
            });
        });
        return Response.success(data,htNext(doc,p));
    } catch (e) {
        return Response.error("Hố Truyện tìm kiếm: " + (e && e.message ? e.message : e));
    }
}
