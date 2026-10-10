function execute() {
    var response = fetch('https://ac.qq.com/Comic/all');
    if (!response.ok) return null;
    var genres = [{title:'全部漫画',input:'https://ac.qq.com/Comic/all',script:'gen.js'}];
    var seen = {};
    response.html().select('a[href*="/Comic/all/theme/"]').forEach(function(a) {
        var href = a.attr('href') || '';
        if (!href || seen[href] || !a.text().trim()) return;
        seen[href] = true;
        if (href.charAt(0) === '/') href = 'https://ac.qq.com' + href;
        genres.push({title:a.text().trim(),input:href,script:'gen.js'});
    });
    return Response.success(genres);
}
