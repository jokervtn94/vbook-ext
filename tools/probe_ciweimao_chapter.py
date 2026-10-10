"""Read-only public API shape probe for CiWeiMao chapter metadata.

Never print the chapter body, access key, cookies or encrypted content.
Normal site verification is respected; this is not a CAPTCHA bypass.
"""
import json
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

HOST = "https://www.ciweimao.com"
SAMPLE = HOST + "/chapter/111827220"
CHAPTER_ID = "111827220"
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept": "text/html,application/json",
    "Accept-Language": "zh-CN,zh;q=0.9"
})
def describe(response):
    typ = response.headers.get("Content-Type","").split(";")[0].lower()
    result = {"status":response.status_code,"content_type":typ,
              "body_bytes":len(response.content)}
    if "html" in typ:
        doc = BeautifulSoup(response.text[:100000],"html.parser")
        result["page_title"] = doc.title.get_text(" ",strip=True)[:75] if doc.title else ""
        result["challenge"] = bool(
            doc.select_one("#challenge-form, .cf-turnstile")
            or "验证码" in result["page_title"]
            or "just a moment" in result["page_title"].lower())
    elif "json" in typ:
        try:
            data = response.json()
            if isinstance(data,dict):
                result["keys"] = sorted(data.keys())[:25]
                result["code"] = data.get("code")
                result["message"] = str(data.get("msg") or data.get("message") or "")[:80]
                obj = data.get("data") if isinstance(data.get("data"),dict) else data
                result["data_keys"] = sorted(obj.keys())[:25]
                keys=obj.get("encryt_keys") or obj.get("encrypt_keys") or obj.get("keys")
                result["has_chapter_content"] = bool(obj.get("chapter_content") or obj.get("content"))
                result["key_count"] = len(keys) if isinstance(keys,list) else None
                result["has_access_key"] = bool(obj.get("chapter_access_key"))
        except ValueError:
            result["invalid_json"] = True
    return result

try:
    landing = session.get(SAMPLE,timeout=(5,14))
    print("CHAPTER_PAGE",json.dumps(describe(landing),ensure_ascii=False),flush=True)
    headers={"Referer":SAMPLE,"x-requested-with":"XMLHttpRequest"}
    session_code = session.post(
        HOST + "/chapter/ajax_get_session_code",
        headers=headers,data={"chapter_id":CHAPTER_ID},timeout=(5,14)
    )
    code_result = describe(session_code)
    print("SESSION_KEY_API",json.dumps(code_result,ensure_ascii=False),flush=True)
    try:
        session_json=session_code.json()
        obj=session_json.get("data") if isinstance(session_json.get("data"),dict) else session_json
        key=obj.get("chapter_access_key") or obj.get("chapterAccessKey")
    except (ValueError,AttributeError,TypeError):
        key=None
    if key and session_code.ok:
        chapter = session.post(
            HOST + "/chapter/get_book_chapter_detail_info",
            headers=headers,
            data={"chapter_id":CHAPTER_ID,"chapter_access_key":key},
            timeout=(5,14)
        )
        print("CHAPTER_API",json.dumps(describe(chapter),ensure_ascii=False),flush=True)
        if chapter.ok:
            chapter_result = chapter.json()
            content = chapter_result.get("chapter_content")
            keys = chapter_result.get("encryt_keys")
            if content and isinstance(keys,list) and keys:
                from pathlib import Path
                fixture = {"session":{"chapter_access_key":key},
                           "chapter":chapter_result}
                Path("/tmp/vbook-ciweimao-live.json").write_text(
                    json.dumps(fixture,ensure_ascii=False),encoding="utf-8")
                print("LIVE_FIXTURE_SAVED",len(keys),"encrypted keys",flush=True)
    else:
        print("CHAPTER_API_SKIPPED", "No valid public access key / human verification required",
              flush=True)
except requests.RequestException as err:
    print("NETWORK_UNVERIFIED",type(err).__name__,flush=True)
