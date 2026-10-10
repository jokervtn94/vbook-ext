#!/usr/bin/env python3
import json,re,concurrent.futures
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/154 Safari/537.36"}
URLS={
"omega_detail":"https://omegascans.org/series/love-quest",
"omega_chapter1":"https://omegascans.org/series/love-quest/chapter-1",
"omega_chapter2":"https://omegascans.org/series/im-a-vampire/chapter-1",
"omega_root":"https://omegascans.org/",
"manhwahentai_root":"https://manhwahentai.me/",
"manhwahentai_romance":"https://manhwahentai.me/tags/romance",
"hotruyen_detail":"https://hotruyen1.com/truyen/toan-dan-chuyen-chuc-ngu-long-su-ta-co-the-chem-than-323131373837382D32373437353936",
"sayhentai_detail":"https://sayhentai.cx/truyen-tu-phe-vat-thanh-ke-bao-thu-mua-1.html",
"mangaread_manga":"https://www.mangaread.org/manga/",
"acqq_gen":"https://m.ac.qq.com/category/listAll/type/all/rank/upt",
"qimao_list":"https://www.qimao.com/shuku/a-a-a-a-a-update_time-1/",
"doujins_home":"https://doujins.com/",
"novelbuddy_latest":"https://novelbuddy.me/latest",
}
def inspect(arg):
    name,url=arg
    try:
        r=requests.get(url,timeout=13,headers=UA)
        doc=BeautifulSoup(r.content,'html.parser')
        res={"name":name,"url":url,"status":r.status_code,"final":r.url,"title":doc.title.get_text(' ',strip=True)[:90] if doc.title else ""}
        choices=["h1","h2","h3","img","a[href]","a[href*='/chapter']","a[href*='/series/']",".gap-y-2 img",".text-muted-foreground p",".space-y-2 .flex","#manga-chapters-holder",".wp-manga-chapter a","[data-chapter]","#newupdate .uitem","#des-info",".dinfo","#borderchapter",".book img",".chapter","ul.box-list-chapter li","#chapter_content img[id^=image]",".summary_image img",".page-item-detail",".comic-link",".qm-pic-txt li"]
        res["selectors"]={sel:len(doc.select(sel)) for sel in choices if doc.select(sel)}
        res["headline"]=[x.get_text(" ",strip=True)[:130] for x in doc.select("h1,h2")[:5]]
        if "omega" in name:
            res["chapter_meta"]=[x.get_text(" ",strip=True)[:140] for x in doc.select(".space-y-2 .flex")[:13]]
            res["series_links"]=[(a.get("href"),a.get_text(" ",strip=True)[:80]) for a in doc.select("a[href]") if "/chapter" in a.get("href","")][:12]
            res["images"]=[str(x)[:300] for x in doc.select("img")[:6]]
            res["json_markers"]={name: bool(re.search(name,r.text,re.I)) for name in ["chapter-1","chapter_count","chapterCount","images\\\\","chapterImages","seriesData","__next_f","/api/"]}
        if "manhwahentai" in name:
            res["a_images"]=[str(x)[:450] for x in doc.select('a:has(img)')[:5]]
            res["hrefs"]=[(x.get("href"),x.get_text(" ",strip=True)[:55]) for x in doc.select("a[href]")[:28]]
            res["all_links"]=[x.get("href") for x in doc.select("a[href]") if x.get("href","").startswith("/posts/")][:12]
        if "hotruyen" in name:
            res["dinfo"]=[str(x)[:500] for x in doc.select(".dinfo,.book,#des-info,.chapter")[:4]]
            res["hrefs"]=[x.get("href") for x in doc.select("a[href]") if "chuong" in x.get("href","") or "muc-luc" in x.get("href","")][:10]
        if "sayhentai" in name:
            res["taglines"]=[str(x)[:350] for x in doc.select(".summary_image img,ul.box-list-chapter li,div.chapter")[:3]]
            res["chaps"]=[x.get("href") for x in doc.select("a[href]") if "chap" in x.get("href","")][:10]
        if "doujins" in name:
            res["img_wrappers"]=[str(x)[:400] for x in doc.select('a:has(img)')[:8]]
        return res
    except Exception as e:return {"name":name,"error":repr(e)[:170]}
with concurrent.futures.ThreadPoolExecutor(max_workers=9) as pool:
    for x in pool.map(inspect,URLS.items()):
        print("DEEP",json.dumps(x,ensure_ascii=False),flush=True)
