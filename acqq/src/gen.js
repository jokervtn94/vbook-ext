load("config.js");
function execute(input,page){
    var p=parseInt(page||"1",10);if(!(p>=1))p=1;
    var url=acCatalogUrl(input);
    // Tencent's mobile page renders its first server-side catalog page.
    // Never claim further pages when server-side pagination is not confirmed.
    if(p>1)return Response.success([],null);
    return acGet(url,function(doc){
        var data=acCards(doc);
        if(!data.length)return Response.error("AC QQ: trang chưa trả danh sách truyện trong HTML (có thể chỉ tải bằng JavaScript).");
        return Response.success(data,null);
    });
}
