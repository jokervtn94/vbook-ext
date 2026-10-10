load("config.js");
function execute(key, page) {
    var host = String(BASE_URL || "https://sayhentai.cx").replace(/\/+$/, "");
    var p = parseInt(page || "1", 10);
    if (!p || p < 1) p = 1;
    try {
        // Search must use the same configurable domain as all other scripts.
        var response = fetch(host + "/search", {
            method: "GET",
            queries: {s: String(key || ""), page: String(p)}
        });
        if (!response.ok) return Response.error(
            "Say Hentai tìm kiếm HTTP " + response.status +
            (response.status === 403 ? ": website yêu cầu xác minh Cloudflare" : ""));
        var doc = response.html(), comics = [], seen = {};
        doc.select(".page-item-detail").forEach(function(e) {
            var a = e.select("h3 a");
            var name = String(a.text() || "").trim();
            var href = String(a.attr("href") || "");
            if (!name || !href) return;
            if (href.indexOf("//") === 0) href = "https:" + href;
            else if (href.charAt(0) === "/") href = host + href;
            else if (!/^https?:\/\//.test(href)) href = host + "/" + href;
            // Old published source domains must not leak into the Vbook catalog.
            href = href.replace(/^https?:\/\/(?:www\.)?sayhentai\.(?:one|me|net|cx)/i, host);
            if (seen[href]) return;
            seen[href] = true;
            var image = e.select("img.img-responsive, img");
            var cover = image.attr("data-original") || image.attr("data-src") ||
                        image.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
            else if (cover.charAt(0) === "/") cover = host + cover;
            comics.push({
                name: name, link: href, cover: cover,
                description: e.select(".chapter").text().trim(), host: host
            });
        });
        var next = null, nextLink = doc.select(".pager li.active + li a[href], .pagination .next a[href]");
        if (nextLink.size()) {
            var href = nextLink.attr("href") || "";
            var hit = href.match(/(?:[?&]page=|\/page\/)(\d+)/);
            next = hit ? hit[1] : String(p + 1);
        }
        return Response.success(comics, next);
    } catch (e) {
        return Response.error("Say Hentai tìm kiếm: " + e.message);
    }
}
