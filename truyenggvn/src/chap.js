load("config.js");
function execute(url) {
    var target = ggAbs(url);
    return ggWithDoc(target, function(doc) {
        var nodes = ggSelect(doc, [
            ".content_detail img",
            "#chapter_content img",
            ".chapter-content img",
            ".reading-detail img",
            ".page-chapter img",
            ".chapter-detail img"
        ]);
        if (!nodes) return Response.error("TruyenGGVN: không tìm thấy khu vực ảnh chương.");
        var images = [], seen = {};
        nodes.forEach(function(node) {
            var image = ggImage(node);
            if (image && !seen[image]) {
                seen[image] = true;
                images.push(image);
            }
        });
        if (!images.length) return Response.error(
            "TruyenGGVN: chương không có ảnh hợp lệ; có thể ảnh chưa tải hoặc Cloudflare đang chặn.");
        return Response.success(images);
    });
}
