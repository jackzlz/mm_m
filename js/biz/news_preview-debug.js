/**
 * 
 */
define("biz/news_preview-debug", [], function(require) {
    var news = item;
    if (!news || !news.title) {
        if (typeof getPreviewData != "undefined") {
            news = getPreviewData();
        }
    }
    if (news && news.title) {
        var html = juicer("#show-content", news);
        $("#content").html(html);
    } else {
        $("#content").html('<p class="text-center">没有数据不能预览！</p>');
    }
});
