function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html(), paragraphs = [];
    doc.select('.chapter-content .reading-white p').forEach(function(p) {
        var html = p.html() || '';
        if (html.trim()) paragraphs.push(html);
    });
    return paragraphs.length ?
        Response.success(paragraphs.join('<br><br>')) :
        Response.error('Không tìm thấy nội dung chương sách');
}
