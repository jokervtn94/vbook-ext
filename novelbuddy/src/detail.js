function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();
    var name = doc.select('h1').first().text();
    var img = doc.select('img[src*="/covers/"]').first();
    var cover = img.attr('src') || '';
    if (cover.indexOf('//') === 0) cover = 'https:' + cover;
    else if (cover.charAt(0) === '/') cover = 'https://novelbuddy.me' + cover;
    return Response.success({
        name:name,
        cover:cover,
        author:doc.select('a[href*="/authors/"]').first().text() || 'Unknown',
        description:doc.select('meta[name=description]').attr('content') || '',
        detail:doc.select('meta[name=description]').attr('content') || '',
        host:'https://novelbuddy.me'
    });
}
