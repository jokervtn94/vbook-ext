load("config.js");
function execute() {
    return ggWithDoc(GG_HOST, function(doc) {
        var nodes = ggSelect(doc, ["a[href*='/the-loai/']"]);
        if (!nodes) return Response.error("TruyenGGVN: không tìm thấy thể loại.");
        var data = [], seen = {};
        nodes.forEach(function(a) {
            var href = ggAbs(a.attr("href") || "");
            var label = String(a.text() || "").trim();
            var match = href.match(/\/the-loai\/[a-z0-9-]+\.html/i);
            if (!match || !label || seen[match[0]]) return;
            seen[match[0]] = true;
            data.push({title:label, input:GG_HOST + match[0], script:"gen.js"});
        });
        return data.length ? Response.success(data) : Response.error("TruyenGGVN: danh sách thể loại rỗng.");
    });
}
