function execute(){
    var h="https://m.ac.qq.com";
    return Response.success([
        {title:"Trang chủ · Đề cử",input:h+"/",script:"gen.js"},
        {title:"Bảng xếp hạng · Tăng trưởng",input:h+"/rank/biaosheng",script:"gen.js"},
        {title:"Phân loại truyện",input:h+"/category/index",script:"genre.js"}
    ]);
}
