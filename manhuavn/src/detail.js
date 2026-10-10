load('config.js');
function execute(url) {
    var id = '';
    if (url.indexOf(BASE_API)===0) id=url.split('/').pop();
    else {
        try {
            var match=fetch(url).text().match(/setuprate\('([0-9a-f]{24})'/);
            if (match) id=match[1];
        } catch(e) {}
    }
    if (id) {
        try {
            var response=fetch(BASE_API+'/api/android/getdetailstoryandroidwithkhung?sStoryID='+id);
            if (response.ok) {
                var story=response.json().data.story, genres=[];
                (story.StoryTheLoai||[]).forEach(function(e) {
                    genres.push({title:e.TenTheLoai,input:e.Id,script:'source.js'});
                });
                return Response.success({
                    name:story.StoryName,cover:BASE_IMAGE+story.StoryImage,
                    author:story.author,description:story.StoryDescription,
                    genres:genres,detail:story.StoryTitleLastChap||'',
                    ongoing:story.IsFull===0,host:BASE_URL
                });
            }
        } catch(e) {}
    }
    // HTML fallback supports public story info even when old API IDs are absent.
    var page=fetch(url);
    if (!page.ok) return null;
    var doc=page.html();
    var cover=doc.select('meta[property="og:image"]').attr('content') || '';
    if (!cover) cover=doc.select('img[src*="/Pictures/Truyen/"]').first().attr('src');
    if (cover.indexOf('//')===0) cover='https:'+cover;
    else if (cover.charAt(0)==='/') cover=BASE_URL+cover;
    return Response.success({
        name:doc.select('h1.title').text() || doc.select('h1').first().text(),
        cover:cover,author:'Không rõ',
        description:doc.select('meta[name=description]').attr('content') || '',
        detail:doc.select('meta[name=description]').attr('content') || '',
        host:BASE_URL
    });
}
