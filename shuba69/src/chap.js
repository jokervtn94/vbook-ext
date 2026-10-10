function execute(url) {
    try {
        var response = fetch(url);
        if (!response.ok) return Response.error("69Shuba chương HTTP " + response.status);
        var doc = response.html();
        var roots = doc.select(".txtnav");
        if (!roots.size()) roots = doc.select("#content");
        if (!roots.size()) return Response.error("69Shuba: không tìm thấy nội dung chương");
        var root = roots.first();
        root.select("h1, .hide720, .txtinfo, #txtright, .contentadv, .bottom-ad, script, style, iframe, ins").remove();
        var html = root.html() || "";
        html = html.replace(/<!--[\s\S]*?-->/g,"")
                   .replace(/&emsp;/g,"　")
                   .replace(/(<br\s*\/?>\s*){3,}/gi,"<br><br>")
                   .trim();
        if (!html || html.length < 25) return Response.error("69Shuba: chương rỗng hoặc bị chặn");
        return Response.success(html);
    } catch (e) {
        return Response.error("69Shuba chương: " + e.message);
    }
}
