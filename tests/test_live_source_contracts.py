"""Read-only live source smoke tests, distinct from Android Vbook runtime tests."""
import json
import requests
from bs4 import BeautifulSoup

S = requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0","Accept":"text/html,application/json"})
URL = "https://novelbuddy.me/what-do-you-mean-i-have-to-comprehend-dao-as-a-mortal-god"
r = S.get(URL, timeout=18)
r.raise_for_status()
doc = BeautifulSoup(r.text,"html.parser")
script = doc.select_one("script#__NEXT_DATA__")
assert script, "NovelBuddy Next.js payload missing"
props = json.loads(script.string)["props"]["pageProps"]
id = props["initialManga"]["id"]
expected = props["initialManga"]["stats"]["chaptersCount"]
base = props["siteConfig"]["apiUrl"]
api = S.get(base.rstrip("/")+"/titles/"+id+"/chapters",timeout=18)
api.raise_for_status()
payload=api.json()
assert payload["success"],"NovelBuddy API did not report success"
chapters=payload["data"]["chapters"]
assert expected>=2 and len(chapters)>=int(expected*0.95),(len(chapters),expected)
assert all(ch.get("name") and ch.get("url") for ch in chapters),"invalid chapter metadata"
assert chapters[0]["number"]>chapters[-1]["number"],"unexpected chapter ordering"
nums={ch.get("number") for ch in chapters if isinstance(ch.get("number"),int)}
missing=sorted(set(range(min(nums),max(nums)+1))-nums) if nums else []
print("PASS NovelBuddy chapter API:",len(chapters),"chapters; site statistic:",expected,
      "numbering gaps:",missing[:20],flush=True)

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
