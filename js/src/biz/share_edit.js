/**
 * 产品管理-编辑界面
 */
define(function(require, exports, module) {
	require("../lib/jquery.form");
	require("../lib/jquery.validate.min");
	require("../lib/messages_zh.min");
	var tips = require("../common/tips");
	var ImgDialog = require("../common/imgdialog");
	var Ueditor = require("../common/ueditor");
	var shareCoverTplCom = juicer(getShareCoverTpl());
	var shareFormTpl = require("../tpl/share_form.html"), shareFormTplCom = juicer(shareFormTpl);
	var getVoteOptionTplCom = juicer(getVoteOptionTpl());
	var proTpl = require("../common/protemplate");


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

	var ShareForm = function() {
		this.init();
	};
	ShareForm.prototype = {
		constructor : ShareForm,
		init : function() {
			this.initUI();
			this.initProTpl();
			this.initEditor();
			this.initEvents();
			this.initValidates();
			
			(item.content && this.setEditorData(item.content));

			$("#vote").trigger("change");
		},
		initUI : function() {
			if (item.content) {
				// 处理投票选中
				if (item.votecode) {
					$.each(voteArr, function(i, n) {
						if (item.votecode === n.paramKey) {
							n.selected = 1;
						}
					});
				}
			}
			voteArr.unshift({
				paramKey : "",
				paramMemo : "请选择",
				paramValue : "[]"
			});
			item.votes = voteArr;
			item.proid = proid;
			item.author = item.id?item.author:cname;
			$("#shareForm").html(shareFormTplCom.render(item));
		},
		initEditor : function() {
			this.ueditor = new Ueditor({
				container : "js_editor",
				id : "appmsg_editor"
			});
		},
		initProTpl : function(){
			var that = this;
			proTpl({
				container : ".protpl",
				isSelect : !item.id,
				onFinish : function(defaultTpl) {
					if (defaultTpl) {
						that.setEditorData(defaultTpl.content);
					}
				},
				onSelect : function(tplcontent) {
					that.setEditorData(tplcontent);
				}
			});
		},
		initEvents : function() {
			var $this = this, confirmDialog;
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

			$("#vote").change(function() {
				var val = $(this).val(), voteItemStr = null, voteItems = [];
				$.each(voteArr, function(i, n) {
					if (n && val === n.paramKey) {
						voteItemStr = n.paramValue;
					}
				});
				if (voteItemStr) {
					voteItems = JSON.parse(voteItemStr);
					$("#voteoption").html(getVoteOptionTplCom.render({
						type : val,
						data : voteItems
					}));

					if (val === "bystar") {
						new Rating({
							container : ".rating"
						});
					}
				}
			});
			
			$("#saveBtn").click(function() {
				// 设置内容信息
				var data = $this.getEditorData();
				$("input[name='content']").val(data);
				if ($("#top").is(":checked")) {
					$("#top").val("1");
				} else {
					$("#top").val("0");
				}
				// 表单校验 OR $("#shareForm").valid()
				if (!$this.validator.form()) {
					tips.error($this.validator.errorList[0].message);
					$this.validator.focusInvalid();
					return;
				}
				var $btn = $("#saveBtn").button('loading');
				$("#shareForm").ajaxForm({
					type : 'POST',
					url : 'share_save.action',
					dataType : 'json',
					success : function(data, status) {
						if (data.status === 1) {
							tips.success("保存成功！", function() {
								$("#shareForm").clearForm(true);
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
				$("#shareForm").submit();
			});

			$("#previewBtn").click(function() {
				var data = $this.getEditorData();
				$("input[name='content']").val(data);
				if ($("#top").is(":checked")) {
					$("#top").val("1");
				} else {
					$("#top").val("0");
				}
				if (!$this.validator.form()) {
					tips.error($this.validator.errorList[0].message);
					$this.validator.focusInvalid();
					return;
				}
				var win = window.open("share_preview.action");
				win.getPreviewData = function() {
					var datas = $("#shareForm").serializeArray();
					var share = {};
					for (var i = 0; i < datas.length; i++) {
						share[datas[i]["name"]] = datas[i]["value"];
					}
					return share;
				};
			});
			
			window.onbeforeunload = function() {
				return "数据尚未保存！";
			};
		},
		initValidates : function() {
			var validator = $("#shareForm").validate({
				rules : {
					productid :{
						required:true
					},
					title : {
						required : true,
						maxlength : 64
					},
					author : {
						required : false,
						maxlength : 8
					},
					cover : {
						required : true,
					},
					abstracts : {
						required : true,
						maxlength : 120
					},
					content : {
						required : true,
						maxlength : 1e7,
						textlength : 20000
					}
				},
				messages : {
					productid:{
						required:"没有关联产品，详情不允许单独添加！"
					},
					title : {
						required : "标题不能为空",
						maxlength : $.validator.format("标题长度不能超过{0}个字")
					},
					author : {
						maxlength : $.validator.format("作者不能超过{0}个字")
					},
					cover : {
						required : "必须插入一张图片"
					},
					abstracts : {
						required : "摘要不能为空",
						maxlength : $.validator.format("摘要长度不能超过{0}字")
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
		setEditorData : function(datas) {
			this.ueditor.setData(datas);
		}
	};
	var defaultRatingOpts = {

	};
	var Rating = function(options) {
		this.options = $.extend(true, {}, defaultRatingOpts, options);
		this.container = $(options.container);
		this.$input = this.container.find("input");
		this.init();
	};

	Rating.prototype = {
		constructor : Rating,
		init : function() {
			var that = this, ratings = that.container.find("a");
			ratings.each(function(i) {
				$(this).mouseenter(function() {
					that.highlight($(this).data("code"));
				}).mouseleave(function() {
					that.highlight(that.$input.val());
				}).click(function() {
					that.setValue($(this).data("code"));
				});
			});
		},
		setValue : function(value) {
			this.highlight(value);
			this.updateInput(value);
		},
		highlight : function(value) {
			var selected = this.container.find('[data-code' + (value ? ('=' + value) : '') + ']');
			if (value) {
				selected.prevAll('a').andSelf().addClass("selected");
				selected.nextAll('a').removeClass("selected");
				$("#rateword").text(selected.data("name"));
			} else {
				selected.removeClass("selected");
				$("#rateword").text("");
			}
		},
		updateInput : function(value) {
			var $input = this.$input;
			if ($input.val() != value) {
				$input.val(value).change();
			}
		}
	};

	function getShareCoverTpl() {
		return '<img id="cover" alt="封面" class="img-thumbnail" src="!{imgurl}" style="width: 268px; height: 268px;" data-id="!{imgid}">'+
				'<input type="hidden" name="cover" value="!{imgid}" />';
	}

	function getVoteOptionTpl() {
		return '{@if type == "bystar"}'
				+ '<div class="rating">'
				+ '<input type="hidden"/>'
				+ '{@each data as item,index}'
				+ '	<a href="javascript:;" title="" data-code="!{item.code}" data-name="!{item.name}"></a>'
				+ '{@/each}'
				+ '<span id="rateword"></span>'
				+ '</div>'
				+ '{@else}'
				+ '{@each data as item,index}'
				+ '	<label class="radio-inline">'
				+ '	<input type="radio" name="voteRadioOptions" id="voteRadio!{item.code}" value="!{item.code}" disabled> !{item.name}'
				+ '	</label>' + '{@/each}' + '{@/if}';
	}
	new ShareForm();
});
