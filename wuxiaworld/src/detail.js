function wwUnwrap(value) {
    if (value == null) return "";
    if (typeof value === "object" && value.value != null) return wwUnwrap(value.value);
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function wwState(raw) {
    var start = String(raw || "").indexOf("window.__REACT_QUERY_STATE__");
    if (start < 0) return null;
    start = raw.indexOf("{", start);
    if (start < 0) return null;
    var depth = 0, quote = false, escape = false, end = -1;
    for (var i = start; i < raw.length; i++) {
        var ch = raw.charAt(i);
        if (quote) {
            if (escape) escape = false;
            else if (ch === "\\") escape = true;
            else if (ch === '"') quote = false;
        } else if (ch === '"') quote = true;
        else if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) { end = i + 1; break; }
    }
    if (end < 0) return null;
    try { return JSON.parse(raw.slice(start, end)); } catch (e) { return null; }
}
function execute(url) {
    var host = "https://www.wuxiaworld.com";
    var slug = String(url).match(/\/novel\/([^/?#]+)/);
    if (!slug) return Response.error("WuxiaWorld: URL truyện không hợp lệ");
    try {
        var response = fetch(host + "/novel/" + slug[1]);
        if (!response.ok) return Response.error("WuxiaWorld thông tin HTTP " + response.status);
        var doc = response.html(), item = null;
        try {
            var state = wwState(response.text());
            var queries = state && state.queries || [];
            for (var i = 0; i < queries.length; i++) {
                var q = queries[i], k = q.queryKey || [];
                if (k[0] === "novel" && k[1] === slug[1]) {
                    item = q.state && q.state.data && q.state.data.item;
                    break;
                }
            }
        } catch (ignored) {}
        item = item || {};
        var name = wwUnwrap(item.name) ||
                   doc.select("h1").first().text().trim() ||
                   String(doc.select('meta[property="og:title"]').attr("content") || "")
                       .replace(/\s*\|\s*Wuxiaworld\s*$/i, "");
        if (!name) return Response.error("WuxiaWorld: không tìm thấy tên truyện");
        var cover = wwUnwrap(item.coverUrl) ||
                    doc.select('meta[property="og:image"]').attr("content") ||
                    doc.select(".novel-left img").attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover.charAt(0) === "/") cover = host + cover;
        var author = wwUnwrap(item.authorName) || "";
        var description = wwUnwrap(item.synopsis) || wwUnwrap(item.description) ||
                          doc.select('meta[name="description"]').attr("content") || "";
        var genre = item.genres && item.genres.length ? item.genres.join(", ") : "";
        var status = wwUnwrap(item.status) || "";
        var detail = [genre, status, "WuxiaWorld"].filter(function(x) { return !!x; }).join(" | ");
        return Response.success({
            name: name, author: author, cover: cover, description: description,
            detail: detail, ongoing: !/completed|complete|finished/i.test(status),
            host: host
        });
    } catch (e) {
        return Response.error("WuxiaWorld thông tin: " + e.message);
    }
}
