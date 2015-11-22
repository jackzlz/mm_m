/**
 * 
 */
define("biz/template_show-debug", [], function(require) {
    var datas = typeof getPreviewData != "undefined" && getPreviewData() || templateData;
    $("#content").html(juicer("#show-content", datas));
});
