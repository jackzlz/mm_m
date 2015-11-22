/**
 * 资讯管理-编辑界面
 */
define(function(require, exports, module) {
	require("../lib/jquery.form");
	require("../lib/jquery.validate.min");
	require("../lib/messages_zh.min");
	var ImgDialog = require("../common/imgdialog");
	var Ueditor = require("../common/ueditor");
	var tips = require("../common/tips.js");
	var newsFormTpl = require("../tpl/news_form.html"), newsFormTplCom = juicer(newsFormTpl);
	var shareCoverTplCom = juicer(getShareCoverTpl());

	$.validator.setDefaults({
		// 对隐藏域也进行校验
		ignore : [],
		onsubmit : false,
		highlight : function(element) {
			$(element).closest('.form-group').addClass('has-error');
		},
		unhighlight : function(element) {
			$(element).closest('.form-group').removeClass('has-error');
		},
		errorElement : 'span',
		errorClass : 'help-block',
		errorPlacement : function(error, element) {
			if (element.parent('.input-group').length) {
				error.insertAfter(element.parent());
			} else {
				error.insertAfter(element);
			}
		}
	});

	var NewsForm = function() {
		this.init = function() {
			this.initUI();
			this.initEditor();
			this.initEvents();
			this.initValidates();
			this.setEditorData();
		};
		this.initUI = function() {
			$("#newsForm").html(newsFormTplCom.render(item));
		};
		this.initEvents = function() {
			var $this = this;
			
			$("#selectCover").click(function() {
				document.body.style.overflow = "hidden";
				new ImgDialog({
					maxSelect : 1,
					onOK : function(imgArr) {
						var img = imgArr[0];
						img.imgurl = img.imgurl.replace("thumb", "openSource");
						$("#coverDiv").html(shareCoverTplCom.render(img));
						document.body.style.overflow = "auto";
					},
					onCancel : function() {
						document.body.style.overflow = "auto";
					}
				});
			});
			
			$("#saveBtn").click(function() {
				var data = $this.getEditorData();
				$("input[name='content']").val(data);
				if (!$this.validator.form()) {
					tips.error($this.validator.errorList[0].message);
					$this.validator.focusInvalid();
					return;
				}
				var $btn = $("#saveBtn").button('loading');
				$("#newsForm").ajaxForm({
					type : 'POST',
					url : 'news_save.action',
					dataType : 'json',
					success : function(data, status) {
						if (data.status === 1) {
							tips.success("保存成功！");
							$("#newsForm").clearForm(true);
							$btn.button('reset');
							window.closeMe && window.closeMe();
						} else {
							tips.error("保存失败！", function() {
								$btn.button('reset');
							});
						}
					}
				});
				$("#newsForm").submit();
			});
			$("#previewBtn").click(function() {
				var data = $this.getEditorData();
				$("input[name='content']").val(data);
				if (!$this.validator.form()) {
					tips.error($this.validator.errorList[0].message);
					$this.validator.focusInvalid();
					return;
				}
				var win = window.open("news_preview.action");
				win.getPreviewData = function() {
					var datas = $("#newsForm").serializeArray();
					var news = {};
					for (var i = 0; i < datas.length; i++) {
						news[datas[i]["name"]] = datas[i]["value"];
					}
					return news;
				};
			});
		};
		this.initValidates = function() {
			var validator = $("#newsForm").validate({
				rules : {
					title : {
						required : true,
						maxlength : 64
					},
					cover : {
						required : true
					},
					content : {
						required : true,
						maxlength : 1e7,
						textlength : 20000
					}
				},
				messages : {
					title : {
						required : "标题不能为空",
						maxlength : $.validator.format("标题长度不能超过{0}个字")
					},
					cover : {
						required : "封面不能为空"
					},
					content : {
						required : "正文不能为空",
						maxlength : $.validator.format("正文总大小不得超过10M字节"),
						textlength : "正文不能为空且长度不能超过20000字"
					}
				}
			});
			$.validator.addMethod("textlength", function(value, element, params) {
				var length = $(value).text().length;
				return length <= params;
			}, "");
			this.validator = validator;
		};
		this.initEditor = function() {
			this.ueditor = new Ueditor({
				container : "js_editor",
				id : "news_editor"
			});
		};
		this.getEditorData = function() {
			return this.ueditor.getData();
		};
		this.setEditorData = function() {
			this.ueditor.setData(item.content);
		};
	};
	
	
	function getShareCoverTpl() {
		return '<img id="cover" alt="封面" class="img-thumbnail" src="!{imgurl}" style="width: 268px; height: 268px;" data-id="!{imgid}">'+
				'<input type="hidden" name="cover" value="!{imgid}" />';
	}
	
	new NewsForm().init();
});