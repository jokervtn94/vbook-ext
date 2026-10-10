// 69Shuba pages may declare GBK while serving UTF-8, or really use GBK.
// Start with UTF-8 and only retry a fresh HTTP response when decoding looks bad.
// Do not parse the same VBook HTTP response twice.
function shubaChapterEncodingQuality(doc) {
    if (!doc || typeof doc.select !== "function")
        return {valid: false, score: 1000000, chinese: 0};
    var root = shubaContentRoot(doc);
    if (!root) return {valid: false, score: 1000000, chinese: 0};
    var chapter = "", title = "";
    try {
        chapter = String(root.text() || "");
        if (!chapter.trim()) chapter = String(root.html() || "").replace(/<[^>]*>/g, " ");
    } catch (ignored) {}
    try {
        var headings = doc.select(".txtnav h1, h1");
        if (headings && headings.size()) title = String(headings.first().text() || "");
    } catch (ignoredTitle) {}
    var sample = (title + " " + chapter).slice(0, 12000);
    if (!sample.trim()) return {valid: false, score: 1000000, chinese: 0};
    var invalid = (sample.match(/\uFFFD/g) || []).length;
    var controls = (sample.match(/[\u0000-\u0008\u000b-\u001f]/g) || []).length;
    // Highly distinctive mojibake sequences only. Ordinary Han characters
    // (such as 涓, 锛, 濡) are not sufficient to declare corruption.
    var signatures = (sample.match(/锟斤拷|銆€|鐨勮|鍙戝|宸茬粡|瀛楃|鏂囧|绗\s*\d{1,8}\s*绔|Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]/g) || []).length;
    var chinese = (sample.match(/[\u3400-\u9fff]/g) || []).length;
    return {valid: true, score: invalid * 1000 + controls * 100 + signatures * 50, chinese: chinese};
}
function shubaSafeHtml(response, target) {
    var utfDoc = null, utfQuality = {valid: false, score: 1000000, chinese: 0};
    try {
        utfDoc = response.html("utf-8");
        utfQuality = shubaChapterEncodingQuality(utfDoc);
    } catch (ignoredUtf8) {}
    // UTF-8 is unambiguous when it contains actual readable chapter content
    // and no replacement characters or known mojibake.
    if (utfQuality.valid && utfQuality.score === 0) return utfDoc;
    var gbkDoc = null, gbkQuality = {valid: false, score: 1000000, chinese: 0};
    try {
        var retry = fetch(target);
        if (retry && retry.ok) {
            gbkDoc = retry.html("gbk");
            gbkQuality = shubaChapterEncodingQuality(gbkDoc);
        }
    } catch (ignoredGbk) {}
    if (gbkQuality.valid &&
        (!utfQuality.valid || (gbkQuality.score < utfQuality.score && gbkQuality.chinese > 0)))
        return gbkDoc;
    return utfDoc || gbkDoc;
}

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


function shubaChapterTitleText(doc) {
    if (!doc || typeof doc.select !== "function") return "";
    try {
        var headings = doc.select(".txtnav h1, h1");
        if (headings && headings.size()) return String(headings.first().text() || "").trim();
    } catch (ignored) {}
    return "";
}
// The reader already knows chapter names from toc.js. Strip only a duplicate
// leading heading inside the HTML body; do not touch chapter content or the TOC.
// Strip duplicate chapter headings at the start of the chapter body.
// VBook itself already displays the correct chapter title from toc.js.
// Never replace prose text or alter the TOC.
function shubaNormalizeHeading(text) {
    return String(text || "")
        .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, function (_, hex, dec) {
            var value = parseInt(hex || dec, hex ? 16 : 10);
            return value > 0 && value < 65536 ? String.fromCharCode(value) : " ";
        })
        .replace(/&(?:nbsp|emsp|ensp|thinsp);/gi, " ")
        .replace(/[\s\u3000]+/g, " ").trim();
}
function shubaHeadingNumber(value) {
    var text = shubaNormalizeHeading(value);
    var match = text.match(/^(?:第|绗|[\uFFFD\s\u3000]){0,12}(\d{1,8})(?=\D|$)/);
    return match ? String(parseInt(match[1], 10)) : "";
}
function shubaLooksLikeChapterHeading(text, expected, expectedNumber) {
    var line = shubaNormalizeHeading(text);
    if (!line || line.length > 130) return false;
    if (expected && line.replace(/\s+/g, "") === expected.replace(/\s+/g, "")) return true;
    var number = shubaHeadingNumber(line);
    if (expectedNumber && number !== expectedNumber) return false;
    // A sentence about a numbered chapter is prose, not a duplicated title.
    var standard = /^(?:第\s*\d{1,8}\s*[章回节卷](?![的里中后是])(?:\s|[.．、:：]|$)|\d{1,8}\s*[.．、:：]\s*\S|绗\s*\d{1,8}\s*(?:绔|章|回|卷))/.test(line);
    if (number && standard) return true;
    // A malformed heading can start with ��1418��. Reject such a line
    // only when it is short, has multiple replacement glyphs and a near-start
    // chapter number. Real prose is never modified merely for a bad glyph.
    var invalid = (line.match(/\uFFFD/g) || []).length;
    var digit = line.search(/\d/);
    if (number && invalid >= 2 && digit >= 0 && digit <= 18 &&
        line.slice(0, Math.min(digit + 4, line.length)).indexOf("\uFFFD") !== -1)
        return true;
    return !expectedNumber && /^(?:第\s*[一二三四五六七八九十百千万零〇两]{1,12}\s*[章回节卷]|\d{1,8}\s*[.．、:：]\s*\S)/.test(line);
}
function shubaStripEmbeddedTitle(html, pageTitle) {
    var source = String(html || "");
    var expected = shubaNormalizeHeading(pageTitle);
    var expectedNumber = shubaHeadingNumber(expected);
    var tokens = source.match(/<[^>]*>|[^<]+/g);
    if (!tokens) return source;
    var removed = 0;
    // Some chapters contain two copies: one corrupted, another legible.
    // Stop immediately at the first real paragraph, and scan only the start.
    for (var i = 0; i < tokens.length && removed < 4; i++) {
        if (tokens[i].charAt(0) === "<") continue;
        var remaining = tokens[i];
        while (remaining && removed < 4) {
            var first = remaining.match(/^([^\r\n]*)(\r\n|\r|\n|$)/);
            if (!first) break;
            var line = shubaNormalizeHeading(first[1]);
            if (!line) {
                if (!first[2]) break;
                remaining = remaining.slice(first[0].length);
                continue;
            }
            if (!shubaLooksLikeChapterHeading(line, expected, expectedNumber)) {
                tokens[i] = remaining;
                return tokens.join("").replace(/<p\b[^>]*>\s*<\/p>/gi, "");
            }
            removed++;
            remaining = remaining.slice(first[0].length);
        }
        tokens[i] = remaining;
    }
    return tokens.join("").replace(/<p\b[^>]*>\s*<\/p>/gi, "").trim();
}

function execute(url) {
    var status = 0, doc = null, root = null, challenged = false;
    try {
        var response = fetch(url);
        status = response.status || 0;
        if (response.ok) {
            // Decode chapter by actual charset; WebView uses the browser encoding.
            doc = shubaSafeHtml(response,url);
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
        html = shubaStripEmbeddedTitle(html, shubaChapterTitleText(doc));
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
