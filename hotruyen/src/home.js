function execute() {
    var base = "https://hotruyen1.com";
    return Response.success([
        {title:"Mới cập nhật · Nam sinh",input:base+"/nam-sinh",script:"gen.js"},
        {title:"Mới cập nhật · Ngôn tình",input:base+"/ngon-tinh",script:"gen.js"},
        {title:"Mới cập nhật · Đam mỹ",input:base+"/dam-my",script:"gen.js"},
        {title:"Mới cập nhật · Vô CP",input:base+"/vo-cp",script:"gen.js"},
        {title:"Mới cập nhật · Bách hợp",input:base+"/bach-hop",script:"gen.js"},
        {title:"Mới cập nhật · Khác",input:base+"/khac",script:"gen.js"}
    ]);
}
