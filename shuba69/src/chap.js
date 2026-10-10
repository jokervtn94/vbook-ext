function shubaContentRoot(doc) {
    if (!doc || typeof doc.select !== "function") return null;
    var selectors = [".txtnav", "#content", "#txt"];
    for (var i = 0; i < selectors.length; i++) {
        var roots = doc.select(selectors[i]);
        if (roots && roots.size()) return roots.first();
    }
    return null;
}

function shubaIsChallenge(doc) {
    if (!doc || typeof doc.select !== "function") return false;
    var markers = doc.select("#challenge-form, .cf-turnstile, #cf-challenge-running");
    if (markers && markers.size()) return true;
    var titles = doc.select("title");
    var title = titles && titles.size() ? String(titles.first().text() || "") : "";
    return /just a moment|attention required|checking your browser|cloudflare/i.test(title);
}

function shubaCleanChapter(html) {
    return String(html || "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<(script|style|iframe|ins)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "")
        .replace(/<(div|p|span)\b[^>]*(?:class\s*=\s*["'][^"']*(?:txtinfo|hide720|contentadv|bottom-ad|ad_content)[^"']*["']|id\s*=\s*["']txtright["'])[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/&emsp;/gi, "　")
        .replace(/&nbsp;/gi, " ")
        .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
        .trim();
}

function execute(url) {
    var status = 0, doc = null, root = null, challenged = false;
    try {
        var response = fetch(url);
        status = response.status || 0;
        if (response.ok) {
            doc = response.html();
            root = shubaContentRoot(doc);
            challenged = shubaIsChallenge(doc);
        } else if (status !== 403 && status !== 429) {
            return Response.error("69Shuba chương HTTP " + status + ": không thể kết nối website");
        } else {
            challenged = true;
        }

        // An ordinary HTTP request may be challenged; Vbook's supported
        // headless WebView can load the page with a real browser engine.
        // It does NOT solve an interactive human-verification challenge.
        if (!root && typeof Engine !== "undefined" && Engine.newBrowser) {
            var browser = null;
            try {
                browser = Engine.newBrowser();
                var rendered = browser.launch(url, 12000);
                root = shubaContentRoot(rendered);
                if (!root) {
                    rendered = browser.html(1500);
                    root = shubaContentRoot(rendered);
                }
                if (!root && shubaIsChallenge(rendered)) challenged = true;
            } catch (browserError) {
                // Keep the useful HTTP/verification explanation below.
            } finally {
                if (browser) {
                    try { browser.close(); } catch (closeError) {}
                }
            }
        }
        if (!root) {
            if (challenged) {
                return Response.error(
                    "69Shuba yêu cầu xác minh Cloudflare. Hãy mở trang chương " +
                    "bằng trình duyệt bên trong Vbook, hoàn tất xác minh thủ công, " +
                    "quay lại và tải lại chương. Nếu vẫn bị chặn, Vbook có thể " +
                    "chưa chia sẻ phiên xác minh với extension."
                );
            }
            return Response.error("69Shuba: không tìm thấy nội dung chương trên trang hiện tại");
        }

        var html = shubaCleanChapter(root.html());
        var plain = html.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
        if (!plain || /^(Just a moment|Checking your browser|请完成人机验证)/i.test(plain)) {
            return Response.error(
                "69Shuba: nội dung chương bị chặn. Hãy mở chương trong trình duyệt Vbook " +
                "và xác minh Cloudflare trước khi thử lại."
            );
        }
        return Response.success(html);
    } catch (e) {
        return Response.error("69Shuba chương: " + e.message);
    }
}
