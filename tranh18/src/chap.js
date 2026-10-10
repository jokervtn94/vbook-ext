load('config.js');
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var images = [];
    response.html().select('.comicpage img').forEach(function(e) {
        var src = e.attr('data-original') || e.attr('data-src') || e.attr('src') || '';
        if (!src || src.indexOf('top.jpg') >= 0) return;
        if (src.indexOf('//') === 0) src = 'https:' + src;
        else if (src.charAt(0) === '/') src = BASE_URL + src;
        images.push(src);
    });
    return Response.success(images);
}
