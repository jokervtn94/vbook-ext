function execute(url) {
    try {
        var response = fetch(url);
        if (!response.ok) return Response.error("WuxiaWorld chương HTTP " + response.status);
        var doc = response.html();
        var selectors = [
            ".chapter-content .fr-view",
            ".chapter-content",
            "#chapter-content",
            "article .fr-view"
        ], content = null;
        for (var i = 0; i < selectors.length; i++) {
            var nodes = doc.select(selectors[i]);
            if (nodes && nodes.size()) {
                content = nodes.first();
                break;
            }
        }
        if (!content) return Response.error(
            "WuxiaWorld: không tìm thấy nội dung chương, có thể trang cần đăng nhập");
        content.select("script,style,iframe,ins,.advertisement").remove();
        var html = String(content.html() || "").trim();
        var plain = html.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
        if (!plain || /^(sign in|unlock this chapter|this chapter is locked)/i.test(plain))
            return Response.error("WuxiaWorld: chương trống hoặc bị khóa; hãy mở khóa hợp lệ trên website");
        return Response.success(html);
    } catch (e) {
        return Response.error("WuxiaWorld chương: " + e.message);
    }
}
