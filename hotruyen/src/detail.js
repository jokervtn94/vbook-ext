load("config.js");
function execute(url) {
    var target = htBookUrl(url);
    if (!target) return Response.error("Hố Truyện: liên kết truyện không hợp lệ.");
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error("Hố Truyện chi tiết: HTTP " + response.status);
        var doc = response.html();
        var name = htText(doc,"h1") || htText(doc,".bookname") ||
                   htText(doc,".title-detail") ||
                   htText(doc,".dinfo > div:nth-child(1) > span");
        if (!name) {
            var title = htText(doc,"title");
            name = title.split("|")[0].replace(/-.*$/,"").trim();
        }
        if (!name) return Response.error("Hố Truyện: không tìm thấy tên truyện.");
        var author = htText(doc,".dinfo > div:nth-child(2) > span") ||
                     htText(doc,".dinfo .glyphicon-user + label + span");
        var description = String(doc.select("#des-info").html() || "");
        var info = doc.select(".dinfo > div:nth-child(2)").html() || "";
        var status = htText(doc,".dinfo > div:nth-child(3) > span") || "";
        return Response.success({
            name:name,author:author,cover:htCoverFrom(doc),
            description:description,
            detail:info+(status?"<br>"+status:""),
            ongoing:!/hoàn thành|đã hoàn|full/i.test(status),
            host:BASE_URL
        });
    } catch (e) {
        return Response.error("Hố Truyện chi tiết: " + (e && e.message ? e.message : e));
    }
}
