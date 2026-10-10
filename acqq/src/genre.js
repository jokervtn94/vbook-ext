load("config.js");
function execute(){
    return acGet(AC_HOST+"/category/index",function(doc){
        var nodes=acSelect(doc,"a[href*='/category/listAll?']");
        var groups=[{title:"Trang chủ · Đề cử",input:AC_HOST+"/",script:"gen.js"},
                    {title:"Bảng xếp hạng",input:AC_HOST+"/rank/biaosheng",script:"gen.js"}];
        if(nodes){
            var seen={};
            nodes.forEach(function(a){
                var href=acAbs(a.attr("href"));
                var name=String(a.text()||"").replace(/^\s*\|\s*/,"").replace(/\s+/g," ").trim();
                if(!href||!name||seen[href])return;
                seen[href]=true;groups.push({title:name,input:href,script:"gen.js"});
            });
        }
        return Response.success(groups);
    });
}
