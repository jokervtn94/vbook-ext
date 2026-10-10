"""Audit every published Vbook web source and flag outdated hardcoded hosts.

This is a *triage* check. Successful HTTP is not proof that scrapers work,
and Cloudflare, timeout, SSL or DNS errors are not grounds for deletion.
"""
import concurrent.futures
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urljoin
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/"plugin.json").read_text(encoding="utf-8"))["data"]
assert len(data)>=30,len(data)
EXTRA={
 "baotangtruyen":"https://baotangtruyen32.top",
 "knoxt": "https://knoxt.org",
 "mtlnovel": "https://www.mtlnovel.com",
 "truyensieuhay":"https://truyensieuhay.com",
 "webnovel":"https://www.webnovel.com",
}
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Safari/537.36","Accept":"text/html,application/xhtml+xml"}
def probe(item):
    folder=item["folder"]; url=item["url"]
    r={"folder":folder,"source":url,"published":item["published"]}
    try:
        resp=requests.get(url,timeout=11,headers=UA,allow_redirects=True)
        html=resp.text[:250000] if "html" in resp.headers.get("content-type","").lower() else ""
        soup=BeautifulSoup(html,"html.parser") if html else None
        title=soup.title.get_text(" ",strip=True)[:115] if soup and soup.title else ""
        text=soup.get_text(" ",strip=True)[:8000].lower() if soup else ""
        markers=["domain for sale","domain is for sale","buy this domain","this domain is for sale","parkingcrew","sedo domain parking","expired domain","domain name for sale","website is for sale"]
        parked=any(m in text for m in markers)
        contentLinks=len(soup.select('a[href]')) if soup else 0
        hasChapter=bool(re.search(r'chapter|chương|truyện|novel|book|comic|manga|manhwa|manhua|小说|章节|漫画|tiên hiệp|webtoon',text,re.I))
        antiBot=resp.status_code in (403,429,503) or any(x in title.lower() for x in ("just a moment", "attention required", "access denied"))
        host=urlsplit(resp.url).hostname or ""
        origin=urlsplit(url).hostname or ""
        different_host=host.lower()!=origin.lower()
        r.update(status=resp.status_code,final=resp.url,title=title,bytes=len(resp.content),links=contentLinks,looks_like_reader=hasChapter,parked=parked,antibot=antiBot,redirected=different_host,content_type=resp.headers.get("content-type","")[:35])
    except Exception as e:
        r["inconclusive"]=type(e).__name__+": "+str(e)[:115]
    return r

sources=[]
for row in data:
    folder=row["path"].rsplit("/",2)[-2]
    sources.append(dict(folder=folder,url=row["source"],published=True))
sources.extend(dict(folder=k,url=v,published=False) for k,v in EXTRA.items())

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    results=list(pool.map(probe,sources))
for r in results:
    print("SOURCE",json.dumps(r,ensure_ascii=False),flush=True)

PROTOCOL=re.compile(r"https?://[^\s\"'\x60<>\\)]+")
print("=== STATIC HOSTS BY EXTENSION ===",flush=True)
for e in data:
    folder=e["path"].rsplit("/",2)[-2]
    manifest=json.loads((ROOT/folder/"plugin.json").read_text(encoding="utf-8"))
    used=set()
    for f in sorted((ROOT/folder/"src").rglob("*.js")):
        text=f.read_text(encoding="utf-8",errors="replace")
        for m in PROTOCOL.findall(text):
            h=(urlsplit(m).hostname or "").lower()
            if h and not any(h.endswith(x) for x in (".w3.org",".schema.org","google.com","github.com","www.example.com")):
                used.add(h)
    print("STATIC",json.dumps({
       "folder":folder,"catalog_version":e.get("version"),"manifest_version":manifest.get("metadata",{}).get("version"),
       "catalog_source":e.get("source"),"manifest_source":manifest.get("metadata",{}).get("source"),
       "hosts":sorted(used),
       "scripts":sorted(manifest.get("script",{})),
       "metadata_fields":sorted(manifest.get("metadata",{}))
    },ensure_ascii=False),flush=True)

print("=== TARGETED MANAGED DOMAINS ===",flush=True)
for url in [
 "https://monkeyd.net.vn/truyen-moi.html?page=1",
 "https://monkeyd.vn/truyen-moi.html?page=1",
 "https://www.monkeydd.com/",
 "https://www.monkeydd.com/truyen-moi.html?page=1",
 "https://www.monkeydd.com/tim-kiem?search=nhan&page=1",
 "https://docsachhay.net/",
 "https://www.docsachhay.net/",
 "https://giangthe.com/"
]:
    try:
        response=requests.get(url,timeout=8,headers=UA,allow_redirects=True)
        doc=BeautifulSoup(response.text,"html.parser")
        selectors={}
        for key in [".product-grid .card",".list-chapters .episode-title a",".content-container p",
                    ".dropdown-menu a.dropdown-item", ".card","a[href*='/truyen/']",
                    "a[href$='.html']","[data-src]", "a[href]"]:
            elems=doc.select(key);selectors[key]=len(elems)
        examples=[]
        for a in doc.select(".product-grid .card a[href],a[href*='/truyen/']")[:3]:
            examples.append((a.get("href"),a.get_text(" ",strip=True)[:45]))
        summary={"url":url,"status":response.status_code,"final":response.url,"title":(doc.title.text.strip()[:90] if doc.title else ""), "selectors":selectors,"examples":examples}
        if "docsachhay" in url:
            summary["heading"]=[x.get_text(" ",strip=True)[:100] for x in doc.select("h1,h2")[:4]]
            summary["body_prefix"]=doc.get_text(" ",strip=True)[:320]
        print("TARGET",json.dumps(summary,ensure_ascii=False),flush=True)
    except Exception as e:print("TARGET",json.dumps({"url":url,"error":type(e).__name__+": "+str(e)[:130]},ensure_ascii=False),flush=True)
