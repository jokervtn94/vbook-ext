load("crypto.js");
function execute(url) {
    var match = String(url).match(/\/shuku\/(\d+)/) || String(url).match(/\/(\d+)(?:\/|$)/);
    if (!match) return Response.error("Qimao: URL truyện không chứa ID hợp lệ");
    var bookid = match[1];
    try {
        var sign = CryptoJS.MD5("id=" + bookid + "d3dGiJc651gSQ8w1");
        var response = fetch(
            "https://api-bc.wtzw.com/api/v5/book/detail?id=" + bookid + "&sign=" + sign, {
                method: "GET",
                headers: {
                    "platform": "android",
                    "app-version": "71900",
                    "application-id": "com.kmxs.reader",
                    "sign": String(CryptoJS.MD5(
                        "app-version=71900application-id=com.kmxs.readerplatform=androidd3dGiJc651gSQ8w1"
                    )),
                    "user-agent": "webviewversion/0"
                }
            }
        );
        if (!response.ok) return Response.error("Qimao thông tin HTTP " + response.status);
        var payload = response.json();
        var info = payload && payload.data || {};
        var book = info.book;
        if (!book || !book.title) return Response.error("Qimao: API không trả dữ liệu truyện");
        var authorInfo = info.author_info || {};
        // author_uid is an internal account identifier, NOT the author's name.
        var author = String(book.author || authorInfo.name || authorInfo.author_name || "");
        return Response.success({
            name: String(book.title),
            cover: String(book.thumb_image_link || book.image_link || ""),
            author: author,
            description: String(book.intro || ""),
            detail: String(book.latest_chapter_title || ""),
            ongoing: Number(book.is_over) === 0,
            host: "https://api-bc.wtzw.com"
        });
    } catch (e) {
        return Response.error("Qimao thông tin: " + e.message);
    }
}
