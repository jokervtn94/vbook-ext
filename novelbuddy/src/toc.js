function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();
    var data=[], seen={};
    doc.select('a[href*="/chapter-"]').forEach(function(e) {
        var href=e.attr('href');
        var title=e.text();
        if (!title || !href || seen[href]) return;
        seen[href] = true;
        data.push({name:title,url:href,host:'https://novelbuddy.me'});
    });
    // New website renders a limited first batch of chapters in HTML.
    // Do not rely on the obsolete /api/manga/.../chapters endpoint.
    return Response.success(data.reverse());
}
