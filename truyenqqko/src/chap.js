load("config.js");
function execute(url){
  return qqWithDoc(qqAbs(url),function(doc){
    var imgs=qqNodes(doc,[
      "div.page-chapter[id^=page_] img",
      "div[id^=page_].page-chapter img",
      ".page-chapter img",
      "#chapter_content .page-chapter img",
      ".chapter-content img"
    ]);
    if(!imgs)return Response.error("TruyenQQKO: không có khung ảnh chương.");
    var data=[],seen={};
    imgs.forEach(function(img){
      var src=qqImg(img);
      if(src&&!seen[src]){seen[src]=true;data.push(src);}
    });
    return data.length?Response.success(data):
      Response.error("TruyenQQKO: không tìm thấy ảnh chương công khai hoặc ảnh chưa tải.");
  });
}
