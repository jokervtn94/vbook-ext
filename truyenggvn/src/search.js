load("config.js");
load("gen.js");
function execute(key, page) {
    var p = parseInt(page || "1", 10);
    if (!(p > 0)) p = 1;
    var query = encodeURIComponent(String(key || "").trim());
    if (!query) return Response.success([], null);
    return ggWithDoc(GG_HOST + "/tim-kiem/trang-" + p + ".html?q=" + query, function(doc) {
        return ggListings(doc, p);
    });
}
