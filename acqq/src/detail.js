load("config.js");
function execute(value){
    var target=acBook(value);
    if(!target)return Response.error("AC QQ: ID truyện không hợp lệ");
    return acGet(target,function(doc){
        var name=acText(doc,"h1.top-title")||acText(doc,"h1");
        if(!name)return Response.error("AC QQ: không tìm thấy tên truyện trên trang chi tiết");
        var image=acAbs(acAttr(doc,"meta[property='og:image']","content"))||
                  acCover(doc);
        var author=acText(doc,".head-info-author")||acText(doc,".author-name")||
                   acText(doc,".works-intro-digi .first em")||"Đang cập nhật";
        var desc=acText(doc,".head-info-desc");
        var status=acText(doc,".chapter-info")||acText(doc,".chapter-count");
        return Response.success({
            name:name,cover:image,author:author,description:desc,
            detail:status,ongoing:!/完结|完本|已完结/.test(status),
            host:AC_HOST
        });
    });
}
