function execute(url, page) {
    var host = "https://www.wuxiaworld.com";
    var token = String(page || "1");
    var cursor = null;
    if (token.indexOf("id:") === 0) {
        if (!/^id:\d+$/.test(token)) return Response.error("WuxiaWorld: con trỏ trang không hợp lệ");
        cursor = parseInt(token.slice(3), 10);
    } else if (token !== "1" && token !== "0") {
        if (!/^\d+$/.test(token)) return Response.error("WuxiaWorld: trang không hợp lệ");
        cursor = parseInt(token, 10);
    }
    try {
        // The public API caps output at 100 items, regardless of requested count.
        // searchAfter is the numeric id of the last novel of the previous page.
        var response = fetch(host + "/api/novels/search", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                title: "", tags: [], language: "Any", genres: [], active: null,
                sortType: "Name", sortAsc: true, searchAfter: cursor, count: 100
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
        var last = json.items.length ? json.items[json.items.length - 1] : null;
        var next = json.items.length >= 100 && last &&
                   /^\d+$/.test(String(last.id)) ? "id:" + String(last.id) : null;
        // Do not emit an identical cursor (would loop the same API page forever).
        if (next && token === next) next = null;
        return Response.success(list, next);
    } catch (e) {
        return Response.error("WuxiaWorld danh sách: " + e.message);
    }
}
