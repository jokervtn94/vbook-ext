// ManhuaGui has two live chapter layouts:
// desktop: SMH.imgData({files:[...], path:"..."})
// mobile:  SMH.reader({images:["/ps4/..."], ...})
// Do not execute arbitrary page scripts. Only unpack the known data wrapper.
function mgChapterManifest(unpacked) {
    var match = String(unpacked || "").match(/SMH\.(?:imgData|reader)\(\s*(\{[\s\S]*?\})\s*\)\.preInit\(\)/);
    if (!match) return null;
    return JSON.parse(match[1]);
}
function mgChapterImages(info) {
    if (!info || typeof info !== "object") return [];
    var list = Array.isArray(info.files) ? info.files :
               Array.isArray(info.images) ? info.images : [];
    if (!list.length || !info.sl || info.sl.e == null || !info.sl.m) return [];
    var path = String(info.path || "");
    var suffix = "?e=" + encodeURIComponent(String(info.sl.e)) +
                 "&m=" + encodeURIComponent(String(info.sl.m));
    var result = [], seen = {};
    for (var i = 0; i < list.length; i++) {
        var filename = String(list[i] || "").trim();
        if (!filename) continue;
        var raw = filename;
        if (!/^https?:\/\//i.test(raw) && raw.indexOf("//") !== 0 && raw.charAt(0) !== "/") {
            raw = path.replace(/\/?$/, "/") + raw.replace(/^\/+/, "");
        }
        var link = "";
        if (/^https?:\/\//i.test(raw)) link = raw.replace(/^http:/i, "https:");
        else if (raw.indexOf("//") === 0) link = "https:" + raw;
        else if (raw.charAt(0) === "/") link = "https://i.hamreus.com" + raw;
        if (!link) continue;
        link = encodeURI(link) + (link.indexOf("?") >= 0 ? suffix.replace("?", "&") : suffix);
        if (!seen[link]) { seen[link] = true; result.push(link); }
    }
    return result;
}
function mgUnpackChapter(html) {
    var matched = String(html || "").match(/\(function\(p,a,c,k,e,d\)[\s\S]*?0,\{\}\)\)/);
    if (!matched) throw new Error("không tìm thấy dữ liệu chương đã đóng gói");
    var packed = matched[0];
    var mark1 = "p;}('";
    var mark2 = "'['\\x73\\x70\\x6c\\x69\\x63']";
    var s = packed.indexOf(mark1), e = packed.indexOf(mark2);
    if (s < 0 || e <= s) throw new Error("định dạng dữ liệu chương đã thay đổi");
    var block = packed.substring(s + mark1.length, e);
    var a = block.indexOf("',"), b = block.indexOf(",", a + 2), c = block.indexOf(",'", b + 1);
    if (a < 0 || b < 0 || c < 0) throw new Error("không tách được dữ liệu đóng gói");
    var base = parseInt(block.substring(a + 2, b), 10);
    var count = parseInt(block.substring(b + 1, c), 10);
    if (!(base > 1) || !(count >= 0)) throw new Error("tham số dữ liệu chương không hợp lệ");
    var compressed = block.substring(c + 2);
    var dictionary = LZString.decompressFromBase64(compressed);
    if (typeof dictionary !== "string" || !dictionary)
        throw new Error("không giải nén được bảng dữ liệu chương");
    var decoded = unPacker(block.substring(0, a), base, count, dictionary.split("|"), 0, {});
    var info = mgChapterManifest(decoded);
    if (!info) throw new Error("website không trả SMH.imgData hoặc SMH.reader");
    return info;
}
function execute(url) {
    var chapter = String(url || "");
    if (!/\/comic\/\d+\/\d+\.html(?:[?#]|$)/i.test(chapter))
        return Response.error("Manhua Gui: đường dẫn chương không hợp lệ");
    try {
        var response = fetch(chapter);
        if (!response) return Response.error("Manhua Gui: không nhận được phản hồi khi tải chương");
        if (!response.ok) return Response.error("Manhua Gui: chương HTTP " + response.status);
        var html = response.text();
        if (!html) return Response.error("Manhua Gui: nội dung HTML chương trống");
        var info = mgUnpackChapter(html);
        var urls = mgChapterImages(info);
        if (!urls.length)
            return Response.error("Manhua Gui: chương không có danh sách ảnh hoặc thiếu chữ ký ảnh CDN");
        return Response.success(urls);
    } catch (err) {
        return Response.error("Manhua Gui đọc chương: " + (err && err.message ? err.message : err));
    }
}

var LZString=(function(){var f=String.fromCharCode;var keyStrBase64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var baseReverseDic={};function getBaseValue(alphabet,character){if(!baseReverseDic[alphabet]){baseReverseDic[alphabet]={};for(var i=0;i<alphabet.length;i++){baseReverseDic[alphabet][alphabet.charAt(i)]=i}}return baseReverseDic[alphabet][character]}var LZString={decompressFromBase64:function(input){if(input==null)return"";if(input=="")return null;return LZString._0(input.length,32,function(index){return getBaseValue(keyStrBase64,input.charAt(index))})},_0:function(length,resetValue,getNextValue){var dictionary=[],next,enlargeIn=4,dictSize=4,numBits=3,entry="",result=[],i,w,bits,resb,maxpower,power,c,data={val:getNextValue(0),position:resetValue,index:1};for(i=0;i<3;i+=1){dictionary[i]=i}bits=0;maxpower=Math.pow(2,2);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}switch(next=bits){case 0:bits=0;maxpower=Math.pow(2,8);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}c=f(bits);break;case 1:bits=0;maxpower=Math.pow(2,16);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}c=f(bits);break;case 2:return""}dictionary[3]=c;w=c;result.push(c);while(true){if(data.index>length){return""}bits=0;maxpower=Math.pow(2,numBits);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}switch(c=bits){case 0:bits=0;maxpower=Math.pow(2,8);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}dictionary[dictSize++]=f(bits);c=dictSize-1;enlargeIn--;break;case 1:bits=0;maxpower=Math.pow(2,16);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++)}bits|=(resb>0?1:0)*power;power<<=1}dictionary[dictSize++]=f(bits);c=dictSize-1;enlargeIn--;break;case 2:return result.join("")}if(enlargeIn==0){enlargeIn=Math.pow(2,numBits);numBits++}if(dictionary[c]){entry=dictionary[c]}else{if(c===dictSize){entry=w+w.charAt(0)}else{return null}}result.push(entry);dictionary[dictSize++]=w+entry.charAt(0);enlargeIn--;w=entry;if(enlargeIn==0){enlargeIn=Math.pow(2,numBits);numBits++}}}};return LZString})();String.prototype.splic=function(f){return LZString.decompressFromBase64(this).split(f)};
const unPacker = function(p, a, c, k, e, d) {
    e = function(c) {
        return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36));
    };
    if (!''.replace(/^/, String)) {
        while (c--) d[e(c)] = k[c] || e(c);
        k = [
            function(e) {
                return d[e];
            }
        ];
        e = function() {
            return '\\w+';
        };
        c = 1;
    }
    while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
    return p;
};