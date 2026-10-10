function execute(category, page) {
    if (page && parseInt(page, 10) > 1) return Response.success([], null);
    var url = category && /^https?:\/\//i.test(category) ?
        category : 'https://ac.qq.com/Comic/all';
    var response = fetch(url);
    if (!response.ok) return null;
    var list = [], seen = {};
    response.html().select('a.mod-cover-list-thumb[href]').forEach(function(a) {
        var href = a.attr('href') || '';
        if (!href || seen[href]) return;
        var img = a.select('img').first();
        var cover = img.attr('data-original') || img.attr('src') || '';
        if (cover.indexOf('//') === 0) cover = 'https:' + cover;
        else if (cover.charAt(0) === '/') cover = 'https://ac.qq.com' + cover;
        var name = a.attr('title') || img.attr('alt') || a.text();
        if (!name || !cover) return;
        if (href.charAt(0) === '/') href = 'https://ac.qq.com' + href;
        seen[href] = true;
        list.push({name:name,link:href,cover:cover,description:'',host:'https://ac.qq.com'});
    });
    return Response.success(list, null);
}
