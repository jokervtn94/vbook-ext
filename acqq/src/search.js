load("config.js");
function execute(key,page){
    var keyword=String(key||"").trim();
    if(!keyword)return Response.success([],null);
    var p=parseInt(page||"1",10);if(!(p>=1))p=1;
    if(p>1)return Response.success([],null);
    var url=AC_HOST+"/search/result?word="+encodeURIComponent(keyword);
    return acGet(url,function(doc){
        var list=acCards(doc);
        return list.length?Response.success(list,null):Response.error(
            "AC QQ: không có kết quả tìm kiếm hoặc giao diện tìm kiếm đã đổi.");
    });
}
