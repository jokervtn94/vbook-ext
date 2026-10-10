load('config.js');
function execute(sort, page) {
    if (!page) page = '1';
    try {
        var response = fetch(BASE_API + '/api/newstory/getBoLoc', {
            method: 'POST',
            body: { ListTheLoai: ';', iStatus: '-1', iSort: sort, ipage: page, ipagesize: '25' }
        });
        if (response.ok) {
            var result = response.json();
            var list = result && result.data ? result.data.list : null;
            if (Array.isArray(list)) {
                var books = [];
                list.forEach(function(item) {
                    if (!item.Id || !item.StoryName) return;
                    books.push({
                        name: item.StoryName,
                        link: BASE_API + '/' + item.Id,
                        cover: getCoverUrl(item.StoryImage),
                        description: item.StoryTitleLastChap || '',
                        host: BASE_URL
                    });
                });
                return Response.success(books, books.length ? String(parseInt(page, 10) + 1) : null);
            }
        }
    } catch (error) {}

    // Fall back to the public website when the list API is unavailable.
    // The current website puts cover URLs in img[data-original] or CSS backgrounds;
    // img[src] is often only /images/loading.gif.
    var address = BASE_URL + '/danhsach/P' + page +
        '/index.html?status=0&sort=' + encodeURIComponent(sort || '2');
    var web = fetch(address);
    if (!web.ok) return null;
    var doc = web.html(), books = [];
    doc.select('li.item').forEach(function(item) {
        var a = item.select('a[href$="-0.html"]').first();
        var href = a.attr('href') || '';
        var img = item.select('img[data-original]').first();
        var cover = img.attr('data-original') || '';
        if (!cover) {
            var style = item.select('a.story_img').first().attr('style') || '';
            var match = style.match(/url\(["']?([^"')]+)["']?\)/);
            if (match) cover = match[1];
        }
        var name = img.attr('alt') || a.attr('title') || a.text();
        if (!href || !name) return;
        books.push({
            name: name, link: href, host: BASE_URL,
            cover: getCoverUrl(cover), description: ''
        });
    });
    return Response.success(books, books.length ? String(parseInt(page, 10) + 1) : null);
}
