load("config.js");
function execute(value){
    var url=acChapter(value);
    if(!url)return Response.error("AC QQ: đường dẫn chương không hợp lệ");
    var browser=null;
    try{
        var resp=fetch(url);
        if(resp.ok){
            var staticImages=acAvailableChapterImages(resp.html());
            if(staticImages.length)return Response.success(staticImages);
        }else if(resp.status!==403 && resp.status!==429){
            return Response.error("AC QQ: chương HTTP "+resp.status);
        }
        // The current mobile chapter HTML contains navigation and an encoded
        // runtime payload; readable page images may require WebView rendering.
        if(typeof Engine!=="undefined"&&Engine.newBrowser){
            try{
                browser=Engine.newBrowser();
                var doc=browser.launch(url,16000);
                if(!doc)doc=browser.html(1600);
                var images=acAvailableChapterImages(doc);
                if(!images.length)images=acAvailableChapterImages(browser.html(2500));
                if(images.length)return Response.success(images);
            }catch(ignore){}
        }
        return Response.error("AC QQ: chương chưa có ảnh công khai trong HTML/WebView; có thể cần đăng nhập, mở bằng ứng dụng Tencent hoặc giới hạn bản quyền.");
    }catch(e){
        return Response.error("AC QQ chương: "+(e&&e.message?e.message:e));
    }finally{
        if(browser)try{browser.close()}catch(ignoreClose){}
    }
}
