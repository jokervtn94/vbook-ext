// Select actual UTF-8 or legacy GBK using decoded characters.
// Some 69Shuba responses declare GBK but carry UTF-8 bytes.
function shubaSample(doc, kind) {
    if (!doc || typeof doc.select !== "function") return "";
    var selectors = ["title", "h1", "meta[property='og:novel:book_name']",
        "meta[property='og:novel:author']", "meta[property='og:description']"];
    if (kind === "toc") selectors = [
        "#catalog li a[href*='/txt/'], #catalog ul li a",
        "#catalog li a", "#catalog a", "a[href*='/txt/']", "title"];
    else if (kind === "gen" || kind === "search")
        selectors = [
            "h3 a[href*='/book/'], h4 a[href*='/book/'], .bookbox a[href*='/book/']",
            ".newbox ul li h3 a, .bookbox h3 a, h3 a[href*='/book/'], h4 a[href*='/book/']",
            "h3 a[href*='/book/']", "h4 a[href*='/book/']", ".newbox li h3", ".bookbox h3", "title"];
    else if (kind === "chap")
        selectors = [".txtnav h1", ".txtnav", "#content", "#txt", "title"];
    else selectors.push(".booknav2", ".navtxt p", ".navtxt");
    var fragments = [];
    for (var i = 0; i < selectors.length; i++) {
        try {
            var nodes = doc.select(selectors[i]);
            if (!nodes || typeof nodes.size !== "function" || !nodes.size()) continue;
            var limit = Math.min(nodes.size(), kind === "toc" ? 5 : 2);
            for (var j = 0; j < limit; j++) {
                var n = nodes.get(j);
                if (!n) continue;
                var value = selectors[i].indexOf("meta[") === 0 ?
                    String(n.attr("content") || "") : String(n.text() || "");
                if (!value && typeof n.html === "function")
                    value = String(n.html() || "").replace(/<[^>]*>/g, " ");
                if (value) fragments.push(value.slice(0, 900));
            }
            if (kind === "toc" && nodes.size() > 8) {
                var last = nodes.get(nodes.size() - 1);
                if (last) fragments.push(String(last.text() || "").slice(0, 200));
            }
        } catch (ignored) {}
    }
    return fragments.join(" ").slice(0, 6000);
}
function shubaCharsetCost(sample) {
    var text = String(sample || "");
    if (!text) return 10000;
    var invalid = (text.match(/\uFFFD/g) || []).length;
    var control = (text.match(/[\u0000-\u0008\u000b-\u001f]/g) || []).length;
    var mojibake = (text.match(/(?:锟斤拷|馃|銆€|涓€|鐨勮|鍙戝|宸茬粡|瀛楃|鏂囧)/g) || []).length;
    return invalid * 1000 + control * 100 + mojibake * 20;
}
function shubaDocument(response, kind) {
    if (!response || typeof response.html !== "function") return null;
    var charsets = ["utf-8", "gbk"];
    var best = null, bestCost = 1e10;
    for (var i = 0; i < charsets.length; i++) {
        try {
            var doc = response.html(charsets[i]);
            if (!doc || typeof doc.select !== "function") continue;
            var cost = shubaCharsetCost(shubaSample(doc, kind));
            if (cost < bestCost) { best = doc; bestCost = cost; }
            if (cost === 0 && i === 0) break;
        } catch (ignored) {}
    }
    return best;
}
