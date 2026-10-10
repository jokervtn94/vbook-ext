"""Read-only diagnostics of live high-risk extension endpoints.

No chapter text, secrets, cookies or user data are collected/logged.
Run in GitHub Actions: python tools/probe_priority_readers.py
"""
import concurrent.futures
import hashlib
import json
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept": "text/html,application/json",
}
SECRET = "d3dGiJc651gSQ8w1"
BOOK_ID = "151581"
MD5 = lambda value: hashlib.md5(value.encode("utf-8")).hexdigest()
QIMAO_HEADERS = {
    "platform": "android",
    "app-version": "71900",
    "application-id": "com.kmxs.reader",
    "sign": MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + SECRET),
    "user-agent": "webviewversion/0",
}
QIMAO_SIGN = MD5("id=" + BOOK_ID + SECRET)
PROBES = [
    ("bookqq_chapters", "GET",
     "https://book.qq.com/api/book/detail/chapters?bid=39103283", {}, None),
    ("bookqq_read", "GET",
     "https://book.qq.com/api/book/read?bid=38504732&cid=5", {}, None),
    ("qimao_detail", "GET",
     "https://api-bc.wtzw.com/api/v5/book/detail?id=" + BOOK_ID + "&sign=" + QIMAO_SIGN,
     QIMAO_HEADERS, None),
    ("qimao_toc", "GET",
     "https://api-ks.wtzw.com/api/v1/chapter/chapter-list?id=" + BOOK_ID + "&sign=" + QIMAO_SIGN,
     QIMAO_HEADERS, None),
    ("wuxiaworld_old_search_get", "GET",
     "https://www.wuxiaworld.com/api/novels/search?query=dragon&count=3", {}, None),
    ("wuxiaworld_old_search_post", "POST",
     "https://www.wuxiaworld.com/api/novels/search",
     {"Content-Type": "application/json"},
     {"language":"Any","sortType":"Name","sortAsc":True,"searchAfter":"0","count":2}),
    ("wuxiaworld_novel", "GET", "https://www.wuxiaworld.com/novel/coiling-dragon", {}, None),
    ("sayhentai_chapter", "GET",
     "https://sayhentai.cx/truyen-lop-hoc-bi-mat-khong-che/chuong-7", {}, None),
    ("ciweimao_vip", "GET", "https://www.ciweimao.com/chapter/111827221/vip", {}, None),
    ("mangaread_detail", "GET",
     "https://www.mangaread.org/manga/gedou-tenisha-no-harem-dungeon-seisakuki/", {}, None),
    ("manhuavn_chapter", "GET",
     "https://manhuavn2.com/doc-truyen/dai-quan-gia-la-ma-hoang-chapter-1.html", {}, None),
    ("uukanshu_chapter", "GET", "https://uukanshu.cc/book/25044/16039379.html", {}, None),
]
SELECTORS = {
    "wuxiaworld_novel": [".novel-body h2", "ul.list-chapters li", "#chapter-content", "#__NEXT_DATA__", "h1", "h2", "meta[property="og:image"]", "meta[name=description]", "a[href*="/novel/coiling-dragon/"]", "[class*=synopsis]", "[class*=Synopsis]"],
    "sayhentai_chapter": ["#chapter_content img[id^=image]", "#chapter_content img", "img[data-src]"],
    "ciweimao_vip": [".chapter-content", ".chapter-content p", "#chapter_content"],
    "mangaread_detail": [".summary_image img", ".post-content .post-content_item", ".chapter-item"],
    "manhuavn_chapter": ["#chapcontent .page-chapter img[data-original]", "#chapcontent .vip-lock"],
    "uukanshu_chapter": [".readcontent", ".readcotent", "#contentbox", "#chaptercontent"],
}

def one(entry):
    name, method, url, headers, payload = entry
    try:
        r = requests.request(
            method, url, headers={**BASE_HEADERS, **headers},
            json=payload, timeout=(4, 12), allow_redirects=True
        )
        result = {
            "name": name,
            "status": r.status_code,
            "type": r.headers.get("content-type","").split(";")[0],
            "bytes": len(r.content),
            "host": urlparse(r.url).hostname,
        }
        is_json = "json" in result["type"] or r.text[:1] == "{"
        if is_json:
            try:
                data = r.json()
                if isinstance(data, dict):
                    result["top_keys"] = sorted(data.keys())[:12]
                    if name.startswith("wuxiaworld_old_search"):
                        result["result_field"] = str(data.get("result"))[:120]
                        result["total"] = data.get("total")
                        if isinstance(data.get("items"), list) and data["items"]:
                            result["first_item_keys"] = sorted(data["items"][0].keys())[:25]
                    result["code"] = data.get("code")
                    result["success"] = data.get("success")
                    inner = data.get("data")
                    if isinstance(inner, dict):
                        result["data_keys"] = sorted(inner.keys())[:18]
                        if isinstance(inner.get("chapter_lists"), list):
                            result["chapter_count"] = len(inner["chapter_lists"])
                    elif isinstance(inner, list):
                        result["data_list_count"] = len(inner)
                    if isinstance(data.get("items"), list):
                        result["item_count"] = len(data["items"])
            except ValueError:
                result["invalid_json"] = True
        elif "html" in result["type"] or r.text.startswith("<"):
            soup = BeautifulSoup(r.text[:750000], "html.parser")
            result["title"] = soup.title.get_text(" ",strip=True)[:85] if soup.title else ""
            result["selector_counts"] = {
                selector: len(soup.select(selector))
                for selector in SELECTORS.get(name, [])
            }
            text = soup.get_text(" ",strip=True)
            result["text_chars"] = len(text)
            result["challenge"] = bool(
                soup.select_one("#challenge-form, .cf-turnstile")
                or "just a moment" in result["title"].lower()
            )
        return result
    except requests.RequestException as exc:
        return {"name":name,"error":type(exc).__name__}

def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(one, PROBES))
    for r in results:
        print(json.dumps(r, ensure_ascii=False, sort_keys=True), flush=True)
    print("COMPLETED:", len(results), "live endpoint diagnostics")

if __name__ == "__main__":
    main()
