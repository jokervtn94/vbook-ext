load('config.js');
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();
    var match = (doc.select('.space-y-2 .flex').text() || '').match(/Total chapters\s*(\d+)/i);
    if (!match) return Response.error('No chapter count found for Omega Scans');
    var count = parseInt(match[1], 10);
    if (!count || count > 10000) return Response.error('Invalid chapter count');
    var base = url.replace(/\/$/, ''), list = [];
    for (var i=1; i<=count; i++) list.push({
        name:'Chapter '+i, url:base+'/chapter-'+i, host:BASE_URL
    });
    return Response.success(list);
}
