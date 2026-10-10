function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var match = url.match(/\/id\/(\d+)/i);
    if (!match) return Response.error('Invalid Tencent Comic ID');
    var id = match[1], data = [], seen = {};
    response.html().select('a[href*="/ComicView/index/id/"]').forEach(function(a) {
        var href = a.attr('href') || '';
        if (href.indexOf('/id/'+id+'/cid/') < 0) return;
        if (seen[href]) return;
        var name = a.text().trim() || a.attr('title') || '';
        if (!name) return;
        if (href.charAt(0) === '/') href = 'https://ac.qq.com' + href;
        seen[href] = true;
        data.push({name:name,url:href,host:'https://ac.qq.com'});
    });
    return data.length ? Response.success(data) : Response.error('Chapter list is unavailable (site may require JavaScript)');
}
