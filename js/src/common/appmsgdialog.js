/**
 * 图文消息-产品列表
 */
define(function(require, exports, module) {
	require("../css/ui-dialog.css");
	require("../css/appmsgdialog.css");
	var appmsglayoutTpl = require("../tpl/dialog/appmsg_layout.html"), appmsglayoutTplCom = juicer(appmsglayoutTpl);
	var appmsglistTpl = require("../tpl/dialog/appmsg_list.html"), appmsglistTplCom = juicer(appmsglistTpl);
	var dialog = require("../lib/dialog/dialog");
	var PageBar = require("./pagebar");
	var tips = require("./tips");

	var defaultOpts = {
		pageSize : 12,
		maxSelect : 1
	};

	var AppmsgDialog = function(opts) {
		this.appmsgArr = [];
		this.options = opts = $.extend(true, {}, defaultOpts, opts);
		this.init();
	};

	AppmsgDialog.prototype = {
		constructor : AppmsgDialog,
		init : function() {
			var that = this;
			var opts = that.options;
			that.dialog = dialog({
				// !!!fix.css通过id控制样式，不要更改
				id : 'selectAppmsg',
				title : '选择产品',
				content : appmsglayoutTplCom.render(),
				padding : 0,
				// !!!通过选择器控制样式，不要更改
				skin : "appmsgdg"
			}).showModal();

			$(that.dialog.node).find(".js_loading").show();
			that.getAppmsgList({
				pagesize : opts.pageSize,
				groupId : opts.groupId
			}, function(data) {
				var appmsgs = data.datalist;
				that.renderAppmsgList(appmsgs, that.appmsgArr);
				that.initEvents();
				that.initPageBar(data.total);
				$(that.dialog.node).find(".js_loading").hide();
			});
		},
		initEvents : function() {
			var that = this, opts = that.options, dialog = $(that.dialog.node);
			$("#appmsgSearchBtn").click(function() {
				var keyword = $("#appmsgSearchInput").val();
				$(that.dialog.node).find(".js_loading").show();
				that.getAppmsgList({
					"keyword" : keyword,
					pagesize : opts.pageSize,
					groupId : opts.groupId
				}, function(data) {
					var appmsgs = data.datalist;

					that.renderAppmsgList(appmsgs, that.appmsgArr);
					that.initPageBar(data.total);

					$(that.dialog.node).find(".js_loading").hide();
				});
			});
			dialog.find(".appmsgcreate").click(function() {
				var page = top.LT.showPage({
					url : "/liontech/webApps/manager/share_toAdd.action",
					title : "新增产品",
					width : 900,
					height : 600,
					draggable : true,
					resizable : true,
					minable : true,
					maxable : true
				}, function() {
					page.find("iframe")[0].contentWindow.closeMe = function() {
						page.close();
						$("#appmsgSearchBtn").trigger("click");
					};
				});
			});
			dialog.on("click", ".appmsg-item .thumbnail", function() {
				var appmsgitem = $(this).parent(), appmsgid = appmsgitem.data("id");
				var title = $(this).find(".appmsg-title").text().trim();
				var publishtime = $(this).find(".appmsg-date").text().trim();
				var thumb = $(this).find(".appmsg-thumb-wrp img");
				var thumbid = thumb.data("id"), thumburl = thumb.attr("src");
				var desc = $(this).find(".appmsg-desc").text().trim();

				if (appmsgitem.hasClass("selected")) {
					appmsgitem.removeClass("selected");
					var i = indexOf(that.appmsgArr, appmsgid);
					if (i >= 0) {
						that.appmsgArr.splice(i, 1);
					}
				} else {
					if (opts.maxSelect === 1) {
						appmsgitem.addClass("selected");
						appmsgitem.siblings(".selected").removeClass("selected");
						that.appmsgArr = [ {
							id : appmsgid,
							title : title,
							publishtime : publishtime,
							thumburl : thumburl,
							thumbid : thumbid,
							desc : desc
						} ];
					} else {
						if (opts.maxSelect > that.appmsgArr.length) {
							appmsgitem.addClass("selected");
							that.appmsgArr.push({
								id : appmsgid,
								title : title,
								publishtime : publishtime,
								thumburl : thumburl,
								thumbid : thumbid,
								desc : desc
							});
						} else {
							tips.error("最多可选" + opts.maxSelect + "项");
						}
					}
				}
			});
			dialog.on("click", "#okButton", function() {
				if (that.appmsgArr.length === 0) {
					return false;
				}
				opts.onOK && opts.onOK(that.appmsgArr);
				that.dialog.close().remove();
			});
			dialog.on("click", "#cancelButton", function() {
				opts.onCancel && opts.onCancel();
				that.dialog.close().remove();
			});
		},
		initPageBar : function(appmsgcount) {
			var that = this, opts = that.options, appsgdg = $(that.dialog.node);
			that.pagebar && that.pagebar.destroy();
			if (opts.pageSize >= appmsgcount) {
				$("#appmsg-pagebar").empty();
				$("#appmsg-pagebar").hide();
				return;
			}
			that.pagebar = new PageBar({
				container : "#appmsg-pagebar",
				totalCount : appmsgcount,
				pageSize : opts.pageSize,
				onCallback : function(index) {
					appsgdg.find("#appmsg-pagebar").hide();
					appsgdg.find(".js_loading").show();
					var keyword = $("#appmsgSearchInput").val();

					that.getAppmsgList({
						keyword : keyword,
						index : index,
						pagesize : opts.pageSize,
						groupId : opts.groupId
					}, function(data) {
						var appmsgs = data.datalist;
						that.renderAppmsgList(appmsgs, that.appmsgArr);
						appsgdg.find(".js_loading").hide();
						appsgdg.find("#appmsg-pagebar").show();
					});
					appsgdg.find(".newsdg-main").scrollTop(0);
				}
			});
		},
		getAppmsgList : function(options, onCallback) {
			options = $.extend({
				index : 1,
				pagesize : 12
			}, options);
			$.getJSON("share_getShareList.action", options, function(data) {
				data.status !== 1 ? tips.error("图文消息列表加载失败！") : onCallback(data);
			});
		},
		renderAppmsgList : function(appmsgs, appmsgArr) {
			var that = this, opts = that.options;
			appmsgs = appmsgs ? appmsgs : [];
			$.each(appmsgs, function(i, n) {
				n.thumb = "/liontech/webApps/datastore/openSource.ds?uuid=" + n.cover + "&accesspointtype=standardweb";
				if (indexOf(appmsgArr, n.id) !== -1) {
					n.selected = 1;
				}
			});
			$("#appmsg-content").html(appmsglistTplCom.render({
				data : appmsgs
			}));
		}
	};

	function indexOf(appmsgArr, appmsgId) {
		for (var i = 0; i < appmsgArr.length; i++) {
			if (appmsgArr[i].id === appmsgId) {
				return i;
			}
		}
		return -1;
	}
	module.exports = AppmsgDialog;
});
