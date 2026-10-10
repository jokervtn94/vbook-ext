load("config.js");
load("listing.js");
function execute(key,page){
  var p=parseInt(page||"1",10);
  if(!(p>=1))p=1;
  var q=String(key||"").trim();
  if(!q)return Response.success([],null);
  var options={
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest","Referer":QQ_HOST+"/doc-truyen"},
    body:"search="+encodeURIComponent(q)+"&type=0"
  };
  return qqWithDoc(QQ_HOST+"/frontend/search/search",function(doc){
    var result=qqListing(doc,p);
    // Server search typically emits one unpaginated HTML snippet.
    if(result&&result.ok===false)return result;
    return Response.success(result.data||[],null);
  },options);
}
