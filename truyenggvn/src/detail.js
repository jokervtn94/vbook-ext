load("config.js");
function execute(url) {
    var target = ggStory(url) || ggAbs(url);
    return ggWithDoc(target, function(doc) {
        var name = ggText(doc, ["h1[itemprop=name]", ".story-detail-info h1", ".book-info h1", "h1"]);
        if (!name) return Response.error("TruyenGGVN: không tìm thấy tên truyện.");
        var cover = ggAttr(doc, ["meta[property='og:image']"], "content");
        if (!cover) {
            var image = ggSelect(doc, [".thumbblock img", ".book-cover img", ".story-detail img", ".book_avatar img"]);
            cover = image ? ggImage(image.first()) : "";
        } else cover = ggAbs(cover);
        var author = ggText(doc, [
            "p:contains(Tác Giả) + p",
            "p:contains(Tác giả) + p",
            ".story-detail-info a[href*='tac-gia']",
            ".author"
        ]) || "Đang cập nhật";
        var description = ggAttr(doc, ["meta[property='og:description']"], "content");
        var descNodes = ggSelect(doc, ["#story-detail", ".story-detail-info", ".summary-content", ".story-description"]);
        if (descNodes) description = descNodes.first().html() || description;
        var detail = ggText(doc, [".story-detail-info", ".book-info", ".info-story"]);
        return Response.success({
            name:name, author:author, cover:cover, description:description || "",
            detail:detail, ongoing: !/hoàn thành|đã hoàn thành|completed/i.test(detail),
            host:GG_HOST
        });
    });
}
