define(function(require, exports, module) {
	require("../css/ui-dialog.css");
	var artDialog = require("../lib/dialog/dialog"), ImgDialog = require("./imgdialog"), tips = require("./tips");
	var videoTplCom = juicer(getVideoTpl());

	function moreBtnOnClick(editor) {
		var e = editor.ui.getDom("toolbarbox");
		if (UE.dom.domUtils.hasClass(e, "show-edui-more")) {
			UE.dom.domUtils.removeClasses(e, "show-edui-more");
		} else {
			UE.dom.domUtils.addClass(e, "show-edui-more");
		}
		// e = document.getElementById("js_toolbar_1");
		// UE.dom.domUtils.setStyle(e, "zoom", 0);
		// UE.dom.domUtils.setStyle(e, "zoom", 1);
	}

	function insertVideo2BtnOnClick(editor) {
		var d = artDialog({
			title : '请输入视频地址',
			width : 500,
			content : '<input type="text" class="form-control" id="videourl" autofocus placeholder="请输入视频地址" />',
			okValue : '确定',
			ok : function() {
				var url = $("#videourl").val();
				if (!url) {
					tips.error("请输入地址");
					return false;
				}
				// 匹配iframe标签必须有src属性
				var patt = /<iframe.*src="{1}\w+:\/\/[^/:]+(:\d*)?[^#]*.*<\/iframe>/;
				if (!patt.test(url)) {
					tips.error("请复制视频网站的通用代码（包含iframe）");
					return false;
				}
				// 匹配iframe中的src
				var urlpatt = /\w+:\/\/[^/:]+(:\d*)?[^#"]*/;
				var srcs = url.match(urlpatt);
				if (!srcs || srcs.length === 0) {
					tips.error("请输入正确的视频地址");
					return false;
				}
				editor.execCommand("inserthtml", videoTplCom.render({
					content : srcs[0]
				}).trim());
			},
			cancelValue : '取消',
			cancel : function() {
			}
		});
		d.showModal();
	}

	function getVideoTpl() {
		return '<iframe class="embed-responsive-item" src="!{content}"></iframe>';
	}

	function insertImage2BtnOnClick(editor) {
		document.body.style.overflow = "hidden";
		new ImgDialog({
			maxSelect : 100,
			onOK : function(imgArr) {
				editor.execCommand("insertimage", $.map(imgArr, function(n) {
					return n.src = n._src = n.imgurl.replace("thumb","openSource"), n;
				}));
				document.body.style.overflow = "auto";
			},
			onCancel : function() {
				document.body.style.overflow = "auto";
			}
		});
	}

	// 更多
	UE.registerUI('more', function(editor, uiName) {
		// 注册按钮执行时的command命令，使用命令默认就会带有回退操作
		editor.registerCommand(uiName, {
			execCommand : function() {
				moreBtnOnClick(editor);
			}
		});
		var btn = new UE.ui.Button({
			name : uiName,
			title : "更多",
			cssRules : '',
			onclick : function() {
				editor.execCommand(uiName);
			}
		});
		return btn;
	});

	// 插入视频
	UE.registerUI('insertvideo2', function(editor, uiName) {
		editor.registerCommand(uiName, {
			execCommand : function() {
				insertVideo2BtnOnClick(editor);
			}
		});
		var btn = new UE.ui.Button({
			name : uiName,
			title : "视频",
			cssRules : '',
			onclick : function() {
				editor.execCommand(uiName);
			}
		});
		return btn;
	});
	// 插入图片
	UE.registerUI('insertimage2', function(editor, uiName) {
		editor.registerCommand(uiName, {
			execCommand : function() {
				insertImage2BtnOnClick(editor);
			}
		});
		var btn = new UE.ui.Button({
			name : uiName,
			title : "图片",
			cssRules : '',
			onclick : function() {
				editor.execCommand(uiName);
			}
		});
		return btn;
	});
});
