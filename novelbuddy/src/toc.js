// NovelBuddy renders only the first 20 chapter links in the HTML page.
// Read the public first-party chapters API to obtain the complete list.
function execute(url) {
    var page = fetch(url);
    if (!page.ok) return null;
    var body = page.text();
    var match = body.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    var app = null;
    try {
        if (match && match[1]) app = JSON.parse(match[1]);
    } catch (error) {
        app = null;
    }

    if (!app || !app.props || !app.props.pageProps || !app.props.pageProps.initialManga) {
        return Response.error('NovelBuddy: không tìm thấy mã truyện trong dữ liệu trang.');
    }

    var props = app.props.pageProps;
    var manga = props.initialManga;
    var expected = manga.stats ? Number(manga.stats.chaptersCount) : 0;
    var apiBase = props.siteConfig && props.siteConfig.apiUrl ?
        props.siteConfig.apiUrl : 'https://api.novelbuddy.me';
    var chapterList = [];
    try {
        var apiUrl = apiBase.replace(/\/+$/, '') + '/titles/' +
                     encodeURIComponent(manga.id) + '/chapters';
        var response = fetch(apiUrl);
        if (response.ok) {
            var parsed = response.json();
            if (parsed && parsed.success && parsed.data &&
                Array.isArray(parsed.data.chapters)) {
                chapterList = parsed.data.chapters;
            }
        }
    } catch (error) {
        chapterList = [];
    }

    // The page may report stale totals while the API contains the currently available chapters.
    // Fail only when a substantial fraction is missing; never accept the partial 20/50 HTML list.
    if (!chapterList.length && Array.isArray(manga.chapters)) {
        chapterList = manga.chapters;
    }
    if (!chapterList.length || (expected > 0 && chapterList.length < Math.ceil(expected * 0.95))) {
        return Response.error('NovelBuddy: không tải được đầy đủ mục lục. Vui lòng thử lại.');
    }

    var data = [], seen = {};
    chapterList.forEach(function(ch) {
        var href = ch.url || '';
        var name = ch.name || '';
        if (!href || !name || seen[href]) return;
        seen[href] = true;
        data.push({
            name: name,
            url: href,
            host: 'https://novelbuddy.me'
        });
    });
    if (!data.length) return Response.error('NovelBuddy: không có chương hợp lệ.');
    // API returns newest chapters first; Vbook expects oldest -> newest.
    if (chapterList.length > 1 &&
        Number(chapterList[0].number) > Number(chapterList[chapterList.length - 1].number)) {
        data.reverse();
    }
    return Response.success(data);
}
