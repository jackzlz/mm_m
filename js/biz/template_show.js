define("biz/template_show",[],function(a){var b="undefined"!=typeof getPreviewData&&getPreviewData()||templateData;$("#content").html(juicer("#show-content",b))});