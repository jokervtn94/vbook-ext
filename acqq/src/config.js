var AC_HOST = "https://m.ac.qq.com";
function acId(value){
    var s=String(value||"").trim();
    if(/^\d+$/.test(s))return s;
    var m=s.match(/\/(?:Comic\/[Cc]omicInfo|comic\/index)\/id\/(\d+)(?:[/?#]|$)/i)
        ||s.match(/\/(?:ComicView|chapter)\/index\/id\/(\d+)(?:[/?#]|$)/i);
    return m?m[1]:"";
}
function acBook(value){
    var id=acId(value);
    return id?AC_HOST+"/comic/index/id/"+id:"";
}
function acChapter(value){
    var s=String(value||"").trim();
    var m=s.match(/\/(?:ComicView|chapter)\/index\/id\/(\d+)\/(?:cid|seqno)\/(\d+)/i);
    return m?AC_HOST+"/chapter/index/id/"+m[1]+"/"+(s.toLowerCase().indexOf("/seqno/")>=0?"seqno":"cid")+"/"+m[2]:"";
}
function acAbs(value){
    var s=String(value||"").trim().replace(/&amp;/g,"&");
    if(!s||/^(?:data:|javascript:|blob:|about:)/i.test(s))return "";
    if(s.slice(0,2)==="//")return "https:"+s;
    if(/^https?:\/\//i.test(s))return s.replace(/^http:/i,"https:");
    if(s[0]==="/")return AC_HOST+s;
    return AC_HOST+"/"+s.replace(/^(?:\.\.\/|\.\/)+/,"");
}

function acCatalogUrl(input){
  var v=input;
  if(v&&typeof v==="object")v=v.input||v.url||v.link||v.category||"";
  var s=String(v||"").trim().replace(/&amp;/g,"&");
  if(!s||s==="null"||s==="undefined")return AC_HOST+"/";
  if(s.slice(0,2)==="//")s="https:"+s;
  var repeated=s.match(/^https?:\/\/(?:m\.|www\.)?ac\.qq\.com\/(https?:\/\/(?:m\.|www\.)?ac\.qq\.com\/.*)$/i);
  if(repeated)s=repeated[1];
  var path="";
  if(/^https?:\/\//i.test(s)){
    var parts=s.match(/^https?:\/\/([^/?#]+)(\/[^?#]*)?(\?[^#]*)?/i);
    // Never follow arbitrary external hosts when VBook sends unexpected inputs.
    if(!parts||!/^(?:m\.|www\.)?ac\.qq\.com$/i.test(parts[1]))return AC_HOST+"/";
    path=(parts[2]||"/")+(parts[3]||"");
  }else path="/"+s.replace(/^\/+/,"");
  path=path.replace(/#.*$/,"");
  if(!path||path==="/")return AC_HOST+"/";
  // Desktop /Comic/all redirects to a category landing page without novel cards.
  if(/^\/Comic\/all(?:\/.*)?(?:\?.*)?$/i.test(path))return AC_HOST+"/";
  if(/^\/(?:category\/index|rank\/index)\/?(?:\?.*)?$/i.test(path))
    return path.toLowerCase().indexOf("/rank/")===0?AC_HOST+"/rank/biaosheng":AC_HOST+"/";
  if(/^\/(?:category\/(?:listAll(?:\?.*)?|[a-z0-9_-]+(?:\?.*)?)|rank\/[a-z0-9_-]+(?:\?.*)?)$/i.test(path))return AC_HOST+path;
  return AC_HOST+"/";
}

function acSelect(root,selector){
    if(!root||typeof root.select!=="function")return null;
    var x=root.select(selector);
    return x&&typeof x.size==="function"&&x.size()>0?x:null;
}
function acText(root,selector){
    var x=acSelect(root,selector);
    return x?String(x.first().text()||"").replace(/\s+/g," ").trim():"";
}
function acAttr(root,selector,field){
    var x=acSelect(root,selector);
    return x?String(x.first().attr(field)||"").trim():"";
}
function acImg(node){
    if(!node)return "";
    var fields=["data-original","data-src","data-lazy-src","src"];
    for(var i=0;i<fields.length;i++){
        var url=acAbs(node.attr(fields[i]));
        if(url&&!/(?:placeholder|loading|blank)\.(?:gif|png)(?:[?#]|$)/i.test(url))return url;
    }
    return "";
}
function acCover(root){
    var imgs=acSelect(root,"img.cover-image, img.comic-cover, img.head-cover, img.item-cover, img");
    if(!imgs)return "";
    for(var i=0;i<imgs.size();i++){
        var src=acImg(imgs.get(i));
        if(src)return src;
    }
    return "";
}
function acGet(url,parse){
    try{
        var resp=fetch(url);
        if(!resp.ok)return Response.error("AC QQ HTTP "+resp.status+" khi tải "+url);
        var doc=resp.html();
        if(!doc)return Response.error("AC QQ: HTML trả về trống");
        return parse(doc);
    }catch(e){
        return Response.error("AC QQ: "+(e&&e.message?e.message:e));
    }
}
function acCards(doc){
    var cards=acSelect(doc,"a.comic-link[href], a[href*='/comic/index/id/']");
    var result=[],seen={};
    if(!cards)return result;
    cards.forEach(function(a){
        var href=String(a.attr("href")||"");
        var link=acBook(href);
        if(!link||seen[link])return;
        var name=acText(a,".comic-title")||acText(a,".item-title")||
                 String(a.attr("title")||"").trim()||acText(a,"strong")||
                 String(a.text()||"").replace(/\s+/g," ").trim();
        var cover=acCover(a);
        if(!name||!cover)return;
        seen[link]=true;
        result.push({name:name,link:link,cover:cover,
           description:acText(a,".comic-desc")||acText(a,".comic-update")||"",
           host:AC_HOST});
    });
    return result;
}
function acAvailableChapterImages(doc){
    var nodes=acSelect(doc,".comic-pic-list img, #comicContain img, .chapter-content img, .comic-pic img, img.comic-pic-image");
    var images=[],seen={};
    if(!nodes)return images;
    nodes.forEach(function(img){
        var src=acImg(img);
        if(src&&!seen[src]){images.push(src);seen[src]=true;}
    });
    return images;
}
