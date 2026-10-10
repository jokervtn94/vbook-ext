function execute(url) {
    try {
        var response = fetch(url);
        if (!response.ok) {
            return Response.error("69Shuba chương HTTP " + response.status +
                (response.status == 403 ? ": website yêu cầu xác minh Cloudflare" : ""));
        }
        var doc = response.html();
        var roots = doc.select(".txtnav");
        if (!roots.size()) roots = doc.select("#content");
        if (!roots.size()) roots = doc.select("#txt");
        if (!roots.size()) {
            return Response.error("69Shuba: không tìm thấy phần nội dung chương (có thể bị Cloudflare chặn)");
        }
        // Work on HTML, avoiding unsupported DOM mutation functions in Vbook.
        var html = String(roots.first().html() || "");
        html = html.replace(/<!--[\s\S]*?-->/g, "")
                   .replace(/<(script|style|iframe|ins)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
                   .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "")
                   .replace(/<(div|p|span)\b[^>]*(?:class\s*=\s*["'][^"']*(?:txtinfo|hide720|contentadv|bottom-ad|ad_content)[^"']*["']|id\s*=\s*["']txtright["'])[^>]*>[\s\S]*?<\/\1>/gi, "")
                   .replace(/&emsp;/gi, "　")
                   .replace(/&nbsp;/gi, " ")
                   .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
                   .trim();
        var plain = html.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
        if (!plain || /^(Just a moment|Checking your browser|请完成人机验证)/i.test(plain)) {
            return Response.error("69Shuba: chương rỗng hoặc cần xác minh Cloudflare");
        }
        return Response.success(html);
    } catch (e) {
        return Response.error("69Shuba chương: " + e.message);
    }
}
