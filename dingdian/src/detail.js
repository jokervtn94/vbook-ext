load("cover.js");
function execute(url) {
    var match = String(url || "").match(/\/(?:xiaoshuo|ebooks)\/(\d+)(?:\/|$|\?)/i);
    if (!match) return Response.error("Dingdian: liên kết truyện không hợp lệ.");
    var target = DD_HOST + "/xiaoshuo/" + match[1] + "/";
    try {
        var doc = Http.get(target).html();
        var title = String(doc.select("meta[property=og:novel:book_name]").attr("content") || "").trim() ||
                    String(doc.select("h1").first().text() || "").trim();
        if (!title) return Response.error("Dingdian: không tìm thấy tên truyện.");
        var author = String(doc.select("meta[property=og:novel:author]").attr("content") || "").trim();
        var cover = ddCoverFromDoc(doc);
        var status = String(doc.select(".hang_1").html() || "");
        return Response.success({
            name: title,
            cover: cover,
            author: author,
            description: String(doc.select(".hang_3").text() || ""),
            detail: status + "<br>" + author,
            ongoing: status.indexOf("连载中") !== -1,
            host: DD_HOST
        });
    } catch (e) {
        return Response.error("Dingdian chi tiết: " + (e.message || e));
    }
}
