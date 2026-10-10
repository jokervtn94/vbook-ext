"""Live HTTP/HTML contract smoke tests for migrated Vbook sources.

These tests validate public markup and source endpoints, not the Android Rhino
runtime. A passing test is necessary but not sufficient for a working extension.
"""
import sys
import requests
from bs4 import BeautifulSoup

S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0 VbookExt/1.0"
FAILED = []
def require(name, url, selector, minimum=1):
    try:
        r=S.get(url,timeout=18,allow_redirects=True)
        if r.status_code!=200:
            raise RuntimeError(f"HTTP {r.status_code}")
        soup=BeautifulSoup(r.text,"html.parser")
        count=len(soup.select(selector))
        good=count>=minimum
        print(f"{'PASS' if good else 'FAIL'} {name}: {count} x {selector}, {r.url}",flush=True)
        if not good: FAILED.append(name)
    except Exception as exc:
        print(f"UNVERIFIED {name}: {exc}",flush=True)
        FAILED.append(name)

require("tranh18_list","https://tranh18.cc/update","ul.mh-list li",3)
require("tranh18_detail","https://tranh18.cc/comic/toi-yeu-ban-rat-nhieu","h1.bd-title",1)
require("tranh18_toc","https://tranh18.cc/comic/toi-yeu-ban-rat-nhieu","ul#detail-list-select li a",1)
require("tranh18_chap","https://tranh18.cc/toi-yeu-ban-rat-nhieu/chapter/1028858",".comicpage img[src]",2)
require("novelbuddy_list","https://novelbuddy.me/latest","article img",3)
require("novelbuddy_detail","https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god","h1",1)
require("novelbuddy_toc","https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god",'a[href*="/chapter-"]',3)
require("novelbuddy_chap","https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god/chapter-285-hes-a-mutant","article.novel-reader-content p",4)
require("manhuavn_list","https://manhuavn2.com/danhsach/P1/index.html?status=0&sort=2","li.item",2)
require("manhuavn_detail","https://manhuavn2.com/dai-quan-gia-la-ma-hoang-0.html","h1.title",1)
require("manhuavn_toc","https://manhuavn2.com/dai-quan-gia-la-ma-hoang-0.html","a[href^='/doc-truyen/']",2)

try:
    r=S.get("https://mhvn.truyensieuhay.com/api/story/getlisttheloaiinweb",timeout=14)
    categories=r.json().get("data",[])
    if not r.ok or not isinstance(categories,list) or not categories:
        FAILED.append("manhuavn_api")
        print("FAIL manhuavn_api",flush=True)
    else:
        print("PASS manhuavn_api: categories",len(categories),flush=True)
except Exception as exc:
    FAILED.append("manhuavn_api")
    print("UNVERIFIED manhuavn_api",str(exc),flush=True)

print(f"Smoke checks: {12-len(FAILED)}/12 passed; failed={FAILED}",flush=True)
sys.exit(1 if FAILED else 0)
