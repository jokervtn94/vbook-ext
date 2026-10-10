import requests, re, json, html
from bs4 import BeautifulSoup
from urllib.parse import urljoin
s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0"
base="https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god"
urls=[base,base+"?page=2",base+"?chapterPage=2",base+"?chaptersPage=2",base+"?tab=chapters&page=2",base+"?chapters_page=2"]
for url in urls:
    try:
        r=s.get(url,timeout=12)
        doc=BeautifulSoup(r.text,"html.parser")
        links=[(a.get_text(" ",strip=True),a.get("href")) for a in doc.select('a[href*="/chapter-"]')]
        links=[(t,h) for t,h in links if t.lower().startswith("chapter")]
        print("URL",url,"STATUS",r.status_code,"FINAL",r.url,"COUNT",len(links),"HEAD",links[:2],"TAIL",links[-2:],flush=True)
        if url==base:
            for n in doc.find_all(["button","nav","form","a"],limit=1500):
                txt=n.get_text(" ",strip=True)
                if txt in ["1","2","3","Next","Prev","Older","Newest","Show More","Load More","Chapters"] or "chapters" in (n.get("aria-label","").lower()):
                    print("PAGE_NODE",str(n)[:500],flush=True)
            scripts=doc.select("script")
            print("SCRIPT_COUNTS",len(scripts),[(z.get("id"),z.get("src"),len(z.string or z.get_text())) for z in scripts[:12]],flush=True)
            for z in scripts:
                x=z.string or z.get_text()
                if x and any(y in x for y in ["chapterPage","chapterList","totalChapters","chapter-285","chapters/","paginate"]):
                    print("DATA_SCRIPT",z.get("id"),"LEN",len(x),flush=True)
                    for key in ["chapterPage","chapterList","totalChapters","chapters/","chapter-285","pageSize","pageCount","currentPage","chapterLimit"]:
                        ix=x.find(key)
                        if ix>=0:print("DATA_FRAGMENT",key,repr(x[max(0,ix-110):ix+190]),flush=True)
                    if len(x)<2000:print("SCRIPT_BODY",x[:2000],flush=True)
    except Exception as exc:print("ERR",url,type(exc).__name__,str(exc)[:130],flush=True)
# inspect manhua public free chapter and backend source availability 
chap="https://manhuavn2.com/doc-truyen/dai-quan-gia-la-ma-hoang-chapter-915.html"
try:
    r=s.get(chap,timeout=12);doc=BeautifulSoup(r.text,"html.parser")
    print("MANHUA_CHAP",r.status_code,len(r.text),"CHAPCONTENT",repr(str(doc.select_one("#chapcontent"))[:1700]),flush=True)
    for needle in ["app","img","pay","vip","Base64","Chapter","trang","ảnh"]:
        ix=r.text.lower().find(needle.lower())
        if ix!=-1:print("MANHUA_TEXT",needle,repr(r.text[max(0,ix-45):ix+140]),flush=True)
except Exception as e:print("MANHUA_ERR",str(e),flush=True)
