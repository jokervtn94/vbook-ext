load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    url = url.replace(".html", "") + "/trang-" + page + ".html";
    var doc = fetch(BASE_URL + url).html();
    if (doc) {
        var novelList = [];
        var next = doc.select(".pagination").select("a.active + a").last().text();
        doc.select(".list_item_home .item_home").forEach(e => {
            var cover = e.select(".image-cover img").attr("data-src");
            if (cover.startsWith("//")) {
                cover = "http:" + cover;
            }
            novelList.push({
                
                name: e.select("a.book_name").text(),
                link: e.select("a.book_name").first().attr("href"),
                description: e.select('a').last().text(),
                cover: cover,
                host: BASE_URL
            });
        })
        return Response.success(novelList, next)
    }
    return null;
}