function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html(), parts=[];
    doc.select('article.novel-reader-content p').forEach(function(p) {
        var fragment = p.html();
        if (fragment && fragment.replace(/\s+/g,'').length > 0) {
            parts.push('<p>' + fragment + '</p>');
        }
    });
    if (!parts.length) return null;
    return Response.success(parts.join('\n'));
}
