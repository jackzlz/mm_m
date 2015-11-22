/**
 * 
 */
define(function(require) {
	var datas = (typeof getPreviewData != "undefined" && getPreviewData()) || appmsgData;
	$("#content").html(juicer("#show-content", datas));
});