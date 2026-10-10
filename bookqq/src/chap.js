load('fock.js');
function execute(url) {
    var match = String(url || "").match(/\/(?:book-read|book-detail)\/(\d+)\/(\d+)(?:[/?#]|$)/i);
    if (!match) return Response.error("Book QQ: URL chương không hợp lệ");
    var bid = match[1], cid = match[2];
    try {
        var response = fetch("https://book.qq.com/api/book/read", {
            method: "GET", queries: {bid: bid, cid: cid}
        });
        if (!response.ok) return Response.error("Book QQ: chương HTTP " + response.status);
        var payload = response.json();
        var data = payload && payload.data;
        if (!data) return Response.error("Book QQ: API không trả dữ liệu chương");
        if (Number(data.chapterPrice || 0) > 0)
            return Response.success("Chương VIP: vui lòng đăng nhập và mua hợp lệ trên website Book QQ.");
        var content = String(data.content || "").replace(/\r\n?/g, "<br>")
            .replace(/&(nbsp|amp|quot|lt|gt);/g, "")
            .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");
        if (!content.trim()) return Response.error("Book QQ: chương trống hoặc không có quyền truy cập");
        var decoded = Fock.unlock(content,
          "d2luZG93Lm9ua2V5Zm9jdXMoInpjYStWbWxVTmRWMEhjdkwvekNEblJoUnRFT1pST3c5UjJjZXMvWkpSZWxkLy9BbTd3ZzI0ak5NLzdBS2NvbUpLRG5zc1NLUkkrMWl5MFY0cUphdTRlNjY5bEt3REp4TythaDl5am5SUmVuY2pxSnZRemFBODhwTnV2NXBhMWRwIiwgMTY0Mjc2MzQyNCk=", 0);
        if (!decoded || !String(decoded).trim())
            return Response.error("Book QQ: không giải mã được nội dung chương miễn phí");
        return Response.success(decoded);
    } catch (e) {
        return Response.error("Book QQ chương: " + e.message);
    }
}
