load('config.js');
function execute(url) {
    // Read the site's public web chapters using their actual lazy-loaded images.
    // App-only chapters expose a .vip-lock panel, not reader images.
    if (url.indexOf('/doc-truyen/') >= 0 ||
        url.indexOf('manhuavn2.com') >= 0) {
        var page = fetch(url);
        if (!page.ok) return null;
        var doc = page.html();
        if (doc.select('#chapcontent .vip-lock').size() > 0) {
            return Response.error('Chương này chỉ có trên ứng dụng của nguồn ManhuaVN.');
        }
        var images = [];
        doc.select('#chapcontent .page-chapter img[data-original]').forEach(function(e) {
            var src = e.attr('data-original') || '';
            if (!src || src.indexOf('loading.gif') >= 0) return;
            if (src.indexOf('//') === 0) src = 'https:' + src;
            else if (src.charAt(0) === '/') src = BASE_URL + src;
            images.push(src);
        });
        if (images.length) return Response.success(images);
        return Response.error('Không tìm thấy ảnh chương công khai trên ManhuaVN.');
    }

    // Keep the original free-chapter API for chapter IDs returned by its TOC.
    var chapterId = url.split('/').pop();
    try {
        var response = fetch(BASE_API + '/api/story/getDetailChapterPostSec', {
            method:'POST', body:{sChapterID:chapterId}
        });
        if (!response.ok) return null;
        var result = response.json().data;
        var html = result && result.currentchap ? result.currentchap.ChapContent : '';
        if (!html) return Response.error('Chương này không có ảnh miễn phí qua API.');
        var apiImages = [];
        Html.parse(html).select('img').forEach(function(e) {
            var src = e.attr('src') || e.attr('data-src') || '';
            if (src) apiImages.push(src);
        });
        return apiImages.length ? Response.success(apiImages) :
            Response.error('Chương API không chứa ảnh hợp lệ.');
    } catch (error) {
        return null;
    }
}
