function shubaText(doc, selector) {
    var nodes = doc.select(selector);
    if (!nodes || !nodes.size()) return "";
    return String(nodes.first().text() || "").trim();
}
function shubaAttr(doc, selector, name) {
    var nodes = doc.select(selector);
    if (!nodes || !nodes.size()) return "";
    return String(nodes.first().attr(name) || "").trim();
}
function execute(url) {
    var host = "https://www.69shuba.com";
    var match = String(url).match(/\/book\/(\d+)/);
    var target = match ? host + "/book/" + match[1] + ".htm" : url;
    try {
        var response = fetch(target);
        if (!response.ok) {
            return Response.error("69Shuba chi tiết HTTP " + response.status +
                (response.status == 403 ? ": website yêu cầu xác minh Cloudflare" : ""));
        }
        // 69Shuba pages declare GBK; VBook default UTF-8 decoding turns
        // Chinese characters into replacement glyphs (U+FFFD).
        var doc = response.html("gbk");
        if (!doc || typeof doc.select !== "function")
            return Response.error("69Shuba: không giải mã được HTML chi tiết (GBK)");
        // 69Shuba publishes stable OpenGraph metadata even when its visual layout changes.
        var name = shubaAttr(doc, "meta[property='og:novel:book_name']", "content") ||
                   shubaAttr(doc, "meta[property='og:title']", "content") ||
                   shubaText(doc, ".booknav2 h1 a") ||
                   shubaText(doc, ".booknav2 h1") ||
                   shubaText(doc, "h1");
        if (!name) return Response.error("69Shuba: không tìm thấy tên truyện (có thể đang bị Cloudflare chặn)");
        var author = shubaAttr(doc, "meta[property='og:novel:author']", "content") ||
                     shubaText(doc, ".booknav2 a[href*='authorarticle']") ||
                     shubaText(doc, ".booknav2 a[href*='author']");
        var cover = shubaAttr(doc, "meta[property='og:image']", "content") ||
                    shubaAttr(doc, ".bookimg2 img", "data-src") ||
                    shubaAttr(doc, ".bookimg2 img", "src");
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover.charAt(0) === "/") cover = host + cover;
        var description = shubaAttr(doc, "meta[property='og:description']", "content") ||
                          shubaText(doc, ".navtxt p") ||
                          shubaText(doc, ".navtxt") ||
                          shubaText(doc, ".nav_txt") ||
                          shubaAttr(doc, "meta[name='description']", "content");
        var status = shubaAttr(doc, "meta[property='og:novel:status']", "content");
        var category = shubaAttr(doc, "meta[property='og:novel:category']", "content");
        var detail = shubaText(doc, ".booknav2").replace(/\s+/g, " ").slice(0, 500);
        if (category && detail.indexOf(category) === -1) detail = category + " | " + detail;
        if (status && detail.indexOf(status) === -1) detail += " | " + status;
        return Response.success({
            name: name, author: author, cover: cover, description: description,
            detail: detail, ongoing: !/全本|完本|完結|完结|已完成/.test(status || detail),
            host: host
        });
    } catch (e) {
        return Response.error("69Shuba chi tiết: " + e.message);
    }
}
