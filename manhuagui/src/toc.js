load("lzstring.js");
function execute(url) {
    var match = String(url || "").match(/\/comic\/(\d+)(?:[/?#]|$)/i);
    if (!match) return Response.error("Manhua Gui: liên kết mục lục không hợp lệ.");
    var target = "https://www.manhuagui.com/comic/" + match[1] + "/";
    try {
        var response = fetch(target);
        if (!response) return Response.error("Manhua Gui: không có phản hồi khi tải mục lục.");
        if (!response.ok) return Response.error("Manhua Gui mục lục HTTP " + response.status);
        var doc = response.html();
        if (!doc || !doc.select) return Response.error("Manhua Gui: mục lục HTML trống.");
        var crypt = doc.select("input[id=__VIEWSTATE]").attr("value");
        var source = doc;
        if (crypt && typeof Html !== "undefined" && Html.parse) {
            try {
                var decoded = LZString.decompressFromBase64(crypt);
                if (decoded) source = Html.parse(decoded);
            } catch (ignored) { source = doc; }
        }
        var nodes = source.select(".chapter-list a");
        // Mobile layout also uses .chapter-list a; title attribute may be absent.
        if ((!nodes || !nodes.size()) && source !== doc)
            nodes = doc.select(".chapter-list a");
        var data = [], seen = {};
        if (nodes) {
            for (var i = nodes.size() - 1; i >= 0; i--) {
                var e = nodes.get(i);
                if (!e) continue;
                var href = String(e.attr("href") || "").trim();
                if (!/\/comic\/\d+\/\d+\.html(?:[?#]|$)/.test(href)) continue;
                var link = href.indexOf("//") === 0 ? "https:" + href :
                           /^https?:\/\//i.test(href) ? href :
                           "https://www.manhuagui.com" + (href.charAt(0) === "/" ? href : "/" + href);
                if (seen[link]) continue;
                var title = String(e.attr("title") || e.text() || "").replace(/\s+/g, " ").trim();
                if (!title) title = "Chương " + (data.length + 1);
                seen[link] = true;
                data.push({name:title,url:link,host:"https://www.manhuagui.com"});
            }
        }
        return data.length ? Response.success(data) :
            Response.error("Manhua Gui: không có chương trong trang nguồn.");
    } catch (e) {
        return Response.error("Manhua Gui mục lục: " + (e && e.message ? e.message : e));
    }
}
