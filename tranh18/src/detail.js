load('config.js');
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();
    var img = doc.select('.cover img').first().attr('src') || '';
    if (img.indexOf('//') === 0) img = 'https:' + img;
    else if (img.charAt(0) === '/') img = BASE_URL + img;
    return Response.success({
        name:doc.select('h1.bd-title').text() || doc.select('h1').first().text(),
        cover:img,
        description:doc.select('p#bdSummary').text() || doc.select('p.content').text(),
        author:'Không rõ',
        detail:doc.select('.subtitle').html() || '',
        host:BASE_URL
    });
}
