load("config.js");
function execute(){
  return qqWithDoc(QQ_HOST+"/doc-truyen",function(doc){
    var links=qqNodes(doc,["a[href*='/the-loai/']"]);
    if(!links)return Response.error("TruyenQQKO: không tìm thấy thể loại.");
    var data=[],seen={};
    links.forEach(function(a){
      var href=qqAbs(a.attr("href")||"");
      var name=String(a.text()||"").replace(/\s+/g," ").trim();
      if(!/\/the-loai\/[a-z0-9-]+(?:\/|$|\?)/i.test(href)||!name||seen[href])return;
      seen[href]=true;
      data.push({title:name,input:href,script:"gen.js"});
    });
    return data.length?Response.success(data):Response.error("TruyenQQKO: danh sách thể loại rỗng.");
  });
}
