function execute() {
    var base = "https://hotruyen1.com";
    // The old /truyen-*-... pages are retired. These six /<group>
    // routes still respond with update feeds and are the site's own categories.
    return Response.success([
        {title:"Nam sinh",input:base+"/nam-sinh",script:"gen.js"},
        {title:"Ngôn tình",input:base+"/ngon-tinh",script:"gen.js"},
        {title:"Đam mỹ",input:base+"/dam-my",script:"gen.js"},
        {title:"Vô CP",input:base+"/vo-cp",script:"gen.js"},
        {title:"Bách hợp",input:base+"/bach-hop",script:"gen.js"},
        {title:"Khác",input:base+"/khac",script:"gen.js"}
    ]);
}
