"""Read-only diagnostics for actual ManhuaVN cover URLs.

Compare first-party website images with API-produced ones and test both with
normal and browser Referer headers. HTTP failures aren't proof of site death.
"""
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests

SESSION=requests.Session()
SESSION.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/154.0 Safari/537.36"
WEB="https://manhuavn2.com"
API="https://mhvn.truyensieuhay.com"
def check_image(label,url):
    try:
        r=SESSION.get(url,timeout=13,headers={"Referer":WEB+"/"},stream=True)
        prefix=r.raw.read(24)
        print("IMAGE",label,r.status_code,r.url,r.headers.get("content-type"),r.headers.get("content-length"),repr(prefix),flush=True)
        r.close()
    except Exception as ex:
        print("IMAGE_ERR",label,type(ex).__name__,str(ex)[:130],flush=True)
for path in ["/","/danhsach/P1/index.html?status=0&sort=2","/dai-quan-gia-la-ma-hoang-0.html"]:
    try:
        r=SESSION.get(WEB+path,timeout=15)
        s=BeautifulSoup(r.text,"html.parser")
        print("WEB",path,"STATUS",r.status_code,"SIZE",len(r.content),flush=True)
        for item in s.select("li.item")[:3]:
            a=item.select_one("a.story_img")
            print("ITEM_ANCHOR",str(a)[:650],flush=True)
            if a:
                style=a.get("style","")
                found=re.search(r'url\(["\']?([^"\')]+)["\']?\)',style)
                if found:check_image("list",urljoin(WEB,found.group(1)))
        if path.endswith("-0.html"):
            cover=s.select_one('img[src*="/Pictures/Truyen/"]')
            print("DETAIL_COVER",str(cover)[:420],flush=True)
            if cover:check_image("detail",urljoin(WEB,cover.get("src","")))
    except Exception as ex:print("WEB_ERR",path,type(ex).__name__,str(ex)[:150],flush=True)
for endpoint,params in [
 (API+"/api/newstory/getBoLoc",{"ListTheLoai":";","iStatus":"-1","iSort":"2","ipage":"1","ipagesize":"25"}),
]:
    try:
        r=SESSION.post(endpoint,data=params,timeout=17)
        print("API",r.status_code,"TYPE",r.headers.get("content-type"),"SIZE",len(r.content),"PREFIX",repr(r.text[:220]),flush=True)
        try:
            j=r.json()
            data=j.get("data") if isinstance(j,dict) else None
            li=(data or {}).get("list",[])
            print("API_LIST",len(li),flush=True)
            for i,x in enumerate(li[:3]):
                print("API_ITEM",i,{k:x.get(k) for k in ["Id","StoryName","StoryImage","StoryTitleLastChap"]},flush=True)
                image=x.get("StoryImage","")
                if image:
                    normalized= "https://admin.manhuavn2.com/Pictures/Truyen/Large/"+str(image).lstrip("/")
                    check_image("api_prepend",normalized)
                    if str(image).startswith("http"):check_image("api_original",str(image))
        except Exception as err:print("API_PARSE_ERROR",repr(err),flush=True)
    except Exception as ex:print("API_ERR",type(ex).__name__,str(ex)[:150],flush=True)
