function execute(){
  var host="https://truyenqqko.com";
  return Response.success([
    {title:"Đọc truyện",input:host+"/doc-truyen",script:"gen.js"},
    {title:"Truyện hoàn thành",input:host+"/truyen-hoan-thanh",script:"gen.js"}
  ]);
}
