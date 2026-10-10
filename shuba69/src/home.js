function execute() {
    return Response.success([
        {title: "排行榜", input: "0", script: "gen.js"},
        {title: "玄幻魔法", input: "1", script: "gen.js"},
        {title: "修真武侠", input: "2", script: "gen.js"},
        {title: "言情小说", input: "3", script: "gen.js"},
        {title: "都市小说", input: "4", script: "gen.js"},
        {title: "历史军事", input: "5", script: "gen.js"},
        {title: "游戏竞技", input: "6", script: "gen.js"},
        {title: "科幻空间", input: "7", script: "gen.js"},
        {title: "悬疑惊悚", input: "8", script: "gen.js"},
        {title: "同人小说", input: "9", script: "gen.js"}
    ]);
}
