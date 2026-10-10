var QQ_HOST="https://truyenqqko.com";
function qqNodes(root,selectors){
  if(!root||typeof root.select!=="function")return null;
  for(var i=0;i<selectors.length;i++){
    var nodes=root.select(selectors[i]);
    if(nodes&&typeof nodes.size==="function"&&nodes.size()>0)return nodes;
  }
  return null;
}
function qqText(root,selectors){
  var nodes=qqNodes(root,selectors);
  return nodes?String(nodes.first().text()||"").replace(/\s+/g," ").trim():"";
}
function qqAttr(root,selectors,attr){
  var nodes=qqNodes(root,selectors);
  return nodes?String(nodes.first().attr(attr)||"").trim():"";
}
function qqAbs(value){
  var x=String(value||"").trim();
  if(!x||/^(data:|javascript:|about:|blob:)/i.test(x))return "";
  if(x.indexOf("//")===0)return "https:"+x;
  if(/^https?:\/\//i.test(x))return x.replace(/^http:/i,"https:");
  if(x.charAt(0)==="/")return QQ_HOST+x;
  return QQ_HOST+"/"+x.replace(/^\.\//,"");
}
function qqStoryUrl(value){
  var x=qqAbs(value).replace(/^https?:\/\/[^/]+/i,QQ_HOST);
  var m=x.match(/\/truyen-tranh\/[a-z0-9-]+(?:\.html)?(?=[?#]|$)/i);
  if(!m||/-chap-\d+(?:[.-]\d+)*(?:\.html)?$/i.test(m[0]))return "";
  return QQ_HOST+m[0].replace(/\.html$/i,"");
}
function qqImg(node){
  if(!node)return "";
  var attrs=["data-original","data-cdn","data-fb","data-src","data-lazy-src","src"];
  for(var i=0;i<attrs.length;i++){
    var url=String(node.attr(attrs[i])||"").trim();
    if(!url||/^(data:|javascript:|about:)/i.test(url)||/(?:loading|placeholder|blank|spinner)\.(?:gif|png|svg)(?:\?|$)/i.test(url))continue;
    return qqAbs(url);
  }
  return "";
}
function qqIsChallenge(doc){
  if(!doc||typeof doc.select!=="function")return false;
  var marks=doc.select("#challenge-form, #cf-challenge-running, .cf-turnstile");
  return !!(marks&&marks.size&&marks.size())||
    /just a moment|checking your browser|attention required|cloudflare/i.test(qqText(doc,["title"]));
}
function qqCloudflareError(){
  return Response.error("TruyenQQKO yêu cầu xác minh Cloudflare. Hãy mở website trong trình duyệt VBook, xác minh thủ công rồi tải lại. Nếu vẫn bị chặn, VBook có thể chưa chia sẻ phiên xác minh.");
}
function qqWithDoc(url,callback,options){
  var browser=null,challenged=false,status=0;
  try{
    var response=options?fetch(url,options):fetch(url);
    status=response.status||0;
    if(response.ok){
      var doc=response.html();
      challenged=qqIsChallenge(doc);
      if(doc&&!challenged)return callback(doc);
    }else{
      challenged=status===403||status===429||status===503;
      if(!challenged)return Response.error("TruyenQQKO HTTP "+status+": "+url);
    }
    // Browser fallback only renders public pages; it does not solve human challenges.
    if((!options||String(options.method||"GET").toUpperCase()==="GET")&&typeof Engine!=="undefined"&&Engine.newBrowser){
      try{
        browser=Engine.newBrowser();
        var rendered=browser.launch(url,12000);
        if(!rendered||qqIsChallenge(rendered))rendered=browser.html(1400);
        if(rendered&&!qqIsChallenge(rendered))return callback(rendered);
        challenged=challenged||qqIsChallenge(rendered);
      }catch(e){}
    }
    return challenged?qqCloudflareError():Response.error("TruyenQQKO: không nhận được trang nội dung.");
  }catch(e){
    return Response.error("TruyenQQKO: "+(e&&e.message?e.message:e));
  }finally{
    if(browser)try{browser.close()}catch(e){}
  }
}
function qqNext(doc,page){
  var a=qqNodes(doc,[".pagination li.active + li a[href]",".pagination a.active + a[href]",".pagination a[rel=next]",".pagination a.next[href]",".pagination li.next a[href]"]);
  if(!a)return null;
  for(var i=0;i<a.size();i++){
    var el=a.get(i),label=String(el.text()||"").trim(),href=String(el.attr("href")||"");
    var match=href.match(/\/trang-(\d+)(?:\/|\?|$)/);
    if(match&&Number(match[1])>Number(page))return String(Number(page)+1);
    if(/^\d+$/.test(label)&&Number(label)>Number(page))return String(Number(page)+1);
    if(/^(next|tiếp|sau|»|›|→)$/i.test(label)&&href)return String(Number(page)+1);
  }
  return null;
}
