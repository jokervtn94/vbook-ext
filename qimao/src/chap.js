load("crypto.js");
load("config.js");
function qmDecrypt(hexData, iv) {
    var key = CryptoJS.enc.Hex.parse("32343263636238323330643730396531");
    var ivBytes = CryptoJS.enc.Hex.parse(iv);
    var bytes = CryptoJS.enc.Hex.parse(hexData);
    var ciphertext = CryptoJS.enc.Base64.stringify(bytes);
    var result = CryptoJS.AES.decrypt(ciphertext, key, {
        iv:ivBytes, mode:CryptoJS.mode.CBC, padding:CryptoJS.pad.Pkcs7
    });
    return result.toString(CryptoJS.enc.Utf8);
}
function execute(url) {
    var text = String(url || "");
    var chapter = text.match(/(?:^|[?&/])chapterId=(\d+)/i);
    var book = text.match(/(?:^|[?&])id=(\d+)/i);
    if (!chapter || !book) return Response.error("Qimao: thiếu chapterId hoặc id trong URL chương");
    try {
        var query = "chapterId=" + chapter[1] + "&id=" + book[1];
        var sign = String(CryptoJS.MD5("chapterId=" + chapter[1] + "id=" + book[1] + QM_SALT));
        var result = qmApi(QM_KS + "/api/v1/chapter/content?" + query + "&sign=" + sign);
        if (!result.content) return Response.error("Qimao: chương chưa có nội dung công khai.");
        // Official response: base64( 16-byte IV + AES-CBC ciphertext ).
        var hex = CryptoJS.enc.Base64.parse(String(result.content)).toString(CryptoJS.enc.Hex);
        if (hex.length < 64) return Response.error("Qimao: dữ liệu chương bị thiếu.");
        var plain = qmDecrypt(hex.slice(32), hex.slice(0,32));
        if (!plain || !plain.trim()) return Response.error(
            "Qimao: không giải mã được nội dung chương hoặc chương yêu cầu quyền đọc.");
        return Response.success(plain.trim()
            .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/\r?\n/g,"<br>"));
    } catch (e) {
        return Response.error("Qimao đọc chương: " + (e && e.message ? e.message : e));
    }
}
