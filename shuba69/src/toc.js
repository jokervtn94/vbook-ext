function execute(url) {
    var host = "https://www.69shuba.com";
    var m = String(url).match(/\/book\/(\d+)/);
    if (!m) return Response.error("69Shuba: URL truyện không hợp lệ");
    var bookid = m[1], target = host + "/book/" + bookid + "/";
    try {
        var response = fetch(target);
        if (!response.ok) return Response.error("69Shuba mục lục HTTP " + response.status);
        var doc = response.html();
        var els = doc.select("#catalog ul li a, #catalog li a");
        if (!els.size()) els = doc.select("a[href*='/txt/" + bookid + "/']");
        var items = [], seen = {};
        for (var i = 0; i < els.size(); i++) {
            var el = els.get(i), href = el.attr("href") || "", name = el.text().trim();
            if (!/\/txt\/\d+\/\d+/.test(href) || !name) continue;
            var full = href.indexOf("//") === 0 ? "https:" + href :
                       /^https?:\/\//.test(href) ? href : href.charAt(0)==="/" ? host + href : host + "/txt/" + bookid + "/" + href;
            if (seen[full]) continue;
            seen[full] = true;
            items.push({name:name,url:full,host:host});
        }
        if (items.length > 1) {
            var first = items[0].name.match(/第\s*(\d+)\s*章/), last = items[items.length - 1].name.match(/第\s*(\d+)\s*章/);
            if (first && last && Number(first[1]) > Number(last[1])) items.reverse();
        }
        if (!items.length) return Response.error("69Shuba: không tìm thấy danh sách chương");
        return Response.success(items);
    } catch (e) {
        return Response.error("69Shuba mục lục: " + e.message);
    }
}
