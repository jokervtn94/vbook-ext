"""Lightweight diagnostics for public HTML structures; never modifies extensions.

This is *not* a Vbook runtime test. Network and anti-bot failures are recorded
as inconclusive rather than proof of a dead website.
"""
import json
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

SITES = [
    ("tranh18", "https://tranh18.cc/update", [
        "ul.mh-list li", ".mh-list", "p.mh-cover", "ul#detail-list-select",
        "a[href*='/comic/']", "a[href*='/comics/']", "a[href*='/truyen/']", ".chapter"]),
    ("tranh18_index", "https://tranh18.cc/comics", [
        "ul.mh-list li", ".cat-list a", "a[href*='/comic/']", "article"]),
    ("novelbuddy_latest", "https://novelbuddy.me/latest", [
        ".list .book-item", ".book-item", ".paginator", ".chapter-list li",
        "a[href*='/novel/']", "a[href*='/book/']", "h3", "article", "a"]),
    ("novelbuddy_search", "https://novelbuddy.me/search?q=Reborn", [
        ".list .book-item", ".book-item", "a[href*='/novel/']", "a[href*='/book/']", "article"]),
    ("manhuavn_home", "https://manhuavn2.com/", [
        ".item", "a[href*='.html']", "a[href*='/truyen-tranh/']", "img"]),
    ("manhuavn_detail", "https://manhuavn2.com/dai-quan-gia-la-ma-hoang-0.html", [
        "h1", "a[href*='/chapter']", "a[href*='chap']", "img", ".list-chapter", ".detail-info"]),
]
session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; VbookExt-Diagnostics/1.0)"})
for name, url, selectors in SITES:
    print("SITE", name, url, flush=True)
    try:
        r = session.get(url, timeout=14, allow_redirects=True)
        soup = BeautifulSoup(r.text, "html.parser")
        title = soup.title.get_text(" ", strip=True)[:110] if soup.title else ""
        print("HTTP", r.status_code, "FINAL", r.url, "CHARS", len(r.text),
              "TITLE", repr(title), flush=True)
        for css in selectors:
            els = soup.select(css)
            examples = [{"t":e.get_text(" ",strip=True)[:60],"h":e.get("href","")[:100]}
                        for e in els[:2]]
            print("SEL",css,len(els),json.dumps(examples,ensure_ascii=False), flush=True)
        candidates = []
        for a in soup.select("a[href]"):
            h=a.get("href","")
            if any(z in h for z in ["/novel/", "/book/", "/comic/", "-0.html"]):
                candidates.append((a.get_text(" ",strip=True)[:50],urljoin(r.url,h)))
            if len(candidates)>=6:
                break
        print("CANDIDATES",repr(candidates),flush=True)
    except Exception as err:
        print("UNVERIFIED",type(err).__name__,str(err)[:170],flush=True)


DETAILS = [
    ("tranh18_detail", "https://tranh18.cc/comic/toi-yeu-ban-rat-nhieu",[
      ".cover img","p.content",".subtitle","ul#detail-list-select li a",
      "a[href*='/chapter/']","a[href*='/chap/']",".chapter-list a",
      "h1",".chap-list a","img"]),
    ("novelbuddy_detail", "https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god",[
      ".name h1", "h1", ".img-cover img", ".meta p", ".chapter-list li",
      "a[href*='/chapter-']", "a[href*='/chapter/']", ".chapter-item",
      "#chapters", "article", "img"]),
    ("manhuavn_chap", "https://manhuavn2.com/doc-truyen/dai-quan-gia-la-ma-hoang-chapter-915.html",[
      "h1", ".reading-detail img", ".chapter-content img", "#chapter-content img",
      ".page-chapter img", "img"])
]
for name,url,selectors in DETAILS:
    print("DETAIL",name,url,flush=True)
    try:
        r=session.get(url,timeout=14)
        s=BeautifulSoup(r.text,"html.parser")
        print("HTTP",r.status_code,"CHARS",len(r.text),"TITLE",
              s.title.get_text(" ",strip=True)[:90] if s.title else "",flush=True)
        for css in selectors:
            els=s.select(css)
            print("SEL",css,len(els),repr(str(els[0])[:420]) if els else "",flush=True)
        chapter_links=[(a.get_text(" ",strip=True)[:45],a.get("href"))
                for a in s.select("a[href]")
                if "chap" in a.get("href","").lower()]
        print("CHAPTER_LINKS",repr(chapter_links[:8]),flush=True)
        classes=[(e.name,e.get("class"),e.get("id")) for e in s.find_all(["div","section","ul"],class_=True)
                 if any(key in " ".join(e.get("class",[])).lower() for key in ["detail","novel","chapter","story","book","content"])]
        print("CLASSES",repr(classes[:24]),flush=True)
    except Exception as exc:
        print("UNVERIFIED",repr(exc),flush=True)


