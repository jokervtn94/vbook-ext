function execute(url) {
    try {
        var response = fetch(url);
        if (!response.ok) return Response.error("UUKanShu chương HTTP " + response.status);
        var doc = response.html();
        var selectors = [
            ".read .readcontent, .read .readcotent, div.readcotent, #contentbox",
            ".readcontent, #chaptercontent, #content, .chapter-content"
        ];
        var content = null;
        for (var i = 0; i < selectors.length; i++) {
            var nodes = doc.select(selectors[i]);
            if (nodes.size()) {
                content = nodes.first();
                break;
            }
        }
        if (!content) return Response.error("UUKanShu: không tìm thấy nội dung chương");
        content.select("script,style,iframe,ins,.ad_content,.contentadv,.ad,.bottom-ad").remove();
        var html = String(content.html() || "")
                   .replace(/<!--[\s\S]*?-->/g, "")
                   .replace(/<a[^>]*href[^>]*>[^<]*<\/a>/gi, "")
                   .replace(/&(nbsp|emsp);/gi, " ")
                   .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
                   .trim();
        var plain = html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
        if (!plain || /^(Just a moment|Checking your browser|請完成人機驗證)/i.test(plain))
            return Response.error("UUKanShu: nội dung chương trống hoặc đang yêu cầu xác minh");
        return Response.success(html);
    } catch (e) {
        return Response.error("UUKanShu chương: " + e.message);
    }
}
