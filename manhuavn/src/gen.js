load('config.js');
function execute(sort, page) {
    if (!page) page = '1';
    try {
        var response = fetch(BASE_API + '/api/newstory/getBoLoc', {
            method:'POST',
            body:{ListTheLoai:';',iStatus:'-1',iSort:sort,ipage:page,ipagesize:'25'}
        });
        if (response.ok && response.json().data) {
            var json = response.json().data, books=[];
            json.list.forEach(function(item) {
                books.push({
                    name:item.StoryName,link:BASE_API+'/'+item.Id,
                    cover:BASE_IMAGE+item.StoryImage,description:item.StoryTitleLastChap
                });
            });
            return Response.success(books,books.length?String(parseInt(page,10)+1):null);
        }
    } catch(e) {}
    // Live HTML fallback, because public website moved to manhuavn2.com.
    var address=BASE_URL+'/danhsach/P'+page+'/index.html?status=0&sort='+encodeURIComponent(sort);
    var result=fetch(address);
    if (!result.ok) return null;
    var items=[];
    result.html().select('li.item').forEach(function(e) {
        var a=e.select('a[href$="-0.html"]').first();
        var link=a.attr('href');
        var name=a.attr('title') || a.text() || e.select('a[href$="-0.html"]').last().text();
        if (!link || !name) return;
        var style=e.select('a.story_img').first().attr('style') || '';
        var match=style.match(/url\(["']?([^"')]+)["']?\)/);
        items.push({name:name,link:link,cover:match?match[1]:'',description:'',host:BASE_URL});
    });
    return Response.success(items,items.length?String(parseInt(page,10)+1):null);
}