print("=== TARGETED STRUCTURE ===",flush=True)
for name, url in [
 ("novelbuddy_chap","https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god/chapter-285-hes-a-mutant"),
 ("tranh18_chap","https://tranh18.cc/toi-yeu-ban-rat-nhieu/chapter/1028858"),
 ("novelbuddy_latest","https://novelbuddy.me/latest"),
 ("novelbuddy_detail","https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god"),
 ("tranh18_index","https://tranh18.cc/comics"),
]:
    print("STRUCT",name,flush=True)
    try:
        r=session.get(url,timeout=15)
        soup=BeautifulSoup(r.text,"html.parser")
        if name=="novelbuddy_latest":
            node=soup.select_one("article")
            print("ARTICLE_HTML",str(node)[:1800] if node else "N/A",flush=True)
        if name=="novelbuddy_detail":
            n=soup.select_one("h1")
            print("H1_PARENT",str(n.parent)[:1400] if n else "",flush=True)
            imgs=soup.select("img")
            print("IMAGES", [(i.get("alt"),i.get("src"),i.get("data-src")) for i in imgs[:10]],flush=True)
            print("TEXT_PARENT", str(soup.find(string=lambda x: x and "Author:" in x).parent)[:600] if soup.find(string=lambda x: x and "Author:" in x) else "",flush=True)
        if name=="novelbuddy_chap":
            for css in ["main","article",".chapter-content","#chapter-content",".prose","[class*=reader]","p"]:
                els=soup.select(css)
                print("CHAPTER_SELECT",css,len(els),str(els[0])[:450] if els else "",flush=True)
        if name=="tranh18_chap":
            for css in [".comicpage img",".chapter-content img",".comicpage",".content img","img[data-original]","img[data-src]"]:
                els=soup.select(css)
                print("IMAGE_SELECT",css,len(els),str(els[0])[:450] if els else "",flush=True)
        if name=="tranh18_index":
            for css in [".cat-list a","a[href*='tag=']","a[href*='/category/']","a[href*='/genre/']",".pagination a"]:
                els=soup.select(css)
                print("GENRE_SELECT",css,len(els),str(els[0])[:430] if els else "",flush=True)
    except Exception as ex:
        print("UNVERIFIED",str(ex)[:140],flush=True)


for name,url in [
 ("manhua_legacy_api","https://mhvn.truyensieuhay.com/api/story/getlisttheloaiinweb"),
 ("manhua_detail_page","https://manhuavn2.com/dai-quan-gia-la-ma-hoang-0.html"),
 ("manhua_list_page","https://manhuavn2.com/danhsach/P1/index.html?status=0&sort=2")
]:
    print("API_PROBE",name,flush=True)
    try:
        r=session.get(url,timeout=10)
        soup=BeautifulSoup(r.text,"html.parser")
        print("API_STATUS",r.status_code,r.url,"size",len(r.content),"contenttype",r.headers.get("Content-Type",""),flush=True)
        if name=="manhua_list_page":
            for css in [".item",".item a[href$='.html']", "a[href$='-0.html']", ".list-item",".story-item",".pagination a"]:
                els=soup.select(css)
                print("LIST_SELECT",css,len(els),str(els[0])[:280] if els else "",flush=True)
        if name=="manhua_detail_page":
            for css in ["a[href^='/doc-truyen/']",".detail-info",".title",".m-img img","h1",".desc",".truyen_description",".noidung"]:
                els=soup.select(css)
                print("DETAIL_SELECT",css,len(els),str(els[0])[:280] if els else "",flush=True)
        if name=="manhua_legacy_api":
            print("API_BODY_PREFIX",r.text[:190].replace("\n"," "),flush=True)
    except Exception as e:
        print("API_UNVERIFIED",str(e)[:190],flush=True)
