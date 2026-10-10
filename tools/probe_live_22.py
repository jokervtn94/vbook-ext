#!/usr/bin/env python3
"""Source-first audit of every published extension. Public read-only probes.

The output is triage evidence and never a claim that all Vbook scripts execute.
"""
import concurrent.futures, json, re, time, subprocess
from urllib.parse import urlparse, urljoin
from pathlib import Path
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent.parent
catalog=json.loads((ROOT/"plugin.json").read_text(encoding="utf-8"))["data"]
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36"
HTTP=requests.Session()
HEAD={"User-Agent":UA,"Accept":"text/html,application/xhtml+xml"}
SELECTORS={
    "omegascans":[".gap-y-2 img",".text-muted-foreground p",".space-y-2 .flex","a[href*='/series/']"],
    "hotruyen":["#newupdate .uitem","#searchresult .sitem",".chapter","#borderchapter","a[href*='/truyen/']"],
    "sayhentai":[".page-item-detail","img.img-responsive",".summary_image img","ul.box-list-chapter li","#chapter_content img[id^=image]"],
    "manhwahentai":["div.page-item-detail",".summary_image img","#manga-chapters-holder",".wp-manga-chapter a",".reading-content .page-break img"],
    "mangaread":[".page-item-detail",".summary_image img","#manga-chapters-holder",".wp-manga-chapter a",".reading-content img"],
    "tienvuc":[".row .item",".truyen-item","a[href*='/truyen/']"],
    "tranh18":[".post-title","a[href*='/comic/']",".content img"],
    "manhuavn":["li.item","a.story_img","img[data-original]"],
}
EXTRA_PATHS={
"omegascans":["/series","/series/","/latest"],
"hotruyen":["/nam-sinh","/tim-truyen?sn=than&pg=1"],
"sayhentai":["/manga","/manga/","/"],
"manhwahentai":["/webtoon-genre/action/","/webtoon-genre/romance/","/"],
"mangaread":["/manga-list/","/"],
"doujins":["/","/latest"],
"novelbuddy":["/latest"],
"manhuavn":["/danhsach/P1/index.html?status=0&sort=2"],
"royalroad":["/fictions/best-rated"],
}
def request(url,seconds=9,as_image=False):
    r=requests.get(url,headers=HEAD,timeout=seconds,allow_redirects=True,stream=as_image)
    if as_image:
        chunk=r.raw.read(15)
        z={"code":r.status_code,"type":r.headers.get("Content-Type",""),"bytes":r.headers.get("content-length",""),"valid_image":r.status_code==200 and (chunk.startswith(b'\xff\xd8\xff') or chunk.startswith(b'\x89PNG') or chunk.startswith(b'RIFF') or chunk.startswith(b'GIF8') or chunk.startswith(b'\x00\x00\x00') )}
        r.close()
        return z
    return r
def normalize(url,host):
    return urljoin(host,url.strip()) if url and not url.startswith("data:") else ""
def probe_catalog(item):
    folder=item["path"].rsplit("/",2)[-2]; domain=item["source"];r={"folder":folder,"origin":domain,"version":item["version"]}
    src=ROOT/folder/"src";files=list(src.rglob("*.js"))
    filenames={f.name for f in files};missing=set()
    for f in files:
        raw=f.read_text(encoding="utf-8",errors="replace")
        for match in re.findall(r'\bload\s*\(\s*["\x27]([^"\x27]+)["\x27]\s*\)',raw):
            if match not in filenames:missing.add("load:"+f.name+"->"+match)
        for match in re.findall(r'script:\s*["\x27]([^"\x27]+\.js)["\x27]',raw):
            if match not in filenames:missing.add("script:"+f.name+"->"+match)
    r["missing_scripts"]=sorted(missing)
    if (src/"config.js").exists():
        r["config_present"]=True
    probes=[domain]+[urljoin(domain,p) for p in EXTRA_PATHS.get(folder,[]) if p!="/"]
    pages=[]
    for url in probes[:4]:
        p={"url":url}
        try:
            response=request(url,11)
            p.update(code=response.status_code,final=response.url,content_type=response.headers.get("content-type",""),size=len(response.content))
            if "html" in p["content_type"].lower():
                soup=BeautifulSoup(response.content,"html.parser")
                p["title"]=soup.title.get_text(" ",strip=True)[:100] if soup.title else ""
                anchors=[a.get("href","") for a in soup.select("a[href]") if a.get("href","").startswith(("/", "https://", "http://"))]
                p["anchors"]=len(anchors)
                p["images"]=len(soup.select("img"))
                # sample live selectors, if the known CSS is applicable to homepage or listing route
                p["selectors"]={css:len(soup.select(css)) for css in SELECTORS.get(folder,[]) }
                imgs=[]
                for img in soup.select("img")[:45]:
                    src=img.get("data-original") or img.get("data-src") or img.get("data-lazy-src") or img.get("src") or ""
                    if src and not ("loading.gif" in src or "placeholder" in src or "data:image" in src):
                        full=normalize(src,response.url)
                        if full and full.startswith("http"):
                            imgs.append(full)
                if imgs:
                    p["sample_cover"]=imgs[0]
                    try:p["cover_http"]=request(imgs[0],8,True)
                    except Exception as ex:p["cover_error"]=type(ex).__name__
                p["link_samples"]=[normalize(a,response.url) for a in anchors if re.search(r'/series/|/truyen/|/comic/|/manga/|/novel/|/book/|/webtoon/|/fiction/|/story/|-[0-9]+\.html',a,re.I)][:5]
                if folder=="omegascans":
                    p["next_data"]=bool(soup.select("script#__NEXT_DATA__"))
                    p["next_script_count"]=len(soup.select("script"))
            pages.append(p)
        except Exception as ex:
            pages.append({"url":url,"error":type(ex).__name__+": "+str(ex)[:90]})
    r["pages"]=pages
    return r
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    for result in pool.map(probe_catalog,catalog):
        print("CHECK "+json.dumps(result,ensure_ascii=False),flush=True)

print("=== ALL PUBLISHED JAVASCRIPT SYNTAX ===",flush=True)
for entry in catalog:
    folder=entry["path"].rsplit("/",2)[-2]
    for f in sorted((ROOT/folder/"src").rglob("*.js")):
        check=subprocess.run(["node","--check",str(f)],capture_output=True,text=True)
        if check.returncode:
            print("SYNTAX "+json.dumps({"path":str(f.relative_to(ROOT)),"stderr":check.stderr[-650:]},ensure_ascii=False),flush=True)
print("SYNTAX_SCAN_COMPLETE",flush=True)
