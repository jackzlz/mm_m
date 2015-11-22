/**
 * 资讯列表对话框
 */
define(function(require, exports, module) {
	require("../css/ui-dialog.css");
	require("../css/newsdialog.css");
	var newslayoutTpl = require("../tpl/dialog/news_layout.html"), newslayoutTplCom = juicer(newslayoutTpl);
	var newslistTpl = require("../tpl/dialog/news_list.html"), newslistTplCom = juicer(newslistTpl);
	var dialog = require("../lib/dialog/dialog");
	var PageBar = require("./pagebar");
	var tips = require("./tips");

	var defaultOpts = {
		pageSize : 12,
		maxSelect : 1
	};

	var NewsDialog = function(opts) {
		this.newsArr = [];
		this.options = opts = $.extend(true, {}, defaultOpts, opts);
		this.init();
	};
	NewsDialog.prototype = {
		constructor : NewsDialog,
		init : function() {
			var $this = this;
			var opts = $this.options;
			$this.dialog = dialog({
				id : 'selectNews',
				title : '选择资讯',
				content : newslayoutTplCom.render(),
				padding : 0,
				width : 960,
				fixed : true,
				okValue : '确定',
				ok : function() {
					if (!$this.newsArr || $this.newsArr.length === 0) {
						return false;
					}
					opts.onOK && opts.onOK($this.newsArr);
				},
				cancelValue : '取消',
				cancel : function() {
				}
			}).showModal();

			$($this.dialog.node).find(".js_loading").show();
			$this.getNewsList({
				pagesize : opts.pageSize,
				groupId : opts.groupId
			}, function(data) {
				var newsData = data.datalist;

				$this.renderNewsList(newsData, $this.newsArr);
				$this.initEvents();
				$this.initPageBar(data.total);

				$($this.dialog.node).find(".js_loading").hide();
			});
		},
		initEvents : function() {
			var $this = this;
			var options = $this.options;
			var dialog = $($this.dialog.node);
			$("#newsSearchBtn").click(function() {
				var keyword = $("#newsSearchInput").val();
				$($this.dialog.node).find(".js_loading").show();
				$this.getNewsList({
					pagesize : options.pageSize,
					keyword : keyword,
					groupId : options.groupId
				}, function(data) {
					var newsData = data.datalist;

					$this.renderNewsList(newsData, $this.newsArr);
					$this.initPageBar(data.total);

					$($this.dialog.node).find(".js_loading").hide();
				});
			});
			dialog.on("click", ".newscreate", function() {
				if (!top.LT) {
					window.open("/liontech/webApps/manager/news_toAdd.action");
					return;
				}
				var page = top.LT.showPage({
					url : "/liontech/webApps/manager/news_toAdd.action",
					title : "新增资讯",
					width : 900,
					height : 600,
					draggable : true,
					resizable : true,
					minable : true,
					maxable : true
				}, function() {
					page.find("iframe")[0].contentWindow.closeMe = function() {
						page.close();
						$("#newsSearchBtn").trigger("click");
					};
				});
			});
			dialog.on("click", ".news-item", function(event) {
				$(this).find(":checkbox").click();
			});
			dialog.on("click", ".item-check label", function(event) {
				event.stopPropagation();
			});

			dialog.on("change", ".item-check :checkbox", function() {
				var checkbox = $(this), ischecked = checkbox.is(":checked"), itemrow = checkbox.closest(".news-item");
				var id = $(this).data("id"), cover, title, publisher, publishtime;
				cover = $(this).data("cover");
				title = itemrow.find(".item-title").text();
				publisher = itemrow.find(".item-publisher").text();
				publishtime = itemrow.find(".item-publishtimestr").text();
				if (ischecked) {
					if (options.maxSelect === 1) {
						var allCheckBox = dialog.find(".news-item .item-check :checkbox");
						allCheckBox.each(function(i) {
							if ($(this).val() === checkbox.val()) {
								return;
							}
							if ($(this).is(":checked")) {
								$(this).attr("checked", false);
							}
						});
						$this.newsArr = [ {
							"id" : id,
							"title" : title,
							"publisher" : publisher,
							"publishtime" : publishtime,
							"cover" :cover
						} ];
					} else {
						if (options.maxSelect > $this.newsArr.length) {
							$this.newsArr.push({
								"id" : id,
								"title" : title,
								"publisher" : publisher,
								"publishtime" : publishtime,
								"cover" :cover
							});
						} else {
							checkbox.attr("checked", false);
							tips.error("最多可选" + options.maxSelect + "条");
						}
					}
				} else {
					var i = indexOf($this.newsArr, id);
					if (i >= 0) {
						$this.newsArr.splice(i, 1);
					}
				}
			});
		},
		initPageBar : function(newscount) {
			var that = this;
			var newsdg = $(that.dialog.node);
			var opts = that.options;
			that.pagebar && that.pagebar.destroy();
			if (opts.pageSize >= newscount) {
				$("#news-pagebar").empty();
				$("#news-pagebar").hide();
				return;
			}
			that.pagebar = new PageBar({
				container : "#news-pagebar",
				totalCount : newscount,
				pageSize : opts.pageSize,
				onCallback : function(index) {

					newsdg.find("#news-pagebar").hide();
					newsdg.find(".js_loading").show();
					var keyword = $("#newsSearchInput").val();
					that.getNewsList({
						keyword : keyword,
						index : index,
						pagesize : opts.pageSize,
						groupId : opts.groupId
					}, function(data) {
						var newsData = data.datalist;
						that.renderNewsList(newsData, that.newsArr);

						newsdg.find(".js_loading").hide();
						newsdg.find("#news-pagebar").show();
					});

					newsdg.find(".newsdg-main").scrollTop(0);
				}
			});
		},
		getNewsList : function(options, onCallback) {
			options = $.extend({
				index : 1,
				pagesize : 12
			}, options);

			$.getJSON("news_getNewsList.action", options, function(data) {
				data.status !== 1 ? tips.error("资讯列表加载失败！") : onCallback(data);
			});
		},
		renderNewsList : function(datas, newsArr) {
			var coverImageUrlCom = juicer(getCoverImageUrlTpl());
			datas = datas ? datas : [];
			$.each(datas, function(i, n) {
				if (indexOf(newsArr, n.id) !== -1) {
					n.selected = 1;
				}
				n.imgurl = coverImageUrlCom.render({uuid:n.cover});
			});
			$("#news-content").html(newslistTplCom.render({
				data : datas
			}));
		}
	};
	
	function getCoverImageUrlTpl() {
		return "/liontech/webApps/datastore/thumb.ds?uuid=!{uuid}&accesspointtype=standardweb";
	}

	function indexOf(newsArr, newsId) {
		for (var i = 0; i < newsArr.length; i++)
			if (newsArr[i].id === newsId) {
				return i;
			}
		return -1;
	}
	module.exports = NewsDialog;
});
