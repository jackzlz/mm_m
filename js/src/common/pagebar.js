/**
 * 分页组件
 */
define(function(require, exports, module) {

	var pageBarTpl = require("../tpl/pagebar.html"), pageBarTplCom = juicer(pageBarTpl);

	var defaultOpts = {
		isSimple:false
	};

	var PageBar = function(options) {
		if (!options.totalCount) {
			return;
		}
		this.container = $(options.container);
		this.options = $.extend({}, defaultOpts, options);

		this.init();
	};

	PageBar.prototype = {
		constructor : PageBar,
		init : function() {
			this.initUI();
			this.initEvents();
		},
		initUI : function() {
			var opts = this.options;
			this.pageCount = parseInt((opts.totalCount + opts.pageSize - 1) / opts.pageSize);
			this.container.html(pageBarTplCom.render({
				isSimple : opts.isSimple,
				currPage : 1,
				pagecount : this.pageCount
			}));
			this.pageCount == 1 ? this.container.hide() : this.container.show();
			this.currPage = 1;
			this.pages = this.container.find(".page-nav");
		},
		initEvents : function() {
			var that = this;
			var opts = that.options;
			that.container.on("click", "li a", function() {
				var index = $(this).data("index"), page;
				if (index == "previous") {
					index = that.currPage - 1;
				} else if (index == "next") {
					index = that.currPage + 1;
				}
				if (index < 1 || index > that.pageCount) {
					return;
				}
				if (index === that.currPage) {
					return;
				}
				for (var i = 0; i < that.pages.length; i++) {
					page = $(that.pages[i]);
					page.removeClass("active");
					if (page.find("a:first-child").data("index") === index) {
						page.addClass("active");
					}
				}
				that.currPage = index;
				opts.onCallback && opts.onCallback(index);
			});
		},
		destroy : function() {
			this.container.off("click", "li a");
		}
	};

	module.exports = PageBar;
});