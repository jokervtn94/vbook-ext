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

print("==== NEXT_DATA ====",flush=True)
try:
    r=s.get(base,timeout=15); d=BeautifulSoup(r.text,"html.parser")
    node=d.select_one("script#__NEXT_DATA__")
    js=json.loads(node.string)
    print("NEXT_KEYS",list(js.keys()),"PAGE_KEYS",list(js.get("props",{}).get("pageProps",{}).keys()),flush=True)
    props=js.get("props",{}).get("pageProps",{})
    for k,v in props.items():
        if isinstance(v,dict):
            print("NEXT_FIELD",k,"DICT",list(v.keys())[:25],flush=True)
        elif isinstance(v,list):
            print("NEXT_FIELD",k,"LIST",len(v),flush=True)
        else:
            print("NEXT_FIELD",k,"SCALAR",repr(v)[:130],flush=True)
    payload=json.dumps(props,ensure_ascii=False)
    for keyword in ["chapterPage","chapterCount","chapters","pageSize","total","pagination","cursor","hasNext"]:
        for match in list(re.finditer(re.escape(keyword),payload,re.IGNORECASE))[:3]:
            print("NEXT_FRAGMENT",keyword,repr(payload[max(match.start()-100,0):match.start()+220]),flush=True)
    chunks=[i.get("src") for i in d.select("script[src]") if i.get("src","").endswith(".js") and "/_next/" in i.get("src","")]
    import concurrent.futures
    def find_chunk(url):
        try:
            resp=s.get(urljoin(base,url),timeout=16)
            txt=resp.text
            output=[]
            for pat in ["/api/", "chapter?","chapters?","/chapters","chapterPage","chapterList","chapter-page","/v1/", "pageSize","chapterId"]:
                matches=list(re.finditer(re.escape(pat),txt,flags=re.IGNORECASE))[:3]
                for m in matches:
                    snippet=txt[max(0,m.start()-110):m.start()+145]
                    if ("chap" in snippet.lower() or pat in ("chapterPage","chapterList")):
                        output.append((pat,snippet))
            return url,len(txt),output[:8]
        except Exception as exc:return url,0,[("ERR",str(exc)[:80])]
    with concurrent.futures.ThreadPoolExecutor(max_workers=9) as pool:
        for u,size,matches in pool.map(find_chunk,chunks):
            if matches:
                print("CHUNK",u,"SIZE",size,"MATCH",matches[:4],flush=True)
except Exception as err: print("NEXT_ERR",str(err),flush=True)

print("=== CHAPTER API DISCOVERY ===",flush=True)
try:
    r=s.get(base,timeout=15)
    d=BeautifulSoup(r.text,"html.parser")
    parsed=json.loads(d.select_one("script#__NEXT_DATA__").string)
    page=parsed["props"]["pageProps"]
    sc=page.get("siteConfig",{})
    manga=page.get("initialManga",{})
    print("SITE_CONFIG",repr({k:sc.get(k) for k in ["apiUrl","siteUrl","path","contentType"]}),flush=True)
    print("MANGA_KEYS",list(manga.keys()),flush=True)
    for key in ["chapters","latestChapters","stats","firstChapter","mangaId","id","slug","chapterCount","displayChapters"]:
        val=manga.get(key)
        if isinstance(val,list):print("MANGA_KEY",key,"LIST",len(val),"START",repr(val[:1])[:340],flush=True)
        else:print("MANGA_KEY",key,repr(val)[:260],flush=True)
    for a in d.select("script[src]"):
        src=a.get("src","")
        if "/_next/static/chunks/pages/" in src and src.endswith(".js"):
            response=s.get(urljoin(base,src),timeout=15)
            txt=response.text
            if len(txt)<30000: continue
            print("PAGE_CHUNK",src,len(txt),flush=True)
            for term in ["loadingChapters","totalChapters","chapterList","fetchChapters","chapters?", "/api", "getChapters", "chapter_size","per_page","perPage"]:
                locs=list(re.finditer(re.escape(term),txt,re.IGNORECASE))[:4]
                for loc in locs: print("PAGE_MATCH",term,repr(txt[max(0,loc.start()-220):loc.start()+300]),flush=True)
except Exception as err: print("CHAPTER_ERR",str(err),flush=True)
