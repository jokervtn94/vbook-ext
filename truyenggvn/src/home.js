function execute() {
    var host = "https://truyenggvn.com";
    return Response.success([
        {title: "Mới cập nhật", input: host + "/truyen-moi-cap-nhat.html", script: "gen.js"},
        {title: "Truyện mới", input: host + "/truyen-moi.html", script: "gen.js"},
        {title: "Top ngày", input: host + "/top-ngay.html", script: "gen.js"},
        {title: "Top tuần", input: host + "/top-tuan.html", script: "gen.js"},
        {title: "Top tháng", input: host + "/top-thang.html", script: "gen.js"},
        {title: "Yêu thích", input: host + "/top-binh-chon.html", script: "gen.js"},
        {title: "Truyện hoàn thành", input: host + "/truyen-hoan-thanh.html", script: "gen.js"}
    ]);
}
