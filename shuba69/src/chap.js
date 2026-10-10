// Chapter pages and TOC may not share a charset. A valid Han character is
// never evidence of mojibake. Score only unambiguous corruption markers.
function shubaChapterEncodingQuality(doc) {
    var root = shubaContentRoot(doc);
    if (!root) return {valid: false, score: 1000000, chinese: 0};
    var chapter = "";
    var title = "";
    try {
        chapter = String(root.text() || "");
        if (!chapter.trim()) chapter = String(root.html() || "").replace(/<[^>]+>/g, " ");
    } catch (ignored) {}
    try {
        var titles = doc.select(".txtnav h1, h1");
        if (titles && titles.size()) title = String(titles.first().text() || "");
    } catch (ignoredTitle) {}
    var sample = (title + " " + chapter).slice(0, 6000);
    if (!sample.trim()) return {valid: false, score: 1000000, chinese: 0};
    var bad = (sample.match(/\uFFFD/g) || []).length;
    var unmistakable = (sample.match(/锟斤拷|銆€|鐨勮|鍙戝|宸茬粡|瀛楃|鏂囧/g) || []).length;
    var han = (sample.match(/[\u3400-\u9fff]/g) || []).length;
    return {valid: true, score: bad * 100 + unmistakable * 30, chinese: han};
}
function shubaSafeHtml(response, target) {
    // The TOC on 69Shuba is correctly decoded with GBK. Retain GBK for
    // chapters unless the decoded chapter actually contains broken glyphs.
    var original = response.html("gbk");
    if (!original || typeof original.select !== "function") return original;
    var first = shubaChapterEncodingQuality(original);
    if (!first.valid || first.score === 0) return original;
    // VBook HTTP responses are potentially one-shot; use a fresh request.
    try {
        var secondResponse = fetch(target);
        if (!secondResponse || !secondResponse.ok) return original;
        var alternate = secondResponse.html("utf-8");
        if (!alternate || typeof alternate.select !== "function") return original;
        var other = shubaChapterEncodingQuality(alternate);
        // An empty error/challenge page must not beat a real Chinese chapter.
        if (other.valid && other.chinese > 0 && other.score < first.score)
            return alternate;
    } catch (ignoredRetry) {}
    return original;
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
function shubaStripEmbeddedTitle(html, pageTitle) {
    var source = String(html || "");
    var expected = String(pageTitle || "").replace(/\s+/g, "").trim();
    var matchExpected = expected.match(/(?:第\s*)?(\d{1,8})\s*(?:章|回|节|卷|绔)/);
    var expectedNumber = matchExpected ? matchExpected[1] : "";
    var tokens = source.match(/<[^>]*>|[^<]+/g);
    if (!tokens) return source;
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token.charAt(0) === "<") continue;
        var prefix = token.match(/^(?:(?:\s|\u3000)|&(?:emsp|nbsp);|&#(?:12288|160|x3000);)*/i);
        var start = prefix ? prefix[0].length : 0;
        if (start >= token.length) continue;
        var rest = token.slice(start);
        var stop = rest.search(/[\r\n]/);
        var firstLine = (stop === -1 ? rest : rest.slice(0, stop)).trim();
        if (!firstLine || firstLine.length > 110) return source;
        var plain = firstLine.replace(/&(?:nbsp|emsp);|&#(?:12288|160|x3000);/gi, " ")
                             .replace(/\s+/g, " ").trim();
        var number = plain.match(/^(?:第|绗)\s*(\d{1,8})\s*(?:章|回|节|卷|绔|绔犲|锛|:\s|：\s|\s)/);
        var chineseHeading = /^(?:第\s*[一二三四五六七八九十百千万零〇两]{1,12}\s*[章回节卷]|(?:\d{1,8})[.．、：:]\s*\S)/.test(plain);
        var comparable = !!expected && plain.replace(/\s+/g, "") === expected;
        var sameChapter = !!(number && (!expectedNumber || String(Number(number[1])) === String(Number(expectedNumber))));
        var headingBoundary = /^(?:第\s*\d{1,8}\s*[章回节卷](?:\s|[.．、:：]|\d|$)|绗\s*\d{1,8}\s*(?:绔|章|回|卷))/.test(plain);
        if (!(comparable || (sameChapter && headingBoundary) || (!expected && chineseHeading))) return source;
        tokens[i] = (stop === -1 ? "" : rest.slice(stop));
        return tokens.join("");
    }
    return source;
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
