load('config.js');
function execute(url) {
    // Pages marked app-only are not bypassed. Use old free-chapter API only
    // when a valid API chapter ID was returned by the chapter list.
    if (url.indexOf('/doc-truyen/')>=0 || url.indexOf('manhuavn2.com')>=0) {
        return Response.error('Chương này chỉ được cung cấp trên ứng dụng của nguồn ManhuaVN.');
    }
    var id=url.split('/').pop(), response;
    try {
        response=fetch(BASE_API+'/api/story/getDetailChapterPostSec',{
            method:'POST',body:{sChapterID:id}
        });
        if (!response.ok) return null;
        var obj=response.json().data;
        var html=obj.currentchap.ChapContent || '';
        if (!html) return Response.error('Chương này không có ảnh miễn phí qua API.');
        var imgs=[];
        Html.parse(html).select('img').forEach(function(e) {
            var src=e.attr('src') || e.attr('data-src');
            if (src) imgs.push(src);
        });
        return Response.success(imgs);
    } catch(e) {
        return null;
    }
}
