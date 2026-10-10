load('config.js');
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();
    var meta = doc.select('.space-y-2 .flex').text() || '';
    var cover = omegaCover(doc.select('.gap-y-2 img').first().attr('src') || '');
    return Response.success({
        name:doc.select('h1').first().text(),
        cover:cover,
        author:doc.select('.space-y-2 .flex:contains(Author) span').last().text() || 'Unknown',
        description:doc.select('meta[name=description]').attr('content') || '',
        detail:meta,
        ongoing:meta.toLowerCase().indexOf('ongoing') !== -1,
        host:BASE_URL
    });
}
