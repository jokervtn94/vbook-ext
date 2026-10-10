load("config.js");
function qqChapNo(url){
  var m=String(url).match(/-chap-(\d+(?:[.-]\d+)*)/i);
  return m?parseFloat(m[1].replace("-",".")):-1;
}
function execute(url){
  var target=qqStoryUrl(url)||qqAbs(url);
  var match=target.match(/\/truyen-tranh\/([^?#]+)/i);
  var slug=match?match[1].replace(/\.html$/,"").replace(/-\d+$/,""):"";
  return qqWithDoc(target,function(doc){
    var links=qqNodes(doc,[
      ".works-chapter-item a[href]",
      ".list_chapter a[href]",
      ".list-chapter a[href]",
      ".chapter-list a[href]",
      "a[href*='-chap-']"
    ]);
    if(!links)return Response.error("TruyenQQKO: không tìm thấy mục lục chương.");
    var data=[],seen={};
    links.forEach(function(a){
      var u=qqAbs(a.attr("href")||"").replace(/^https?:\/\/[^/]+/i,QQ_HOST);
      if(u.indexOf("/truyen-tranh/")<0||!/-chap-\d/i.test(u)||(slug&&u.indexOf(slug)<0)||seen[u])return;
      seen[u]=true;
      data.push({name:String(a.text()||"").trim()||"Chương "+qqChapNo(u),url:u,host:QQ_HOST});
    });
    if(!data.length)return Response.error("TruyenQQKO: không tìm thấy chương hợp lệ.");
    if(data.length>1&&qqChapNo(data[0].url)>qqChapNo(data[data.length-1].url))data.reverse();
    return Response.success(data);
  });
}
