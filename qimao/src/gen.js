load("config.js");
function execute(input, page) {
    var p = parseInt(page || "1", 10);
    if (!(p >= 1)) p = 1;
    var group = String(input || "a-a-a").trim();
    if (!/^(?:a|[012])-(?:a|\d+)-(?:a|\d+)$/.test(group)) group = "a-a-a";
    var target = QM_WEB + "/shuku/" + group + "-a-a-a-a-update_time-" + p + "/";
    return qmWebDoc(target, function(doc) {
        // Current Qimao list layout (Oct 2026) uses qm-cover-text-item,
        // NOT the previous qm-pic-txt li (still used only for recommendations).
        var rows = doc.select("li.qm-cover-text-item");
        if (!rows || !rows.size()) rows = doc.select(".qm-cover-text-item");
        var data = [], seen = {};
        if (rows) rows.forEach(function(row) {
            var href = qmAttr(row, ".s-tit a", "href") || qmAttr(row, ".qm-book-cover a", "href");
            var link = qmBookUrl(href);
            if (!link || seen[link]) return;
            var name = qmText(row, ".s-tit a");
            if (!name) return;
            var cover = qmAbsolute(qmAttr(row, ".qm-book-cover img", "src") ||
                        qmAttr(row, "img.book-cover-src", "src") ||
                        qmAttr(row, "img", "data-src") ||
                        qmAttr(row, "img", "src"));
            var author = qmText(row, ".s-author");
            var description = qmText(row, ".s-desc");
            data.push({name:name, link:link, cover:cover, description:author || description, host:QM_WEB});
            seen[link] = true;
        });
        if (!data.length) return Response.error(
            "Qimao: danh sách rỗng. Website có thể đổi cấu trúc hoặc chặn truy cập.");
        return Response.success(data, data.length >= 10 ? String(p + 1) : null);
    });
}
