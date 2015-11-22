define(function(require, exports, module) {
	var tips = function() {
		this.errMsg = "系统发生错误，请稍后重试";
		this.sucMsg = "操作成功";
		this.delay = 2;
	};

	tips.error = function(msg, onComplete) {
		tip("error", msg || this.errMsg, onComplete);
	};

	tips.success = function(msg, onComplete) {
		tip("success", msg || this.sucMsg, onComplete);
	};

	function tip(type, msg, onComplete) {
		$(".JS_TIPS").remove();

		var template = '<div class="JS_TIPS page_tips !{type}" id="wxTips_' +
						(new Date()).getTime() +
						'"><div class="inner">!{msg}</div></div>';
		var data = {
			"type" : type || "error",
			"msg" : msg
		};
		var tt = $(juicer(template, data)).appendTo("body").fadeIn();
		window.setTimeout(function() {
			tt.fadeOut({
				complete : function() {
					tt.remove();
					if (onComplete) {
						onComplete();
					}
				}
			});
		}, 2000);
	}
	module.exports = tips;
});
