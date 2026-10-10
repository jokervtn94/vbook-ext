load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    var address = url.indexOf('http') === 0 ? url : BASE_URL + '/' + url.replace(/^\//, '');
    var separator = address.indexOf('?') >= 0 ? '&' : '?';
    var response = fetch(address + separator + 'page=' + page);
    if (!response.ok) return null;
    var doc = response.html();
    var data = [];
    doc.select('ul.mh-list li').forEach(function(e) {
        var a = e.select('a[href*="/comic/"]').last();
        var name = a.text() || a.attr('title');
        var href = a.attr('href');
        if (!name || !href) return;
        var style = e.select('p.mh-cover').first().attr('style') || '';
        var match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
        var img = e.select('img').first();
        var cover = img.attr('data-src') || img.attr('src') || (match ? match[1] : '');
        if (cover && cover.indexOf('//') === 0) cover = 'https:' + cover;
        else if (cover && cover.charAt(0) === '/') cover = BASE_URL + cover;
        data.push({name:name, link:href, cover:cover, description:e.select('.chapter').text(), host:BASE_URL});
    });
    return Response.success(data, data.length ? String(parseInt(page,10)+1) : null);
}
