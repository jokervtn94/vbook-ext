load("crypto.js");
load("config.js");
function execute(key, page) {
    var query = String(key || "").trim();
    if (!query) return Response.success([], null);
    try {
        var wd = encodeURIComponent(query);
        var sign = String(CryptoJS.MD5("wd=" + query + QM_SALT));
        var url = QM_BC + "/api/v7/search/words?wd=" + wd + "&sign=" + sign;
        var info = qmApi(url);
        var books = info.books || [];
        if (!Array.isArray(books)) throw new Error("API tìm kiếm đổi định dạng books");
        var data = [], seen = {};
        books.forEach(function(book) {
            if (!book || Number(book.show_type) === 4 || Number(book.show_type) === 2) return;
            var link = qmBookUrl(book.id || book.book_id);
            var name = qmSearchName(book.original_title || book.title || book.book_name);
            if (!link || !name || seen[link]) return;
            seen[link] = true;
            data.push({
                name:name, link:link,
                cover:qmAbsolute(book.image_link || book.thumb_image_link || ""),
                description:qmSearchName(book.original_author || book.author || ""),
                host:QM_WEB
            });
        });
        // This v7 endpoint returns ranked results, not the VBook page cursor.
        return Response.success(data, null);
    } catch (e) {
        return Response.error("Qimao tìm kiếm: " + (e && e.message ? e.message : e));
    }
}
