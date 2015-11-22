/**
 * 
 */
define("biz/share_preview-debug", [], function(require) {
    if (typeof getPreviewData != "undefined") {
        var share = getPreviewData();
        var html = juicer("#show-content", share);
        $("#content").html(html);
    } else {
        $("#content").html('<p class="text-center">没有数据不能预览！</p>');
    }
});
