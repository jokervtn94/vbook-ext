"""Locate public WuxiaWorld chapter-list transport in current page JS.
Read-only endpoint discovery; print metadata and small code neighborhoods only.
"""
import concurrent.futures
import re
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
URL="https://www.wuxiaworld.com/novel/coiling-dragon"
KEYS=["Kd=class", "Vy=", "L3=", "L3,", "getChapterList,qe(",
      "mergeOptions", "baseUrl", "baseURL", "grpc-web", "grpcWeb",
      "connect-web", "connect-es", "api.wuxiaworld.com",
      "api2.wuxiaworld", "wuxiaworld.api.v2.Chapters",
      "wuxiaworld.api.v2.GetChapterList", "chapterGroups"]
S=requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"})
r=S.get(URL,timeout=16);r.raise_for_status()
doc=BeautifulSoup(r.text,"html.parser")
scripts=[urljoin(URL,t["src"]) for t in doc.select("script[src]") if t.get("src")]
scripts=list(dict.fromkeys(scripts))
print("PAGE",r.status_code,"SCRIPT COUNT",len(scripts),"TIT",doc.title.get_text(" ",strip=True) if doc.title else None,flush=True)
print("SCRIPT HOSTS",list(dict.fromkeys(urlparse(u).netloc for u in scripts)),flush=True)
def scan(url):
 try:
  x=S.get(url,timeout=(4,16))
  if not x.ok:return {"url":url,"status":x.status_code}
  content=x.text
  hits=[]
  for pattern in KEYS:
   start=0
   for attempt in range(2):
    at=content.find(pattern,start)
    if at<0:break
    excerpt=content[max(at-210,0):at+250].replace("\n"," ").replace("\r"," ")
    hits.append((pattern,excerpt[:460]))
    start=at+len(pattern)
  if hits:
   urls=sorted(set(re.findall(r'https?://[A-Za-z0-9._:-]*wuxiaworld[A-Za-z0-9./_?=-]*',content)))
   return {"url":url[-90:],"bytes":len(content),"hits":hits[:36],"wuxia_hosts":urls[:30]}

  return {"url":url[-90:],"bytes":len(content),"hits":[]}
 except requests.RequestException as e:return {"url":url[-90:],"error":type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 rows=list(ex.map(scan,scripts[:36]))
for row in rows:
 if row.get("hits") or row.get("error"):print("BUNDLE",row,flush=True)
print("SCANNED",len(rows),"WITH-HITS",sum(bool(r.get("hits")) for r in rows),flush=True)
