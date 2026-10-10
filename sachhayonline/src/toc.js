function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var data = [], seen = {};
    response.html().select('ul.default li a[href]').forEach(function(a) {
        var href = a.attr('href') || '';
        if (!href || seen[href] || href.indexOf('/chuong-') === -1) return;
        if (href.charAt(0) === '/') href = 'https://www.sachhayonline.com' + href;
        seen[href] = true;
        data.push({name:a.text() || a.attr('title'),url:href,host:'https://www.sachhayonline.com'});
    });
    return Response.success(data);
}
