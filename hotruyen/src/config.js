var BASE_URL = "https://hotruyen1.com";
try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        var configured = String(CONFIG_URL).trim().replace(/\/+$/, "");
        if (/^https?:\/\//i.test(configured)) BASE_URL = configured;
    }
} catch (ignored) {}
var HT_DEFAULT_COVER = BASE_URL + "/Asset/client/images/default.jpg";

function htAbsolute(value) {
    var url = String(value || "").trim().replace(/&amp;/g, "&");
    if (!url || /^(?:data:|blob:|javascript:|about:|#)/i.test(url)) return "";
    if (/^\/\//.test(url)) return "https:" + url;
    if (/^https?:\/\//i.test(url)) return url.replace(/^http:/i, "https:");
    if (url.charAt(0) === "/") return BASE_URL + url;
    // The site's legacy image references use ../Asset/client/images/...
    // regardless of whether the current page is /tim-truyen or /truyen/<id>.
    return BASE_URL + "/" + url.replace(/^(?:\.\.\/|\.\/)+/, "");
}
function htBookUrl(value) {
    var url = htAbsolute(value);
    var m = url.match(/\/truyen\/[^?#/]+/i);
    return m ? BASE_URL + m[0] : "";
}
function htText(root, selector) {
    if (!root || typeof root.select !== "function") return "";
    var el = root.select(selector);
    return el && el.size && el.size() ? String(el.first().text() || "").replace(/\s+/g, " ").trim() : "";
}
function htAttr(root, selector, key) {
    if (!root || typeof root.select !== "function") return "";
    var el = root.select(selector);
    return el && el.size && el.size() ? String(el.first().attr(key) || "").trim() : "";
}
function htIsDefault(url) {
    return /\/(?:Asset\/client\/images\/)?(?:default|no-?image|placeholder|loading)\.(?:jpg|jpeg|png|gif|webp)(?:[?#]|$)/i.test(url);
}
function htCoverImage(node) {
    if (!node) return "";
    var attrs = ["src", "data-original", "data-src", "data-lazy-src", "data-fb", "data-image"];
    var fallback = "";
    for (var i = 0; i < attrs.length; i++) {
        var url = htAbsolute(node.attr(attrs[i]));
        if (!url || /\.(?:svg)(?:[?#]|$)/i.test(url)) continue;
        if (htIsDefault(url)) { if (!fallback) fallback = url; continue; }
        return url;
    }
    return fallback;
}
function htCoverFrom(root) {
    var selectors = [".book img", ".cover img", ".book-cover img", ".sitem img", "img[data-original]", "img[data-src]"];
    var fallback = "";
    for (var i = 0; i < selectors.length; i++) {
        var nodes = root && root.select ? root.select(selectors[i]) : null;
        if (!nodes || !nodes.size) continue;
        for (var j = 0; j < nodes.size(); j++) {
            var candidate = htCoverImage(nodes.get(j));
            if (!candidate) continue;
            if (htIsDefault(candidate)) { if (!fallback) fallback = candidate; continue; }
            return candidate;
        }
    }
    var metas = ["meta[property='og:image']", "meta[name='twitter:image']"];
    for (var k = 0; k < metas.length; k++) {
        var meta = htAbsolute(htAttr(root, metas[k], "content"));
        if (meta && !htIsDefault(meta)) return meta;
        if (meta && !fallback) fallback = meta;
    }
    return fallback || HT_DEFAULT_COVER;
}
function htNext(doc, page) {
    var active = doc.select(".pagination li.active + li a");
    if (!active || !active.size || !active.size()) active = doc.select(".pagination li.active + li");
    if (!active || !active.size || !active.size()) return null;
    var node = active.first();
    var text = String(node.text() || "").trim();
    // A page-link may be nested in the adjacent li.
    if (!/^\d+$/.test(text) && node.select) text = String(htText(node,"a") || "").trim();
    var match = String(node.attr("href") || "").match(/[?&]pg=(\d+)/);
    if (match) text = match[1];
    return /^\d+$/.test(text) && Number(text) > Number(page) ? String(Number(page) + 1) : null;
}
function htPageUrl(input, page) {
    var url = htAbsolute(input || BASE_URL + "/nam-sinh");
    url = url.replace(/#.*$/, "").replace(/([?&])pg=\d+(&|$)/,"$1").replace(/[?&]$/,"");
    // Retired older category URLs only return "Chức năng này đã chuyển sang web mới".
    var legacy = {
        "/truyen-nam-sinh/":"/nam-sinh",
        "/truyen-ngon-tinh/":"/ngon-tinh",
        "/truyen-dam-my/":"/dam-my",
        "/truyen-vo-cp/":"/vo-cp",
        "/truyen-bach-hop/":"/bach-hop",
        "/truyen-khac/":"/khac"
    };
    var path = url.replace(/^https?:\/\/[^/]+/i,"");
    if (Object.prototype.hasOwnProperty.call(legacy,path)) url = BASE_URL + legacy[path];
    if (url.indexOf(BASE_URL + "/") !== 0 && url !== BASE_URL) url = BASE_URL + "/nam-sinh";
    var p = parseInt(page || "1",10);
    if (!(p > 0)) p = 1;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "pg=" + p;
}
