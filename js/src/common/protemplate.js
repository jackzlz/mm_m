define(function(require, exports, module) {

	var artDialog = require("../lib/dialog/dialog");
	var PageBar = require("./pagebar");
	var proTplLayout = require("../tpl/protpl_layout.html"), proTplLayoutCom = juicer(proTplLayout);
	var proTplList = require("../tpl/protpl_list.html"), proTplListCom = juicer(proTplList);
	
	
	var proTpl = function(options) {
		return new ProTemplate(options);
	};

	var defaultOpts = {
		pageSize : 3,
		isSelect : true
	};
	var ProTemplate = function(opts) {
		this.container = $(opts.container);
		this.options = $.extend({}, defaultOpts, opts);

		this.init();
	};

	ProTemplate.prototype = {
		constructor : ProTemplate,
		init : function() {
			this.initUI();
		},
		
		initUI : function(){
			var that = this;
			var opts = that.options;
			that.container.html(proTplLayoutCom.render());
			
			that.getTemplateList({
				pagesize : opts.pageSize,
				getdefault : 1
			}, function(data) {
				var templates = data.datalist, defaultTpl = data.defaultdata;
				that.renderTemplateList(templates, that.selectedTpl);
				that.initEvents();
				that.initPageBar(data.total);

				opts.onFinish && opts.onFinish(defaultTpl);
			});
		},
		initEvents : function() {
			var that = this, confirmDialog;
			that.container.find(".tplrow").on("click", ".tplitem .thumbnail", function(event) {
				event.stopPropagation();
				if (confirmDialog) {
					confirmDialog.close().remove();
				}
				var currDom = $(this), parentDom = currDom.parent();
				if (parentDom.hasClass("selected")) {
					return;
				}
				confirmDialog = artDialog({
					content : '确定选择该模板？当前编辑的正文内容将会清空！',
					okValue : '确定',
					ok : function() {
						parentDom.addClass("selected").siblings().removeClass("selected");
						var index = indexOf(that.templateArr, currDom.data("id"));
						var tplcontent = that.templateArr[index].content;

						that.selectedTpl = that.templateArr[index];

						that.options.onSelect && that.options.onSelect(tplcontent);
					},
					cancelValue : '取消',
					cancel : function() {
					},
					align : 'right',
					skin : "dialog-confirm"
				});
				confirmDialog.show(this);
			});

			$(document).on("click", function(event) {
				0 === $(event.target).closest(".dialog-confirm").length && confirmDialog
								&& confirmDialog.close().remove();
			});

			$(window).scroll(function(event) {
				var tplRowHeight = 455;
				var bottomOffsetHeight = 82;
				var rect = $(".tpl-c")[0].getBoundingClientRect();
				// 如果窗口高度不够则改变模板列表的高度
				if ($(window).height() < tplRowHeight + bottomOffsetHeight) {
					$(".tplrow").height($(window).height() - bottomOffsetHeight);
				} else {
					$(".tplrow").height(tplRowHeight);
				}
				
				if (rect.top < 0) {
					if (!$(".tpl").hasClass("tplfixed")) {
						$(".tpl").width($(".tpl")[0].offsetWidth);
						$(".tpl").addClass("tplfixed");
					}
				}else {
					$(".tpl").removeClass("tplfixed");
					$(".tpl").width("auto");
				}
			});
		},
		initPageBar : function(templateCount) {
			var that = this, opts = that.options;
			that.pagebar && that.pagebar.destroy();
			if (opts.pageSize >= templateCount) {
				$("#tpl-pagebar").empty();
				$("#tpl-pagebar").hide();
				return;
			}
			that.pagebar = new PageBar({
				isSimple : true,
				container : "#tpl-pagebar",
				totalCount : templateCount,
				pageSize : opts.pageSize,
				onCallback : function(index) {
					that.container.find("#tpl-pagebar").hide();

					that.getTemplateList({
						index : index,
						pagesize : opts.pageSize
					}, function(data) {
						var templates = data.datalist;
						that.renderTemplateList(templates, that.selectedTpl);
						that.container.find("#tpl-pagebar").show();
					});
					that.container.find(".tplrow").scrollTop(0);
				}
			});

		},
		getTemplateList : function(options, onCallback) {
			options = $.extend({
				index : 1,
				pagesize : 3
			}, options);
			$.getJSON("proTemplate_getTemplateList.action", options, function(data) {
				data.status !== 1 ? tips.error("产品模板列表加载失败！") : onCallback(data);
			});
		},
		renderTemplateList : function(templates, selectedTpl) {
			var that = this, opts = that.options;
			that.templateArr = templates || [];
			// 处理选中状态
			if (opts.isSelect || selectedTpl) {
				setSelect(that.templateArr, selectedTpl);
			}
			
			that.container.find(".tplrow").html(proTplListCom.render({
				data : that.templateArr
			}));
		}
	};
	
	
	function setSelect(templateArr, selectedTpl) {
		$.each(templateArr, function(i, n) {
			if (selectedTpl) {
				if (selectedTpl.id === n.id) {
					n.selected = 1;
				}
			} else {
				n.selected = n.isdefault;
			}
		});
	}

	function indexOf(templateArr, id) {
		for (var i = 0; i < templateArr.length; i++) {
			if (templateArr[i].id === id) {
				return i;
			}
		}
		return -1;
	}

	return proTpl;
});
