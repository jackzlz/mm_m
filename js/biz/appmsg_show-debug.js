/**
 * 
 */
define("biz/appmsg_show-debug", [], function(require) {
    var datas = typeof getPreviewData != "undefined" && getPreviewData() || appmsgData;
    $("#content").html(juicer("#show-content", datas));
});
