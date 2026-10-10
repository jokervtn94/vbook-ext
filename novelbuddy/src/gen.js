function execute(url, page) {
    if (!page) page = '1';
    var address = 'https://novelbuddy.me/' + (url || 'latest').replace(/^\//, '');
    var response = fetch(address + '?page=' + encodeURIComponent(page));
    if (!response.ok) return null;
    var items = [], host = 'https://novelbuddy.me';
    response.html().select('article').forEach(function(e) {
        var a = e.select('a[href]').first();
        var href = a.attr('href');
        var img = e.select('img').first();
        var title = img.attr('alt') || a.attr('aria-label') || a.text();
        var cover = img.attr('src') || img.attr('data-src');
        if (!href || !title || href.indexOf('/chapter-')>=0) return;
        if (cover && cover.indexOf('//')===0) cover='https:'+cover;
        else if (cover && cover.charAt(0)==='/') cover=host+cover;
        items.push({name:title,link:href,cover:cover||'',description:'',host:host});
    });
    return Response.success(items, items.length ? String(parseInt(page,10)+1) : null);
}
