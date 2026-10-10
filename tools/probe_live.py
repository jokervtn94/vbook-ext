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
