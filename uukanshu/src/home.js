function execute() {
    return Response.success([
        {title:"Mới cập nhật",input:"https://uukanshu.cc/top/lastupdate_{0}.html",script:"gen.js"},
        {title:"Truyện mới",input:"https://uukanshu.cc/top/postdate_{0}.html",script:"gen.js"},
        {title:"Phổ biến",input:"https://uukanshu.cc/top/allvisit_{0}.html",script:"gen.js"},
        {title:"Hoàn thành",input:"https://uukanshu.cc/quanben/{0}.html",script:"gen.js"},
        {title:"玄幻奇幻",input:"https://uukanshu.cc/class_1_{0}.html",script:"gen.js"},
        {title:"武俠仙俠",input:"https://uukanshu.cc/class_2_{0}.html",script:"gen.js"},
        {title:"現代都市",input:"https://uukanshu.cc/class_3_{0}.html",script:"gen.js"},
        {title:"歷史軍事",input:"https://uukanshu.cc/class_4_{0}.html",script:"gen.js"},
        {title:"遊戲競技",input:"https://uukanshu.cc/class_6_{0}.html",script:"gen.js"},
        {title:"恐怖靈異",input:"https://uukanshu.cc/class_7_{0}.html",script:"gen.js"},
        {title:"動漫同人",input:"https://uukanshu.cc/class_9_{0}.html",script:"gen.js"}
    ]);
}
