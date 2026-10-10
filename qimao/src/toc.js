load("crypto.js");
load("config.js");
function execute(url) {
    var id = qmBookId(url);
    if (!id) return Response.error("Qimao: ID truyện không hợp lệ khi tải mục lục");
    try {
        var sign = String(CryptoJS.MD5("id=" + id + QM_SALT));
        var data = qmApi(QM_KS + "/api/v1/chapter/chapter-list?id=" + id + "&sign=" + sign);
        var chapters = data.chapter_lists || data.chapters || [];
        if (!Array.isArray(chapters)) throw new Error("API mục lục đổi định dạng");
        var list = [], seen = {};
        chapters.forEach(function(chapter) {
            if (!chapter || !chapter.id || seen[String(chapter.id)]) return;
            seen[String(chapter.id)] = true;
            list.push({
                name:String(chapter.title || "Chương " + (list.length + 1)),
                url:"chapterId=" + chapter.id + "&id=" + id,
                host:QM_BC
            });
        });
        return list.length ? Response.success(list) : Response.error("Qimao: mục lục không có chương.");
    } catch (e) {
        return Response.error("Qimao mục lục: " + (e && e.message ? e.message : e));
    }
}
