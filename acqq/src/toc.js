load("config.js");
function execute(value){
    var url=acBook(value);
    if(!url)return Response.error("AC QQ: thiếu ID truyện khi lấy mục lục");
    return acGet(url,function(doc){
        var nodes=acSelect(doc,"a.chapter-link[href*='/chapter/index/id/']");
        if(!nodes)nodes=acSelect(doc,"a[href*='/chapter/index/id/']");
        var seen={},data=[];
        if(nodes)nodes.forEach(function(a){
            var dest=acChapter(a.attr("href"));
            if(!dest||seen[dest]||dest.indexOf("/id/"+acId(value)+"/")<0)return;
            seen[dest]=true;
            var title=acText(a,".chapter-title")||
                      String(a.text()||a.attr("title")||"").replace(/\s+/g," ").trim();
            if(!title)title="Chương "+(data.length+1);
            data.push({name:title,url:dest,host:AC_HOST});
        });
        return data.length?Response.success(data):
           Response.error("AC QQ: mục lục chưa được tải hoặc truyện chưa có chương công khai.");
    });
}
