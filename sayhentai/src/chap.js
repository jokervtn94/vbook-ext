load("config.js");
function execute(url) {
    var host = String(BASE_URL || "https://sayhentai.cx").replace(/\/+$/, "");
    var target = String(url || "").replace(/^https?:\/\/[^/]+/i, host);
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error(
            "Say Hentai chương HTTP " + response.status +
            (response.status === 403 ? ": website yêu cầu xác minh Cloudflare" : ""));
        var doc = response.html(), images = [], seen = {};
        var nodes = doc.select("#chapter_content img[id^=image]");
        if (!nodes.size()) nodes = doc.select("#chapter_content img, .reading-content img");
        nodes.forEach(function(e) {
            var src = e.attr("data-original") || e.attr("data-src") ||
                      e.attr("data-lazy-src") || e.attr("src") || "";
            if (!src || /^data:/.test(src) || /\/(?:loading|placeholder)\.(?:gif|png)/i.test(src))
                return;
            if (src.indexOf("//") === 0) src = "https:" + src;
            else if (src.charAt(0) === "/") src = host + src;
            else if (!/^https?:\/\//.test(src)) src = host + "/" + src;
            if (!seen[src]) { seen[src] = true; images.push(src); }
        });
        if (!images.length) return Response.error(
            "Say Hentai: chương không có ảnh hoặc đang bị xác minh Cloudflare");
        return Response.success(images);
    } catch (e) {
        return Response.error("Say Hentai đọc chương: " + e.message);
    }
}
