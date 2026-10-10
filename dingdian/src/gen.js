load("cover.js");
function execute(category, page) {
    var p = parseInt(page || "1", 10);
    if (!(p > 0)) p = 1;
    var group = /^[1-6]$/.test(String(category)) ? String(category) : "1";
    var doc;
    try {
        doc = Http.get(DD_HOST + "/sort/" + group + "_" + p + "/").html();
    } catch (e) {
        return Response.error("Dingdian: không tải được danh sách truyện: " + (e.message || e));
    }
    var rows = doc.select(".lastupdate ul li");
    var data = [], coverCache = {}, seen = {};
    rows.forEach(function(row) {
        var a = row.select(".name a").first();
        var name = String(a.text() || "").trim();
        var href = String(a.attr("href") || "").trim();
        var idMatch = href.match(/\/xiaoshuo\/(\d+)(?:\/|$|\?)/i);
        if (!idMatch || !name || seen[idMatch[1]]) return;
        seen[idMatch[1]] = true;
        var link = DD_HOST + "/xiaoshuo/" + idMatch[1] + "/";
        var cover = ddCoverFromListItem(row) || ddCoverFromBook(link, coverCache);
        var author = String(row.select(".zuo").first().text() || "").trim();
        data.push({
            name: name,
            link: link,
            cover: cover,
            description: author,
            host: DD_HOST
        });
    });
    if (!data.length) return Response.error("Dingdian: danh sách truyện trống hoặc giao diện nguồn đã thay đổi.");
    return Response.success(data, data.length >= 20 ? String(p + 1) : null);
}
