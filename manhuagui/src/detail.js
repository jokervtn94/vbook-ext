function mgNodes(root, selector) {
    if (!root || typeof root.select !== "function") return null;
    var nodes = root.select(selector);
    return nodes && typeof nodes.size === "function" && nodes.size() > 0 ? nodes : null;
}
function mgText(root, selector) {
    var nodes = mgNodes(root, selector);
    return nodes ? String(nodes.first().text() || "").replace(/\s+/g, " ").trim() : "";
}
function mgAttr(root, selector, attr) {
    var nodes = mgNodes(root, selector);
    return nodes ? String(nodes.first().attr(attr) || "").trim() : "";
}
function mgAbsolute(value) {
    var url = String(value || "").trim();
    if (!url || /^(?:data:|javascript:|blob:)/i.test(url)) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (/^https?:\/\//i.test(url)) return url.replace(/^http:/i, "https:");
    return "https://www.manhuagui.com/" + url.replace(/^\/+|^(?:\.\.\/)+/g, "");
}
function mgSafeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mgInfoRows(doc) {
    var rows = mgNodes(doc, ".book-detail .cont-list dl");
    var data = {details: [], author: "", category: "", status: ""};
    if (rows) rows.forEach(function(row) {
        var key = mgText(row, "dt");
        var value = mgText(row, "dd");
        if (!key || !value) return;
        data.details.push(mgSafeHtml(key) + " " + mgSafeHtml(value));
        if (/作者/.test(key)) data.author = value;
        if (/类别|類別|分类|分類/.test(key)) data.category = value;
        if (/状态|狀態/.test(key)) data.status = value;
    });
    return data;
}
function execute(url) {
    var match = String(url || "").match(/\/comic\/(\d+)(?:[/?#]|$)/i);
    if (!match) return Response.error("Manhua Gui: liên kết truyện không hợp lệ.");
    var target = "https://www.manhuagui.com/comic/" + match[1] + "/";
    try {
        var response = fetch(target);
        if (!response) return Response.error("Manhua Gui: không nhận được phản hồi từ trang nguồn.");
        if (!response.ok) return Response.error("Manhua Gui: trang chi tiết HTTP " + response.status);
        var doc = response.html();
        if (!doc || typeof doc.select !== "function")
            return Response.error("Manhua Gui: HTML trang chi tiết trống.");
        // Both templates are live: desktop .hcover/.detail-list and
        // mobile .book-detail .thumb/.cont-list dl after site redirects.
        var name = mgText(doc, ".book-title h1") ||
                   mgText(doc, ".main-bar h1") ||
                   mgText(doc, "h1");
        if (!name) return Response.error(
            "Manhua Gui: không thấy tên truyện; có thể trang đã chuyển hướng hoặc thay đổi HTML.");
        var cover = mgAbsolute(
            mgAttr(doc, ".hcover img", "src") ||
            mgAttr(doc, ".book-detail .cont-list .thumb img", "src") ||
            mgAttr(doc, ".book-cover img", "src") ||
            mgAttr(doc, "meta[property='og:image']", "content")
        );
        var desc = mgText(doc, "#intro-all") ||
                   mgText(doc, "#bookIntro") ||
                   mgText(doc, ".book-intro");
        var info = mgInfoRows(doc);
        var desktop = mgNodes(doc, ".detail-list li");
        var detail = "";
        var category = info.category;
        if (desktop) {
            var first = desktop.get(0);
            var second = desktop.size() > 1 ? desktop.get(1) : null;
            // Guard each node; VBook returns null for missing DOM matches.
            detail = first ? String(first.html() || "") : "";
            if (second) category = String(second.html() || "");
            if (desktop.size() > 3) {
                var statusNode = desktop.get(3);
                if (statusNode) info.status = String(statusNode.text() || "");
            }
        }
        if (!detail) detail = info.details.join("<br>");
        var status = info.status || mgText(doc, ".book-detail .cont-list .thumb i");
        if (status && detail.indexOf(mgSafeHtml(status)) === -1)
            detail += (detail ? "<br>" : "") + mgSafeHtml(status);
        return Response.success({
            name: name,
            cover: cover,
            author: info.author || mgText(doc, ".detail-list li a[href*='/author/']") || "",
            description: desc,
            detail: detail,
            category: category,
            ongoing: !/完结|完結|已完|完本/.test(status),
            host: "https://www.manhuagui.com"
        });
    } catch (e) {
        return Response.error("Manhua Gui chi tiết: " + (e && e.message ? e.message : e));
    }
}
