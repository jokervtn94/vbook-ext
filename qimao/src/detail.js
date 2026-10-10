load("crypto.js");
load("config.js");
function execute(url) {
    var id = qmBookId(url);
    if (!id) return Response.error("Qimao: ID truyện không hợp lệ");
    try {
        var sign = String(CryptoJS.MD5("id=" + id + QM_SALT));
        var data = qmApi(QM_BC + "/api/v5/book/detail?id=" + id + "&sign=" + sign);
        var book = data.book || data;
        var authorInfo = data.author_info || {};
        var name = qmSearchName(book.title || data.title || "");
        if (!name) return Response.error("Qimao: thông tin truyện thiếu tên");
        var author = qmSearchName(book.author || authorInfo.name || authorInfo.author_name || "");
        return Response.success({
            name:name,
            cover:qmAbsolute(book.thumb_image_link || book.image_link || book.big_image_link || ""),
            author:author,
            description:String(book.intro || book.description || ""),
            detail:String(book.latest_chapter_title || ""),
            ongoing:!/^(1|true)$/.test(String(book.is_over == null ? "" : book.is_over)),
            host:QM_WEB
        });
    } catch (e) {
        return Response.error("Qimao chi tiết: " + (e && e.message ? e.message : e));
    }
}
