load("crypto.js");
load("base64.js");

function cwMessage(data, fallback) {
    if (!data || typeof data !== "object") return fallback;
    return String(data.msg || data.message || data.tip || data.info || fallback);
}
function cwObject(data) {
    if (data && typeof data === "object" && data.data && typeof data.data === "object") {
        return data.data;
    }
    return data && typeof data === "object" ? data : {};
}
function cwDecrypt(content, keys, accessKey) {
    if (typeof content !== "string" || !content ||
        !keys || !Array.isArray(keys) || !keys.length ||
        typeof accessKey !== "string" || !accessKey) {
        throw new Error("Thiếu nội dung, danh sách khóa giải mã hoặc access key");
    }
    var value = content;
    var selected = [
        keys[accessKey.charCodeAt(accessKey.length - 1) % keys.length],
        keys[accessKey.charCodeAt(0) % keys.length]
    ];
    if (!selected[0] || !selected[1]) throw new Error("Khóa chương không hợp lệ");
    for (var i = 0; i < selected.length; i++) {
        value = base64().decode(value);
        if (value.length < 16) throw new Error("Dữ liệu mã hóa bị thiếu IV");
        var iv = base64().encode(value.substr(0, 16));
        var ciphertext = base64().encode(value.substr(16));
        var encrypted = CryptoJS.format.OpenSSL.parse(ciphertext);
        var decoded = CryptoJS.AES.decrypt(encrypted,
            CryptoJS.enc.Base64.parse(selected[i]), {
                iv: CryptoJS.enc.Base64.parse(iv),
                format: CryptoJS.format.OpenSSL
            });
        value = decoded.toString(i < selected.length - 1 ?
            CryptoJS.enc.Base64 : CryptoJS.enc.Utf8);
        if (!value) throw new Error("Không giải mã được dữ liệu chương");
        if (i < selected.length - 1) value = base64().decode(value);
    }
    return value;
}
function execute(url) {
    var target = String(url || "");
    var match = target.match(/\/chapter\/(\d+)/);
    if (!match) return Response.error("CiWeiMao: URL chương không hợp lệ");
    if (/\/vip(?:[/?#]|$)/i.test(target)) {
        return Response.error("CiWeiMao: đây là chương VIP; hãy đăng nhập và mua chương hợp lệ trên website.");
    }
    var id = match[1], host = "https://www.ciweimao.com";
    var headers = {"Referer": target, "x-requested-with": "XMLHttpRequest"};
    try {
        var sessionResponse = fetch(host + "/chapter/ajax_get_session_code", {
            method: "POST", headers: headers, body: {chapter_id: id}
        });
        if (!sessionResponse.ok) {
            return Response.error("CiWeiMao lấy khóa HTTP " + sessionResponse.status +
                ": website có thể yêu cầu CAPTCHA hoặc xác minh phiên truy cập.");
        }
        var sessionJSON = sessionResponse.json();
        var access = cwObject(sessionJSON);
        var accessKey = access.chapter_access_key ||
                        access.chapterAccessKey || sessionJSON.chapter_access_key;
        if (!accessKey || typeof accessKey !== "string") {
            return Response.error("CiWeiMao: không nhận được chapter_access_key. " +
                cwMessage(sessionJSON, "Có thể website yêu cầu CAPTCHA/đăng nhập hoặc API đã thay đổi."));
        }

        var chapterResponse = fetch(host + "/chapter/get_book_chapter_detail_info", {
            method: "POST", headers: headers,
            body: {chapter_id: id, chapter_access_key: accessKey}
        });
        if (!chapterResponse.ok) {
            return Response.error("CiWeiMao lấy chương HTTP " + chapterResponse.status +
                ": website có thể yêu cầu CAPTCHA hoặc xác minh phiên truy cập.");
        }
        var result = chapterResponse.json();
        var chapter = cwObject(result);
        var content = chapter.chapter_content || chapter.content ||
                      result.chapter_content || result.content;
        var keys = chapter.encryt_keys || chapter.encrypt_keys || chapter.keys ||
                   result.encryt_keys || result.encrypt_keys || result.keys;
        if (typeof keys === "string") {
            try { keys = JSON.parse(keys); } catch (ignored) { keys = null; }
        }
        if (!content || !Array.isArray(keys) || !keys.length) {
            return Response.error("CiWeiMao: API không trả đủ chapter_content và encryt_keys. " +
                cwMessage(result, "Có thể bị CAPTCHA, hết phiên đăng nhập hoặc API đã thay đổi."));
        }
        var plain = cwDecrypt(String(content), keys, String(accessKey));
        var html = plain.replace(/<\/?span[^>]*>/gi, "")
                        .replace(/<[^>]*>/g, "")
                        .replace(/\r?\n/g, "<br>").trim();
        if (!html) return Response.error("CiWeiMao: chương trống sau khi giải mã.");
        return Response.success(html);
    } catch (e) {
        return Response.error("CiWeiMao tải chương: " +
            (e && e.message ? e.message : String(e)) +
            ". Nếu cần, hãy xác minh CAPTCHA trên website rồi thử lại.");
    }
}
