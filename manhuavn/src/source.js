load('config.js');
function execute(genreId, page) {
    if (!page) page = '1';
    var response = fetch(BASE_API + '/api/newstory/getBoLoc', {
        method: 'POST',
        body: { ListTheLoai: ';' + genreId, iStatus: '-1', iSort: '2',
                ipage: page, ipagesize: '25' }
    });
    if (!response.ok) return null;
    var result = response.json();
    var list = result && result.data ? result.data.list : null;
    if (!Array.isArray(list)) return null;
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
