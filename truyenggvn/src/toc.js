load("config.js");
function ggChapterValue(url) {
    var value = String(url || "").match(/-chap-(\d+(?:[.-]\d+)*)\.html/i);
    if (!value) return -1;
    return parseFloat(value[1].replace("-", ".")) || 0;
}
function execute(url) {
    var target = ggStory(url) || ggAbs(url);
    return ggWithDoc(target, function(doc) {
        var anchors = ggSelect(doc, [
            ".list_chap a[href*='-chap-']",
            ".list_chap a",
            ".list-chapter a[href*='-chap-']",
            ".chapter-list a[href*='-chap-']",
            "a[href*='/truyen-tranh/'][href*='-chap-']"
        ]);
        if (!anchors) return Response.error("TruyenGGVN: không tìm thấy mục lục chương.");
        var data = [], seen = {};
        anchors.forEach(function(a) {
            var href = ggAbs(a.attr("href") || "");
            if (!/-chap-[0-9]+(?:[.-][0-9]+)*\.html/i.test(href) || seen[href]) return;
            seen[href] = true;
            data.push({name:String(a.text() || "").trim() || "Chương " + ggChapterValue(href), url:href, host:GG_HOST});
        });
        if (!data.length) return Response.error("TruyenGGVN: mục lục không có chương hợp lệ.");
        if (data.length > 1 && ggChapterValue(data[0].url) > ggChapterValue(data[data.length - 1].url)) {
            data.reverse();
        }
        return Response.success(data);
    });
}
