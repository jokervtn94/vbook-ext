var QM_WEB = "https://www.qimao.com";
var QM_BC = "https://api-bc.wtzw.com";
var QM_KS = "https://api-ks.wtzw.com";
var QM_SALT = "d3dGiJc651gSQ8w1";
function qmBookId(input) {
    var s = String(input == null ? "" : input).trim();
    if (/^\d+$/.test(s)) return s;
    var m = s.match(/\/shuku\/(\d+)(?:\/|[?#]|$)/i) ||
            s.match(/[?&]id=(\d+)(?:&|$)/i) ||
            s.match(/\/(?:books?|ebooks?)\/(\d+)(?:\/|[?#]|$)/i);
    return m ? m[1] : "";
}
function qmBookUrl(input) {
    var id = qmBookId(input);
    return id ? QM_WEB + "/shuku/" + id + "/" : "";
}
function qmAbsolute(url) {
    var s = String(url || "").trim();
    if (!s || /^(?:data:|blob:|javascript:)/i.test(s)) return "";
    if (s.slice(0, 2) === "//") return "https:" + s;
    if (/^https?:\/\//i.test(s)) return s.replace(/^http:/i, "https:");
    if (s.charAt(0) === "/") return QM_WEB + s;
    return QM_WEB + "/" + s.replace(/^\.\//, "");
}
function qmText(element, selector) {
    if (!element || typeof element.select !== "function") return "";
    var found = element.select(selector);
    return found && found.size && found.size() ? String(found.first().text() || "").replace(/\s+/g, " ").trim() : "";
}
function qmAttr(element, selector, name) {
    if (!element || typeof element.select !== "function") return "";
    var found = element.select(selector);
    return found && found.size && found.size() ? String(found.first().attr(name) || "").trim() : "";
}
function qmChallenge(doc) {
    if (!doc || typeof doc.select !== "function") return false;
    var markers = doc.select(".cf-turnstile, #challenge-form, #cf-challenge-running");
    if (markers && markers.size && markers.size()) return true;
    var title = qmText(doc, "title");
    return /just a moment|cloudflare|checking your browser|attention required/i.test(title);
}
function qmWebDoc(url, parse) {
    var browser = null, blocked = false;
    try {
        var response = fetch(url);
        if (response.ok) {
            var doc = response.html();
            blocked = qmChallenge(doc);
            if (doc && !blocked) return parse(doc);
        } else {
            blocked = response.status === 403 || response.status === 429 || response.status === 503;
            if (!blocked) return Response.error("Qimao trang web HTTP " + response.status);
        }
        if (typeof Engine !== "undefined" && Engine.newBrowser) {
            try {
                browser = Engine.newBrowser();
                var rendered = browser.launch(url, 12000);
                if (!rendered || qmChallenge(rendered)) rendered = browser.html(1500);
                if (rendered && !qmChallenge(rendered)) return parse(rendered);
                blocked = blocked || qmChallenge(rendered);
            } catch (ignored) {}
        }
        return Response.error(blocked ?
            "Qimao đang yêu cầu xác minh trình duyệt. Hãy mở website trong VBook và xác minh thủ công, sau đó tải lại. Nếu vẫn bị chặn, phiên xác minh có thể không được chia sẻ." :
            "Qimao: không tải được dữ liệu từ website.");
    } catch (e) {
        return Response.error("Qimao website: " + (e && e.message ? e.message : e));
    } finally {
        if (browser) try { browser.close(); } catch (ignoreClose) {}
    }
}
function qmHeaders() {
    return {
        "platform": "android",
        "app-version": "71900",
        "application-id": "com.kmxs.reader",
        "sign": String(CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + QM_SALT)),
        "user-agent": "webviewversion/0"
    };
}
function qmApi(url) {
    var response = fetch(url, {method:"GET", headers:qmHeaders()});
    if (!response.ok) throw new Error("API HTTP " + response.status);
    var payload = response.json();
    if (!payload || typeof payload !== "object") throw new Error("API trả dữ liệu không hợp lệ");
    if (payload.code != null && String(payload.code) !== "0" && String(payload.code) !== "200")
        throw new Error("API mã " + payload.code + ": " + String(payload.msg || payload.message || "").slice(0, 90));
    if (!payload.data || typeof payload.data !== "object") throw new Error("API không có dữ liệu");
    return payload.data;
}
function qmSearchName(text) {
    return String(text == null ? "" : text).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}
