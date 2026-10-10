function execute(url) {
    var match = String(url || "").match(/\/(?:book-detail|book-read)\/(\d+)(?:[/?#]|$)/i);
    if (!match) return Response.error("Book QQ: URL sách không hợp lệ");
    var bid = match[1];
    try {
        var response = fetch("https://book.qq.com/api/book/detail/chapters", {
            method: "GET", queries: {bid: bid}
        });
        if (!response.ok) return Response.error("Book QQ: mục lục HTTP " + response.status);
        var payload = response.json(), chapters = payload && payload.data;
        if (!chapters || !Array.isArray(chapters))
            return Response.error("Book QQ: API mục lục không hợp lệ");
        var list = [], seen = {};
        for (var i = 0; i < chapters.length; i++) {
            var c = chapters[i], cid = String(c.cid || "");
            if (!/^\d+$/.test(cid) || seen[cid]) continue;
            seen[cid] = true;
            list.push({
                name: (Number(c.free) !== 0 ? "【Free】 " : "【VIP】 ") +
                      String(c.chapterName || "Chương " + (i + 1)),
                url: "https://book.qq.com/book-read/" + bid + "/" + cid,
                host: "https://book.qq.com"
            });
        }
        if (!list.length) return Response.error("Book QQ: mục lục không có chương");
        return Response.success(list);
    } catch (e) {
        return Response.error("Book QQ mục lục: " + e.message);
    }
}
