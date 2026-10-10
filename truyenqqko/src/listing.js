function qqListing(doc,page){
  var cards=qqNodes(doc,["ul.list_grid.grid > li","ul.list_grid li",".list_grid li",".list_grid .item",".story-item",".search-result li"]);
  if(!cards)cards=qqNodes(doc,["a[href*='/truyen-tranh/']"]);
  var data=[],seen={};
  if(cards)cards.forEach(function(card){
    var links=qqNodes(card,[".book_name a[href]","p.name a[href]","h3 a[href]","a[href*='/truyen-tranh/']"]);
    var anchor=links?links.first():card;
    var link=qqStoryUrl(anchor.attr("href")||"");
    if(!link||seen[link])return;
    var name=String(anchor.attr("title")||anchor.text()||"").replace(/\s+/g," ").trim();
    if(!name||name.length>180)name=qqText(card,["p.name",".book_name","h3",".title"]);
    if(!name||name.length>180)return;
    var imgs=qqNodes(card,[".book_avatar img","img"]);
    var cover=imgs?qqImg(imgs.first()):"";
    var description=qqText(card,[".chapter","p.chapter",".last_chapter",".book_info",".author"]);
    seen[link]=true;
    data.push({name:name,link:link,cover:cover,description:description,host:QQ_HOST});
  });
  if(!data.length)return Response.error("TruyenQQKO: không tìm thấy truyện trong trang danh sách.");
  return Response.success(data,qqNext(doc,page));
}
