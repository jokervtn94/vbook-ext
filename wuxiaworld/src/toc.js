// WuxiaWorld uses gRPC-Web for its complete chapter directory.
// An unfiltered GetChapterList request returns all chapters in one response.
function wwVarint(n) {
    var result = [], value = Math.floor(Number(n));
    if (!(value >= 0)) throw new Error("invalid protobuf number");
    do {
        var byte = value % 128;
        value = Math.floor(value / 128);
        result.push(byte + (value > 0 ? 128 : 0));
    } while (value > 0);
    return result;
}
function wwBase64Encode(bytes) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var text = "";
    for (var i = 0; i < bytes.length; i += 3) {
        var a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0;
        var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
        text += alphabet.charAt(a >> 2);
        text += alphabet.charAt(((a & 3) << 4) | (b >> 4));
        text += i + 1 < bytes.length ? alphabet.charAt(((b & 15) << 2) | (c >> 6)) : "=";
        text += i + 2 < bytes.length ? alphabet.charAt(c & 63) : "=";
    }
    return text;
}
function wwBase64Decode(encoded) {
    var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var bytes = [], buffer = 0, bits = 0, text = String(encoded || "");
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === "=") break;
        var n = alpha.indexOf(ch);
        if (n < 0) continue;
        buffer = (buffer << 6) | n;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 255);
            buffer &= (1 << bits) - 1;
        }
    }
    return bytes;
}
function wwReadVar(bytes, index, limit) {
    var n = 0, scale = 1, count = 0;
    while (index < limit && count++ < 10) {
        var b = bytes[index++];
        n += (b & 127) * scale;
        if (b < 128) return {value: n, offset: index};
        scale *= 128;
    }
    throw new Error("truncated protobuf varint");
}
function wwFields(bytes, start, end) {
    var fields = [], index = start;
    while (index < end) {
        var tag = wwReadVar(bytes, index, end);
        index = tag.offset;
        var num = Math.floor(tag.value / 8), wire = tag.value % 8;
        if (!num) throw new Error("invalid protobuf tag");
        if (wire === 0) {
            var value = wwReadVar(bytes, index, end);
            index = value.offset;
            fields.push({id: num, type: wire, value: value.value});
        } else if (wire === 2) {
            var size = wwReadVar(bytes, index, end);
            index = size.offset;
            var stop = index + size.value;
            if (stop > end || stop < index) throw new Error("truncated protobuf field");
            fields.push({id: num, type: wire, start: index, end: stop});
            index = stop;
        } else if (wire === 5 || wire === 1) {
            index += wire === 5 ? 4 : 8;
            if (index > end) throw new Error("truncated protobuf fixed field");
        } else {
            throw new Error("unsupported protobuf wire type: " + wire);
        }
    }
    return fields;
}
function wwUtf8(bytes, start, end) {
    var encoded = "";
    for (var i = start; i < end; i++) {
        var h = bytes[i].toString(16);
        encoded += "%" + (h.length === 1 ? "0" : "") + h;
    }
    try { return decodeURIComponent(encoded); }
    catch (ignored) {
        var text = "";
        for (var j = start; j < end; j++) text += String.fromCharCode(bytes[j]);
        return text;
    }
}
function wwState(html) {
    var raw = String(html || ""), pos = raw.indexOf("window.__REACT_QUERY_STATE__");
    if (pos < 0) return null;
    pos = raw.indexOf("{", pos);
    if (pos < 0) return null;
    var depth = 0, quoted = false, escaped = false;
    for (var i = pos; i < raw.length; i++) {
        var ch = raw.charAt(i);
        if (quoted) {
            if (escaped) escaped = false;
            else if (ch === "\\") escaped = true;
            else if (ch === '"') quoted = false;
        } else if (ch === '"') quoted = true;
        else if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) {
            try { return JSON.parse(raw.slice(pos, i + 1)); }
            catch (ignored) { return null; }
        }
    }
    return null;
}
function wwDirectory(bytes) {
    var index = 0, groups = [];
    while (index + 5 <= bytes.length) {
        var flag = bytes[index], length = bytes[index + 1] * 16777216 +
            bytes[index + 2] * 65536 + bytes[index + 3] * 256 + bytes[index + 4];
        index += 5;
        if (index + length > bytes.length) throw new Error("truncated gRPC-Web message");
        if (flag & 128) break;  // gRPC trailers
        if (flag !== 0) throw new Error("unexpected compressed gRPC-Web response");
        var messages = wwFields(bytes, index, index + length);
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].id !== 1 || messages[i].type !== 2) continue;
            var rawGroup = wwFields(bytes, messages[i].start, messages[i].end);
            var group = {id: "", order: 0, chapters: []};
            for (var j = 0; j < rawGroup.length; j++) {
                var f = rawGroup[j];
                if (f.id === 1 && f.type === 0) group.id = String(f.value);
                else if (f.id === 3 && f.type === 0) group.order = f.value;
                else if (f.id === 6 && f.type === 2) {
                    var rawChapter = wwFields(bytes, f.start, f.end);
                    var name = "", slug = "";
                    for (var k = 0; k < rawChapter.length; k++) {
                        var v = rawChapter[k];
                        if (v.type !== 2) continue;
                        if (v.id === 2) name = wwUtf8(bytes, v.start, v.end);
                        if (v.id === 3) slug = wwUtf8(bytes, v.start, v.end);
                    }
                    if (name && slug) group.chapters.push({name: name, slug: slug});
                }
            }
            if (group.id) groups.push(group);
        }
        index += length;
    }
    return groups;
}
function execute(url) {
    var host = "https://www.wuxiaworld.com";
    var matched = String(url || "").match(/\/novel\/([^/?#]+)/);
    if (!matched) return Response.error("WuxiaWorld: URL truyện không hợp lệ");
    var slug = matched[1];
    try {
        var page = fetch(host + "/novel/" + slug);
        if (!page.ok) return Response.error("WuxiaWorld mục lục HTTP " + page.status);
        var state = wwState(page.text());
        var queries = state && state.queries || [], novel = null;
        for (var i = 0; i < queries.length; i++) {
            var query = queries[i], key = query.queryKey || [];
            if (key[0] === "novel" && key[1] === slug) {
                novel = query.state && query.state.data && query.state.data.item;
                break;
            }
        }
        var chapterInfo = novel && novel.chapterInfo;
        if (!novel || !/^\d+$/.test(String(novel.id)) || !chapterInfo ||
            !chapterInfo.chapterGroups || !chapterInfo.chapterGroups.length) {
            return Response.error("WuxiaWorld: không đọc được thông tin nhóm chương hiện tại");
        }
        var volumeMeta = chapterInfo.chapterGroups.slice().sort(function(a, b) {
            return Number(a.order || 0) - Number(b.order || 0);
        });
        var expected = Number(chapterInfo.chapterCount && chapterInfo.chapterCount.value) || 0;
        if (!expected) {
            for (var n = 0; n < volumeMeta.length; n++) {
                expected += Number(volumeMeta[n].counts && volumeMeta[n].counts.total || 0);
            }
        }
        var message = [8].concat(wwVarint(novel.id));
        var len = message.length;
        var framed = [0, (len >>> 24) & 255, (len >>> 16) & 255,
                      (len >>> 8) & 255, len & 255].concat(message);
        var api = fetch("https://api2.wuxiaworld.com/wuxiaworld.api.v2.Chapters/GetChapterList", {
            method: "POST",
            headers: {
                "Content-Type": "application/grpc-web-text",
                "Accept": "application/grpc-web-text",
                "x-grpc-web": "1",
                "Origin": host,
                "Referer": host + "/"
            },
            body: wwBase64Encode(framed)
        });
        if (!api.ok) return Response.error("WuxiaWorld API mục lục HTTP " + api.status);
        var decoded = wwBase64Decode(api.text());
        if (!decoded.length) return Response.error(
            "WuxiaWorld API không trả dữ liệu chương (có thể bị chặn hoặc yêu cầu đăng nhập)");
        var groups = wwDirectory(decoded), byId = {};
        for (var g = 0; g < groups.length; g++) byId[groups[g].id] = groups[g];
        var list = [], seen = {};
        for (var v = 0; v < volumeMeta.length; v++) {
            var meta = volumeMeta[v], group = byId[String(meta.id)];
            if (!group) return Response.error(
                "WuxiaWorld: thiếu nhóm chương " + String(meta.id) + " trong phản hồi API");
            var groupCount = Number(meta.counts && meta.counts.total || 0);
            if (groupCount && group.chapters.length !== groupCount) {
                return Response.error("WuxiaWorld: nhóm " + String(meta.id) +
                    " thiếu chương (" + group.chapters.length + "/" + groupCount + ")");
            }
            for (var z = 0; z < group.chapters.length; z++) {
                var chapter = group.chapters[z];
                if (seen[chapter.slug]) continue;
                seen[chapter.slug] = true;
                list.push({
                    name: chapter.name,
                    url: host + "/novel/" + slug + "/" + chapter.slug,
                    host: host
                });
            }
        }
        if (!list.length || (expected && list.length !== expected))
            return Response.error("WuxiaWorld: mục lục không đầy đủ (" +
                list.length + "/" + expected + " chương)");
        return Response.success(list);
    } catch (e) {
        return Response.error("WuxiaWorld mục lục: " + e.message);
    }
}
