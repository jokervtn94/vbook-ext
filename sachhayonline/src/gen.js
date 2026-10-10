function execute(url, page) {
    if (page && parseInt(page, 10) > 1) return Response.success([], null);
    var response = fetch(url);
    if (!response.ok) return null;
    var items = [];
    response.html().select('ul.default > li').forEach(function(li) {
        var a = li.select('a[href*="/tua-sach/"]').first();
        var href = a.attr('href') || '';
        var name = a.text() || a.attr('title') || '';
        if (!href || !name) return;
        if (href.indexOf('//') === 0) href = 'https:' + href;
        else if (href.charAt(0) === '/') href = 'https://www.sachhayonline.com' + href;
        var cover = li.select('img').first().attr('src') || '';
        if (cover.charAt(0) === '/') cover = 'https://www.sachhayonline.com' + cover;
        items.push({name:name,link:href,cover:cover,description:li.text(),host:'https://www.sachhayonline.com'});
    });
    return Response.success(items, null);
}
