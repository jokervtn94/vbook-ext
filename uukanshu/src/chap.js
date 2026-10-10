function execute(url) {
    try {
        var response = fetch(url);
        if (!response.ok) return Response.error("UUKanShu chương HTTP " + response.status);
        var doc = response.html(), nodes = doc.select(".read .readcontent, .read .readcotent, div.readcotent, #contentbox");
        if (!nodes.size()) return Response.error("UUKanShu: không tìm thấy nội dung");
        var content = nodes.first();
        content.select("script,style,iframe,ins,.ad_content,.contentadv,.ad,.bottom-ad").remove();
        var html = content.html() || "";
        html = html.replace(/<!--[\s\S]*?-->/g,"")
                   .replace(/<a[^>]*href[^>]*>[^<]*<\/a>/gi,"")
                   .replace(/&(nbsp|emsp);/gi," ")
                   .replace(/(<br\s*\/?>\s*){3,}/gi,"<br><br>")
                   .trim();
        if (html.length < 25) return Response.error("UUKanShu: chương rỗng hoặc bị chặn");
        return Response.success(html);
    } catch (e) {
        return Response.error("UUKanShu chương: " + e.message);
    }
}
