"""Locate public WuxiaWorld chapter-list transport in current page JS.
Read-only endpoint discovery; print metadata and small code neighborhoods only.
"""
import concurrent.futures
import re
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
URL="https://www.wuxiaworld.com/novel/coiling-dragon"
KEYS=["Kd=class", "Vy=", "L3=", "L3,", "getChapterList,qe(",
      "mergeOptions", "baseUrl", "baseURL", "grpc-web", "grpcWeb",
      "connect-web", "connect-es", "api.wuxiaworld.com",
      "api2.wuxiaworld", "wuxiaworld.api.v2.Chapters",
      "wuxiaworld.api.v2.GetChapterList", "chapterGroups"]
S=requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"})
r=S.get(URL,timeout=16);r.raise_for_status()
doc=BeautifulSoup(r.text,"html.parser")
scripts=[urljoin(URL,t["src"]) for t in doc.select("script[src]") if t.get("src")]
scripts=list(dict.fromkeys(scripts))
print("PAGE",r.status_code,"SCRIPT COUNT",len(scripts),"TIT",doc.title.get_text(" ",strip=True) if doc.title else None,flush=True)
print("SCRIPT HOSTS",list(dict.fromkeys(urlparse(u).netloc for u in scripts)),flush=True)
def scan(url):
 try:
  x=S.get(url,timeout=(4,16))
  if not x.ok:return {"url":url,"status":x.status_code}
  content=x.text
  hits=[]
  for pattern in KEYS:
   start=0
   for attempt in range(2):
    at=content.find(pattern,start)
    if at<0:break
    excerpt=content[max(at-210,0):at+250].replace("\n"," ").replace("\r"," ")
    hits.append((pattern,excerpt[:460]))
    start=at+len(pattern)
  if hits:
   urls=sorted(set(re.findall(r'https?://[A-Za-z0-9._:-]*wuxiaworld[A-Za-z0-9./_?=-]*',content)))
   return {"url":url[-90:],"bytes":len(content),"hits":hits[:36],"wuxia_hosts":urls[:30]}

  return {"url":url[-90:],"bytes":len(content),"hits":[]}
 except requests.RequestException as e:return {"url":url[-90:],"error":type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 rows=list(ex.map(scan,scripts[:36]))
for row in rows:
 if row.get("hits") or row.get("error"):print("BUNDLE",row,flush=True)
print("SCANNED",len(rows),"WITH-HITS",sum(bool(r.get("hits")) for r in rows),flush=True)

# Probe the public Connect RPC endpoint referenced by the current website bundle.
# Never send login credentials or request paid chapter content.
api="https://api2.wuxiaworld.com/wuxiaworld.api.v2.Chapters/GetChapterList"
for group in [318, 3]:
 body={"novelId":6,"filter":{"chapterGroupId":{"value":group}}}
 for use_connect_header in [False, True]:
  hdr={"Content-Type":"application/json",
       "Origin":"https://www.wuxiaworld.com",
       "Referer":"https://www.wuxiaworld.com/"}
  if use_connect_header:hdr["Connect-Protocol-Version"]="1"
  try:
   rr=S.post(api,json=body,headers=hdr,timeout=(5,15))
   shape={"group":group,"connect":use_connect_header,"status":rr.status_code,
          "type":rr.headers.get("Content-Type",""),"bytes":len(rr.content)}
   try:
    parsed=rr.json()
    shape["keys"]=list(parsed)[:12] if isinstance(parsed,dict) else []
    if isinstance(parsed,dict):
     groups=parsed.get("items",[])
     shape["groups"]=len(groups)
     shape["chapters"]=sum(len(g.get("chapterList",[])) for g in groups)
     shape["first_chapter"]=(groups[0].get("chapterList") or [{}])[0].get("slug") if groups else None
     shape["error_code"]=parsed.get("code")
     shape["error_message"]=str(parsed.get("message",""))[:120]
   except ValueError:shape["preview"]=rr.text[:150]
   print("CONNECT_PROBE",shape,flush=True)
  except requests.RequestException as exc:print("CONNECT_PROBE",{"group":group,"error":type(exc).__name__},flush=True)

# Binary gRPC-Web tests with a public volume only. Proto based on website.
import base64
def vint(n):
 out=[]
 while n>=128:
  out.append((n&127)|128);n>>=7
 return bytes(out+[n])
def ldelim(field,buf):return vint((field<<3)|2)+vint(len(buf))+buf
def var(field,n):return vint(field<<3)+vint(n)
def proto(group):
 f=ldelim(1,var(1,group))
 return var(1,6)+ldelim(2,f)
for group in [318, 3]:
 packet=proto(group)
 framed=b"\0"+len(packet).to_bytes(4,"big")+packet
 for content_type in ["application/grpc-web+proto","application/grpc-web-text","application/grpc+proto"]:
  body=base64.b64encode(framed) if content_type.endswith("text") else framed
  hdr={"Content-Type":content_type,"Accept":content_type,
       "x-grpc-web":"1","x-user-agent":"grpc-web-javascript/0.1",
       "Origin":"https://www.wuxiaworld.com",
       "Referer":"https://www.wuxiaworld.com/"}
  try:
   rr=S.post(api,data=body,headers=hdr,timeout=(5,15))
   preview=rr.content[:28].hex()
   print("GRPC_PROBE",{"group":group,"type":content_type,"status":rr.status_code,
    "resp_type":rr.headers.get("Content-Type"),"grpc_status":rr.headers.get("grpc-status"),
    "bytes":len(rr.content),"hex":preview,"text_prefix":rr.text[:35] if rr.status_code>=400 else ""},
    flush=True)
  except requests.RequestException as exc:
   print("GRPC_PROBE",{"group":group,"type":content_type,"error":type(exc).__name__},flush=True)
