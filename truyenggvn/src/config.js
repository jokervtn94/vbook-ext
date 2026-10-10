var GG_HOST = "https://truyenggvn.com";

function ggSelect(root, selectors) {
    if (!root || typeof root.select !== "function") return null;
    for (var i = 0; i < selectors.length; i++) {
        var nodes = root.select(selectors[i]);
        if (nodes && typeof nodes.size === "function" && nodes.size() > 0) return nodes;
    }
    return null;
}
function ggText(root, selectors) {
    var nodes = ggSelect(root, selectors);
    return nodes ? String(nodes.first().text() || "").replace(/\s+/g, " ").trim() : "";
}
function ggAttr(root, selectors, name) {
    var nodes = ggSelect(root, selectors);
    return nodes ? String(nodes.first().attr(name) || "").trim() : "";
}
function ggAbs(href) {
    var url = String(href || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, "https://");
    if (/^\/\//.test(url)) return "https:" + url;
    if (url.charAt(0) === "/") return GG_HOST + url;
    return GG_HOST + "/" + url;
}
function ggStory(href) {
    var url = ggAbs(href);
    var path = url.match(/\/truyen-tranh\/[^?#]+/i);
    if (!path || /-chap-[0-9.]+(?:\.html)?$/i.test(path[0])) return "";
    return GG_HOST + path[0].replace(/\.html$/i, "");
}
function ggImage(node) {
    if (!node) return "";
    var names = ["data-original", "data-src", "data-lazy-src", "data-url", "src"];
    for (var i = 0; i < names.length; i++) {
        var image = String(node.attr(names[i]) || "").trim();
        if (!image || /^(data:|javascript:|about:)/i.test(image) ||
            /(?:placeholder|loading|spinner|blank)\.(?:gif|png|svg)(?:\?|$)/i.test(image)) continue;
        return ggAbs(image);
    }
    return "";
}
function ggChallenge(doc) {
    if (!doc || typeof doc.select !== "function") return false;
    var indicators = doc.select("#challenge-form, #cf-challenge-running, .cf-turnstile");
    if (indicators && indicators.size && indicators.size()) return true;
    return /just a moment|checking your browser|attention required|cloudflare/i.test(ggText(doc, ["title"]));
}
function ggWithDoc(url, parser) {
    var browser = null, status = 0, challenged = false;
    try {
        var response = fetch(url);
        status = response.status || 0;
        if (response.ok) {
            var html = response.html();
            challenged = ggChallenge(html);
            if (html && !challenged) return parser(html);
        } else {
            challenged = status === 403 || status === 429 || status === 503;
            if (!challenged) return Response.error("TruyenGGVN HTTP " + status + ": " + url);
        }
        // WebView is a normal browser renderer, not a CAPTCHA bypass.
        if (typeof Engine !== "undefined" && Engine.newBrowser) {
            try {
                browser = Engine.newBrowser();
                var rendered = browser.launch(url, 12000);
                if (!rendered || ggChallenge(rendered)) rendered = browser.html(1200);
                if (rendered && !ggChallenge(rendered)) return parser(rendered);
                challenged = challenged || ggChallenge(rendered);
            } catch (browserError) {
                // Interactive verification may not be available to this WebView.
            }
        }
        if (challenged) return Response.error(
            "TruyenGGVN yêu cầu xác minh Cloudflare. Mở trang trong trình duyệt VBook, " +
            "xác minh thủ công rồi tải lại. Nếu vẫn bị chặn, phiên trình duyệt chưa được chia sẻ với extension."
        );
        return Response.error("TruyenGGVN: trang không có dữ liệu phù hợp hoặc chưa tải xong.");
    } catch (e) {
        return Response.error("TruyenGGVN: " + (e && e.message ? e.message : e));
    } finally {
        if (browser) {
            try { browser.close(); } catch (closeError) {}
        }
    }
}
function ggNext(doc, page) {
    var candidates = ggSelect(doc, [
        ".pagination a.active + a[href]",
        ".pagination li.active + li a[href]",
        ".pagination .active + a[href]",
        ".pagination a[rel=next]",
        ".pagination a.next[href]",
        ".pagination li.next a[href]"
    ]);
    if (!candidates) return null;
    var anchor = candidates.first();
    var href = anchor.attr("href") || "";
    var match = String(href).match(/\/trang-(\d+)\.html/i);
    if (match && Number(match[1]) > Number(page)) return match[1];
    var label = String(anchor.text() || "").trim();
    if (/^\d+$/.test(label) && Number(label) > Number(page)) return label;
    if (/^(?:next|tiếp|sau|»|›|→)$/i.test(label) && href) return String(Number(page) + 1);
    return null;
}
