/**
 * 产品模板管理-编辑界面
 */
define(function(require, exports, module) {
	require("../lib/jquery.form");
	require("../lib/jquery.validate.min");
	require("../lib/messages_zh.min");
	var tips = require("../common/tips");
	var Ueditor = require("../common/ueditor");
	var tpFormTpl = require("../tpl/template_form.html"), tpFormTplCom = juicer(tpFormTpl);

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

	var TemplateForm = function() {
		this.init();
	};
	TemplateForm.prototype = {
		constructor : TemplateForm,
		init : function() {
			this.initUI();
			this.initEditor();
			this.initEvents();
			this.initValidates();
			this.setEditorData();

			$("#vote").trigger("change");
		},
		initUI : function() {
			$("#templateForm").html(tpFormTplCom.render(item));
		},
		initEditor : function() {
			this.ueditor = new Ueditor({
				container : "js_editor",
				id : "appmsg_editor"
			});
		},
		initEvents : function() {
			var that = this;
			$("#saveBtn").click(function() {
				// 设置内容信息
				var data = that.getEditorData();
				$("input[name='content']").val(data);
				// 表单校验 OR $("#templateForm").valid()
				if (!that.validator.form()) {
					tips.error(that.validator.errorList[0].message);
					that.validator.focusInvalid();
					return;
				}
				var $btn = $("#saveBtn").button('loading');
				$("#templateForm").ajaxForm({
					type : 'POST',
					url : 'proTemplate_save.action',
					dataType : 'json',
					success : function(data, status) {
						if (data.status === 1) {
							tips.success("保存成功！", function() {
								$("#templateForm").clearForm(true);
								$btn.button('reset');
								window.closeMe && window.closeMe();
							});
						} else {
							tips.error("保存失败！", function() {
								$btn.button('reset');
							});
						}
					}
				});
				$("#templateForm").submit();
			});

			$("#previewBtn").click(function() {
				var data = that.getEditorData();
				$("input[name='content']").val(data);
				if (!that.validator.form()) {
					tips.error(that.validator.errorList[0].message);
					that.validator.focusInvalid();
					return;
				}
				var win = window.open("proTemplate_toPreview.action");
				win.getPreviewData = function() {
					var datas = $("#templateForm").serializeArray();
					var proTemplate = {};
					for (var i = 0; i < datas.length; i++) {
						proTemplate[datas[i]["name"]] = datas[i]["value"];
					}
					return proTemplate;
				};
			});
		},
		initValidates : function() {
			var validator = $("#templateForm").validate({
				rules : {
					title : {
						required : true,
						maxlength : 64
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
		},
		getEditorData : function() {
			return this.ueditor.getData();
		},
		setEditorData : function() {
			this.ueditor.setData(item.content);
		}
	};
	new TemplateForm();
});
