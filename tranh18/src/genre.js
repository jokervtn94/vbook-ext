load('config.js');
function execute() {
    var response = fetch(BASE_URL + '/comics');
    if (!response.ok) return null;
    var data = [];
    var seen = {};
    response.html().select('a[href*="tag="]').forEach(function(e) {
        var href = e.attr('href');
        var match = href.match(/[?&]tag=([^&]+)/);
        if (!match) return;
        var id = decodeURIComponent(match[1].replace(/\+/g, ' '));
        if (seen[id]) return;
        seen[id] = true;
        var title = e.text() || id;
        data.push({title:title, input:id, script:'source.js'});
    });
    return Response.success(data);
}
