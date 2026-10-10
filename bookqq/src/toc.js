function execute(url) {
    let bid = url.match(/\d+/)[0];
    let response = fetch('https://book.qq.com/api/book/detail/chapters', {
        method: "GET",
        queries: {
            bid : bid,
        }
    });
    if (response.ok) {
        let json = response.json().data;
        let novelList = [];
        json.forEach(e => {
            let stt = e.free != 0 ? '【Free】 ' : '【VIP】 ';
            novelList.push({
                name: stt + e.chapterName,
                url: url+'/'+e.cid,
                host: "https://book.qq.com"
            })
        });
        return Response.success(novelList);
    }
    return null;
}