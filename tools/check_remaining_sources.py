"""Read-only source availability diagnostics for previously unverified Vbook domains.

HTTP/DNS failures are not proof of permanent shutdown.
"""
import concurrent.futures
import requests
from bs4 import BeautifulSoup

URLS = {
    "vipbns_domain":"https://bnsvip.net/",
    "vipbns_api":"https://be-app-vip.com/api/story-newest?per_page=12",
    "lightnovel_old_category":"https://quykiep.com/truyen-dich-ds",
    "lightnovel_old_category_2":"https://quykiep.com/truyen-convert-ds",
    "baotangtruyen_current":"https://baotangtruyen32.top/",
    "baotangtruyen_old":"https://baotangtruyen14.com/",
    "manhwahentai":"https://manhwahentai.me/",
    "sayhentai":"https://sayhentai.one/",
    "truyenconvert":"https://truyenconvert.net/",
    "docsachhay":"https://docsachhay.net/",
    "zingtruyen":"https://zingtruyen.store/",
    "vozer":"https://vozer.vn/",
    "giangthe":"https://giangthe.com/",
    "docsach24":"https://docsach24.co/",
    "8ternal":"https://comic.8ternal.com/",
    "monkeyd":"https://monkeyd.net.vn/",
    "hotruyen":"https://hotruyen1.com/",
    "sachhayonline":"https://www.sachhayonline.com/",
    "qimao":"https://www.qimao.com/"
}
def check(row):
    name,url=row
    try:
        r=requests.get(url,headers={"User-Agent":"Mozilla/5.0"},timeout=11,allow_redirects=True)
        soup=BeautifulSoup(r.text,"html.parser")
        title=soup.title.get_text(" ",strip=True)[:75] if soup.title else ""
        is_parked="may be for sale" in r.text.lower() or "domain for sale" in r.text.lower()
        return name,{"status":r.status_code,"final":r.url,"size":len(r.content),"title":title,"parked":is_parked,"content_type":r.headers.get("Content-Type","")[:30]}
    except Exception as exc:
        return name,{"inconclusive":type(exc).__name__+": "+str(exc)[:90]}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    for name,result in sorted(pool.map(check,URLS.items())):
        print(name, result,flush=True)
