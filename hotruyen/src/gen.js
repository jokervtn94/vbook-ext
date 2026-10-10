load("config.js");
function execute(input, page) {
    var p = parseInt(page || "1",10);
    if (!(p > 0)) p = 1;
    var target = htPageUrl(input, p);
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error("Hố Truyện danh sách: HTTP " + response.status);
        var doc = response.html();
        var nodes = doc.select("#newupdate .uitem");
        var data = [], seen = {};
        nodes.forEach(function(row) {
            var href = htAttr(row,"a[href*='/truyen/']","href") || htAttr(row,"a","href");
            var link = htBookUrl(href);
            var name = htText(row,"#namevi") || htText(row,".title") || htText(row,"a");
            if (!link || !name || seen[link]) return;
            seen[link] = true;
            data.push({
                name:name, link:link,
                cover:htCoverFrom(row),
                description:htText(row,".author") || htText(row,".chap"),
                host:BASE_URL
            });
        });
        if (!data.length) return Response.error("Hố Truyện: trang cập nhật không có truyện hoặc cấu trúc đã đổi.");
        return Response.success(data,htNext(doc,p));
    } catch (e) {
        return Response.error("Hố Truyện danh sách: " + (e && e.message ? e.message : e));
    }
}
