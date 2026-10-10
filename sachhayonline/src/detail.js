function execute(url) {
    const doc = Http.get(url).html();
    var cover = doc.select('.row .image img').first().attr('src') || '';
    if (cover.charAt(0) === '/') cover = 'https://www.sachhayonline.com' + cover;
    return Response.success({
        name: doc.select(".inner a h3").first().text(),
        cover: cover,
        author: null,
        description: doc.select(".inner p").first().text(),
        host: "https://www.sachhayonline.com"
    });
}
