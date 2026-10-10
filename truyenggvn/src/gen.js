load("config.js");
function ggListings(doc, page) {
    var items = ggSelect(doc, [
        ".list_item_home .item_home",
        ".list_item_home .item",
        ".list_item_home .story-item",
        ".item_home",
        ".story-item",
        ".comic-item"
    ]);
    var data = [], seen = {};
    var cards = items || ggSelect(doc, [
        "a.book_name[href*='/truyen-tranh/'], h3 a[href*='/truyen-tranh/']",
        "a[href*='/truyen-tranh/']"
    ]);
    if (cards) cards.forEach(function(card) {
        var anchor = ggSelect(card, [
            "a.book_name, .title a, h3 a, a[href*='/truyen-tranh/']"
        ]);
        var link = anchor ? anchor.first() : card;
        var url = ggStory(link.attr("href") || "");
        if (!url || seen[url]) return;
        var name = String(link.text() || "").replace(/\s+/g, " ").trim();
        if (!name || name.length > 180) return;
        var imageNodes = ggSelect(card, ["img"]);
        var cover = imageNodes ? ggImage(imageNodes.first()) : "";
        var description = ggText(card, [".chapter", ".chapter-name", ".last-chapter", ".author", ".text-info"]);
        seen[url] = true;
        data.push({name:name, link:url, cover:cover, description:description, host:GG_HOST});
    });
    if (!data.length) return Response.error("TruyenGGVN: không tìm thấy truyện trong danh sách.");
    return Response.success(data, ggNext(doc, page));
}
function execute(input, page) {
    var p = parseInt(page || "1", 10);
    if (!(p > 0)) p = 1;
    var base = String(input || GG_HOST + "/truyen-moi-cap-nhat.html")
        .replace(/^https?:\/\/[^/]+/i, GG_HOST).replace(/[?#].*$/, "")
        .replace(/\/trang-\d+\.html$/i, ".html").replace(/\.html$/i, "")
        .replace(/\/+$/, "");
    if (base.indexOf(GG_HOST + "/") !== 0) base = GG_HOST + "/truyen-moi-cap-nhat";
    return ggWithDoc(base + "/trang-" + p + ".html", function(doc) {
        return ggListings(doc, p);
    });
}
