function execute(url, page) {
    var host = "https://www.wuxiaworld.com";
    var p = parseInt(page || "1", 10) || 1;
    if (p > 1) return Response.success([]);
    try {
        // The verified public endpoint returns the entire current catalog in one request.
        var response = fetch(host + "/api/novels/search", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                title: "", tags: [], language: "Any", genres: [], active: null,
                sortType: "Name", sortAsc: true, searchAfter: null, count: 500
            })
        });
        if (!response.ok) return Response.error("WuxiaWorld danh sách HTTP " + response.status);
        var json = response.json();
        if (!json || json.result === false || !Array.isArray(json.items))
            return Response.error("WuxiaWorld: API danh sách không hợp lệ");
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
        return Response.error("WuxiaWorld danh sách: " + e.message);
    }
}
