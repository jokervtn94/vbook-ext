load('config.js');
function execute(category, page) {
    if (page && parseInt(page, 10) > 1) return Response.success([], null);
    var response = fetch(BASE_URL + '/');
    if (!response.ok) return Response.error('Unable to load Omega Scans homepage');
    var doc = response.html(), items = [], seen = {};
    doc.select('a[href^="/series/"]').forEach(function(link) {
        var href = link.attr('href') || '';
        if (!/^\/series\/[a-z0-9-]+\/?$/i.test(href) || seen[href]) return;
        var img = link.select('img[src]').first();
        var cover = omegaCover(img.attr('src') || '');
        if (!cover) return;
        var name = link.text().trim() || img.attr('alt') || '';
        if (!name) {
            name = href.replace(/^\/series\//, '').replace(/\/$/, '').replace(/-/g,' ');
            name = name.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        }
        seen[href] = true;
        items.push({name:name, link:BASE_URL+href, cover:cover, description:'', host:BASE_URL});
    });
    return Response.success(items, null);
}
