load('config.js');
function execute(url) {
    var id = '';
    if (url.indexOf(BASE_API) === 0) id=url.split('/').pop();
    else {
        try {
            var match=fetch(url).text().match(/setuprate\('([0-9a-f]{24})'/);
            if (match) id=match[1];
        } catch(e) {}
    }
    if (id) {
        try {
            var response=fetch(BASE_API+'/api/android/getlistchapterandroid',{
                method:'POST',body:{storyid:id,ipage:'1',ipagesize:'10000',sort:'0'}
            });
            if (response.ok) {
                var data=[], chapters=response.json().data.list_chap;
                chapters.forEach(function(ch) {
                    data.push({name:ch.Name,url:BASE_API+'/'+ch.Id,pay:ch.iChapVip===1});
                });
                return Response.success(data.reverse());
            }
        } catch(e) {}
    }
    // Public HTML exposes the newest chapters, not necessarily all chapters.
    var page=fetch(url);
    if (!page.ok) return null;
    var list=[],seen={};
    page.html().select('a[href^="/doc-truyen/"]').forEach(function(e) {
        var href=e.attr('href'), title=e.text();
        if (!title || !href || seen[href]) return;
        seen[href]=true;
        list.push({name:title,url:href,host:BASE_URL});
    });
    return Response.success(list.reverse());
}
