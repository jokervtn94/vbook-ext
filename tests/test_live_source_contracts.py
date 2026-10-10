"""Read-only live source smoke tests, distinct from Android Vbook runtime tests."""
import json
import requests
from bs4 import BeautifulSoup

S = requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0","Accept":"text/html,application/json"})
for n in [1,2,100,915]:
    url="https://manhuavn2.com/doc-truyen/dai-quan-gia-la-ma-hoang-chapter-%s.html"%n
    page = S.get(url,timeout=18)
    page.raise_for_status()
    dom=BeautifulSoup(page.text,"html.parser")
    locked=bool(dom.select("#chapcontent .vip-lock"))
    images=dom.select("#chapcontent .page-chapter img[data-original]")
    if n<=100:
        assert not locked and len(images)>4,(n,locked,len(images))
        assert all(i.get("data-original") not in ("","/images/loading.gif") for i in images)
    elif locked:
        assert not images, "Locked chapter must not be fetched as a free image list"
    print("PASS ManhuaVN chapter",n,"locked",locked,"free images",len(images),flush=True)
