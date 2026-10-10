function execute(key) {
    var host = "https://www.wuxiaworld.com";
    try {
        var response = fetch(host + "/api/novels/search", {
            method: "GET", queries: {query: String(key || ""), count: "100"}
        });
        if (!response.ok) return Response.error("WuxiaWorld tìm kiếm HTTP " + response.status);
        var json = response.json();
        if (!json || json.result === false || !Array.isArray(json.items))
            return Response.error("WuxiaWorld: API tìm kiếm không hợp lệ");
        var list = [], seen = {};
        for (var i = 0; i < json.items.length; i++) {
            var n = json.items[i], slug = String(n.slug || "");
            if (!slug || seen[slug] || !n.name) continue;
            seen[slug] = true;
            list.push({
                name: String(n.name),
                link: host + "/novel/" + slug,
                cover: String(n.coverUrl || ""),
                description: "Chương: " + String(n.chapterCount || 0),
                host: host
            });
        }
        return Response.success(list);
    } catch (e) {
        return Response.error("WuxiaWorld tìm kiếm: " + e.message);
    }
}
