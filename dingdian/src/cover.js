var DD_HOST = "https://www.dingdian666.com";

function ddCoverUrl(input) {
    var value = String(input || "").trim();
    if (!value || /^(?:data:|blob:|javascript:|about:)/i.test(value)) return "";
    if (value.indexOf("//") === 0) value = "https:" + value;
    else if (value.charAt(0) === "/") value = DD_HOST + value;
    else if (!/^https?:\/\//i.test(value)) value = DD_HOST + "/" + value.replace(/^\.\//, "");
    value = value.replace(/^http:/i, "https:");
    // Normalize the main Dingdian domain so every book returns consistent image URLs.
    value = value.replace(/^https:\/\/(?:m\.)?dingdian666\.com(?=\/)/i, DD_HOST);
    if (!/^https:\/\//i.test(value)) return "";
    if (/\/(?:style\/logo(?:-wap)?\.png|files\/article\/image\/000\.jpg)(?:[?#]|$)/i.test(value)) return "";
    return value;
}

function ddImgAttr(img) {
    if (!img) return "";
    var fields = ["src", "data-original", "data-src", "data-lazy-src"];
    for (var i = 0; i < fields.length; i++) {
        var candidate = ddCoverUrl(img.attr(fields[i]));
        if (candidate) return candidate;
    }
    return "";
}

function ddNodes(doc, selector) {
    if (!doc || typeof doc.select !== "function") return null;
    var nodes = doc.select(selector);
    return nodes && typeof nodes.size === "function" && nodes.size() > 0 ? nodes : null;
}

function ddCoverFromDoc(doc) {
    var selectors = [
        ".border_left a img",
        ".border_left img",
        ".bookinfo img",
        ".book img",
        ".book-cover img"
    ];
    for (var i = 0; i < selectors.length; i++) {
        var nodes = ddNodes(doc, selectors[i]);
        if (nodes) {
            var image = ddImgAttr(nodes.first());
            if (image) return image;
        }
    }
    var metas = ["meta[property='og:image']", "meta[name='og:image']", "meta[name='twitter:image']"];
    for (var j = 0; j < metas.length; j++) {
        var match = ddNodes(doc, metas[j]);
        if (match) {
            var cover = ddCoverUrl(match.first().attr("content"));
            if (cover) return cover;
        }
    }
    return "";
}

function ddCoverFromListItem(row) {
    var imgs = ddNodes(row, "img");
    if (!imgs) return "";
    for (var i = 0; i < imgs.size(); i++) {
        var cover = ddImgAttr(imgs.get(i));
        if (cover) return cover;
    }
    return "";
}

// The category .lastupdate rows contain NO <img>. The image file ID is
// different from the public /xiaoshuo/<book id>, so never invent image paths.
// Fetch each book detail once per listing page and use the real HTML cover URL.
function ddCoverFromBook(link, cache) {
    var m = String(link || "").match(/\/xiaoshuo\/(\d+)(?:\/|$|\?)/i);
    if (!m) return "";
    var id = m[1];
    if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
    var cover = "";
    try {
        var response = Http.get(DD_HOST + "/xiaoshuo/" + id + "/");
        if (response && typeof response.html === "function") {
            cover = ddCoverFromDoc(response.html());
        }
    } catch (e) {
        // A blocked/missing image must not break the entire catalog.
    }
    cache[id] = cover;
    return cover;
}
