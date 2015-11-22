/**
 * 富文本编辑器
 */
define(function(require, exports, module) {
	require("./ueditor_custom");
	var tips = require("./tips");

	var defaultOptions = {
		wordCount : false,
		elementPathEnabled : false
	};

	var Ueditor = function(options) {
		this.options = $.extend(true, {}, defaultOptions, options);
		this.init();
	};

	Ueditor.prototype = {
		constructor : Ueditor,
		init : function() {
			var that = this, opts = that.options;
			that.editor = UE.getEditor(opts.container, opts);
			that.initEvents();
		},
		initEvents : function() {
			var that = this, opts = that.options, editor = that.editor;
			editor.addListener("catchremotesuccess", function() {
				tips.success("内容已上传完成");
			});
			editor.addListener("catchremoteerror", function() {
				tips.error("远程图片抓取失败");
			});
			editor.ready(function() {
				var toolbars = editor.ui.toolbars;
				$('#' + editor.ui.toolbars[0].id).addClass("edui-toolbar-primary");
				$('#' + editor.ui.toolbars[1].id).addClass("edui-toobar-secondary");
				$("#" + opts.id + "_toolbarbox").addClass("show-edui-more");
				for (var i = 0; i < toolbars.length; i++) {
					var toolbar = toolbars[i];
					var items = toolbar.items;
					for (var j = 0; j < items.length; j++) {
						if (items[j] instanceof UE.ui.Combox || items[j] instanceof UE.ui.SplitButton) {
							$("#" + items[j].id + "_state").tooltip({
								container : 'body'
							});
						} else if (items[j] instanceof UE.ui.Button || items[j] instanceof UE.ui.MenuButton) {
							$("#" + items[j].id + "_body").tooltip({
								container : 'body'
							});
						}
					}
				}
			});
		},
		getData : function() {
			var data = this.editor.getContent();
			if (data.length) {
				data = data
						.replace(/<p><iframe(.*?)class=\"embed-responsive-item\"(.*?)<\/iframe><\/p>/g,
								'<div class="embed-responsive embed-responsive-16by9"><iframe$1class="embed-responsive-item"$2</iframe></div>');
				data = data.replace(/<img(.*?)\s+src="/g, '<img$1 class="img-responsive" src="');
				data = data.replace(/webApps\/datastore\/openSource.ds/g, "webApps/public/datastore/openSource.ds");
			}
			return data;
		},
		setData : function(content) {
			var that = this;
			that.editor
					.ready(function() {
						if (content) {
							var patt = /<div(.*?)class=\"embed-responsive embed-responsive-16by9\"(.*?)(<iframe(.*?)\/iframe>)(.*?)\/div>/g;
							content = content.replace(patt, "$3");
							content = content.replace(/<img(.*?)class=\"img-responsive\"/g, '<img$1');
							content = content.replace(/webApps\/public\/datastore\/openSource.ds/g, "webApps/datastore/openSource.ds");
							that.editor.setContent(content);
						}
					});
		}
	};

	module.exports = Ueditor;
});