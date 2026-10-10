function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html(), imgs = [], seen = {};
    doc.select('img[data-fallback-index][src]').forEach(function(el) {
        var src = (el.attr('src') || '').trim();
        if (src.indexOf('//') === 0) src = 'https:' + src;
        if (!/^https:\/\//i.test(src) || seen[src]) return;
        seen[src] = true; imgs.push(src);
    });
    return imgs.length ? Response.success(imgs) : Response.error('No public chapter images found');
}
