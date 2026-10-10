load("config.js");
load("listing.js");
function execute(input,page){
  var p=parseInt(page||"1",10);
  if(!(p>=1))p=1;
  var url=String(input||QQ_HOST+"/doc-truyen")
    .replace(/^https?:\/\/[^/]+/i,QQ_HOST)
    .replace(/[?#].*$/,"")
    .replace(/\/trang-\d+\/?$/,"")
    .replace(/\/+$/,"");
  if(url.indexOf(QQ_HOST+"/")!==0)url=QQ_HOST+"/doc-truyen";
  if(p>1)url+="/trang-"+p;
  if(p>1&&/\/truyen-hoan-thanh\/trang-\d+$/.test(url))url+="?status=2";
  return qqWithDoc(url,function(doc){return qqListing(doc,p)});
}
