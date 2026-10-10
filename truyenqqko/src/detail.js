load("config.js");
function execute(url){
  var target=qqStoryUrl(url)||qqAbs(url);
  return qqWithDoc(target,function(doc){
    var name=qqText(doc,["h1.title-detail","h1.title","h1[itemprop=name]",".story-info h1","h1"]);
    if(!name)return Response.error("TruyenQQKO: không tìm thấy tên truyện.");
    var cover=qqAbs(qqAttr(doc,["meta[property='og:image']"],"content"));
    if(!cover){
      var imgs=qqNodes(doc,[".book_avatar img",".story-info img",".story-detail img"]);
      cover=imgs?qqImg(imgs.first()):"";
    }
    var author=qqText(doc,["li.author p:last-child","li.author a",".story-info .author p",".author a"]);
    if(!author)author="Đang cập nhật";
    var root=qqNodes(doc,[".story-detail-info.detail-content",".story-detail-info",".detail-content"]);
    var description=root?String(root.first().html()||""):"";
    if(!description)description=qqAttr(doc,["meta[name=description]"],"content");
    var state=qqText(doc,["li.status p:last-child","li.status",".status"]);
    var genres=qqText(doc,["ul.list01",".list01"]);
    return Response.success({
      name:name,author:author,cover:cover,description:description,
      detail:(genres?genres+" | ":"")+state,
      ongoing:!/hoàn thành|complete/i.test(state),host:QQ_HOST
    });
  });
}
