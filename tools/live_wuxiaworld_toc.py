"""Fetch a public WuxiaWorld book's real HTML and chapter-list gRPC-Web response.

Only test fixtures saved under /tmp; never stores chapter body or credentials.
"""
import base64
import json
from pathlib import Path
import requests

HOST = "https://www.wuxiaworld.com"
URL = HOST + "/novel/coiling-dragon"
API = "https://api2.wuxiaworld.com/wuxiaworld.api.v2.Chapters/GetChapterList"
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
})
page = SESSION.get(URL, timeout=(5, 18))
page.raise_for_status()
state_marker = "window.__REACT_QUERY_STATE__ ="
state_fragment = page.text.split(state_marker, 1)
assert len(state_fragment) == 2, "Missing public React Query state in page"
state, _ = json.JSONDecoder().raw_decode(state_fragment[1].lstrip())
novel = next(q["state"]["data"]["item"] for q in state["queries"]
             if (q.get("queryKey") or [])[:2] == ["novel", "coiling-dragon"])
book_id = novel["id"]
expected = novel["chapterInfo"]["chapterCount"]["value"]
assert 0 < book_id < 10000000 and expected > 100, (book_id, expected)

def varint(n):
    out = bytearray()
    while n >= 128:
        out.append((n & 127) | 128)
        n >>= 7
    out.append(n)
    return out

message = bytearray([8]) + varint(book_id)
framed = b"\0" + len(message).to_bytes(4, "big") + message
api = SESSION.post(API, data=base64.b64encode(framed), headers={
    "Content-Type": "application/grpc-web-text",
    "Accept": "application/grpc-web-text",
    "x-grpc-web": "1",
    "Origin": HOST,
    "Referer": HOST + "/",
}, timeout=(5, 20))
api.raise_for_status()
assert api.content, "Empty gRPC-Web response"
assert "grpc-web" in api.headers.get("content-type", ""), api.headers
# Proto has no chapter body; just chapter metadata (name, slug, id).
Path("/tmp/vbook_ww_page.html").write_text(page.text, encoding="utf-8")
Path("/tmp/vbook_ww_grpc.txt").write_bytes(api.content)
print("PUBLIC FIXTURE:", book_id, "expected chapters:", expected,
      "RPC base64 bytes:", len(api.content), flush=True)
