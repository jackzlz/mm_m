/**
 * 图片选择对话框
 */
define(function(require, exports, module) {
	require("../css/ui-dialog.css");
	require("../css/imgdialog.css");
	require("../css/webuploader.css");
	var imglayoutTpl = require("../tpl/dialog/img_layout.html"), imglayoutTplCom = juicer(imglayoutTpl);
	var imglistTpl = require("../tpl/dialog/img_list.html"), imglistTplCom = juicer(imglistTpl);
	var WebUploader = require("../lib/webuploader.min");
	var artDialog = require("../lib/dialog/dialog");
	var PageBar = require("./pagebar");
	var tips = require("./tips");

	var defaultOpts = {
		pageSize : 12,
		maxSelect : 1
	};
	var ImageDialog = function(options) {
		this.imgArr = [];
		this.options = options = $.extend(true, {}, defaultOpts, options);
		this.init();
	};

	ImageDialog.prototype = {
		constructor : ImageDialog,
		init : function() {
			var $this = this;
			var opts = $this.options;
			$this.dialog = artDialog({
				id : "selectImg",
				title : "选择图片",
				fixed : true,
				content : imglayoutTplCom.render(),
				padding : 0,
				okValue : "确定",
				ok : function() {
					if (!$this.imgArr || $this.imgArr.length === 0) {
						return false;
					}
					opts.onOK && opts.onOK($this.imgArr);
				},
				cancelValue : '取消',
				cancel : function() {
					opts.onCancel && opts.onCancel();
				}
			}).showModal();

			$($this.dialog.node).find(".js_loading").show();
			$this.getImageList({
				count : opts.pageSize
			}, function(data) {
				var images = data.images;

				$this.renderImageList(images, $this.imgArr);
				$this.initEvents();
				$this.initPageBar(data.total);

				$($this.dialog.node).find(".js_loading").hide();
			});

			$this.initUpload();
		},
		initEvents : function() {
			var $this = this, options = $this.options, dialog = $($this.dialog.node), delimgdialog = null;
			dialog.on("click", ".thumbnail", function(event) {
				var image = $(this);
				var colDom = image.parent();
				var imgDom = image.find("img");
				var id = imgDom.data("id");
				var name = imgDom.data("name");
				var url = imgDom.attr("src");
				if (colDom.hasClass("selected")) {
					colDom.removeClass("selected");
					var i = indexOf($this.imgArr, id);
					if (i >= 0) {
						$this.imgArr.splice(i, 1);
					}
				} else {
					if (options.maxSelect === 1) {
						colDom.addClass("selected");
						colDom.siblings(".selected").removeClass("selected");
						$this.imgArr = [ {
							imgid : id,
							imgname : name,
							imgurl : url
						} ];
					} else {
						if (options.maxSelect > $this.imgArr.length) {
							colDom.addClass("selected");
							$this.imgArr.push({
								imgid : id,
								imgname : name,
								imgurl : url
							});
						} else {
							tips.error("最多可选" + options.maxSelect + "张");
						}
					}
				}
			});
			dialog.on("click", ".delete", function(event) {
				event.stopPropagation();
				if (delimgdialog) {
					delimgdialog.close().remove();
				}
				var image = $(this);
				delimgdialog = artDialog({
					content : '确定删除此图片？',
					okValue : '确定',
					ok : function() {
						var filename = image.data("filename"), id = image.data("id");
						$.post("image_delete.action", {
							filename : filename
						}, function(data) {
							if (!data || data.status === 0) {
								tips.error("删除失败");
								return;
							}
							var i = indexOf($this.imgArr, id);
							if (i >= 0) {
								$this.imgArr.splice(i, 1);
							}
							
							dialog.find(".js_loading").show();
							$this.getImageList({
								count : options.pageSize
							}, function(data) {
								var images = data.images;

								$this.renderImageList(images, $this.imgArr);
								$this.initPageBar(data.total);

								dialog.find(".js_loading").hide();
								tips.success("删除成功");
							});
						}, "json");
					},
					cancelValue : '取消',
					cancel : function() {
					},
					align : 'bottom',
					skin : "dialog-delete"
				});
				delimgdialog.show(this);
			});

			$(document).on("click", function(event) {
				0 === $(event.target).closest(".dialog-delete").length && delimgdialog && delimgdialog.close().remove();
			});
		},
		initPageBar : function(imgcount) {
			var that = this;
			var imgdg = $(that.dialog.node);
			var opts = that.options;
			that.pagebar && that.pagebar.destroy();
			if (opts.pageSize >= imgcount) {
				$("#img-pagebar").empty();
				$("#img-pagebar").hide();
			} else {
				that.pagebar = new PageBar({
					container : "#img-pagebar",
					totalCount : imgcount,
					pageSize : opts.pageSize,
					onCallback : function(index) {
						imgdg.find("#img-pagebar").hide();
						imgdg.find(".js_loading").show();
						that.getImageList({
							begin : (index - 1) * opts.pageSize,
							count : opts.pageSize
						}, function(data) {
							var images = data.images;
							that.renderImageList(images, that.imgArr);
							imgdg.find("#img-pagebar").show();
							imgdg.find(".js_loading").hide();
						});
						imgdg.find(".imgdg-main").scrollTop(0);
					}
				});
			}
		},
		initUpload : function() {
			var $this = this, opts = $this.options;

			var uploader = WebUploader.create({
				// 自动上传。
				auto : true,
				// swf文件路径
				swf : '/js/Uploader.swf',
				// 文件接收服务端。
				server : '/liontech/webApps/datastore/upload.ds',
				// 选择文件的按钮。可选。
				// 内部根据当前运行是创建，可能是input元素，也可能是flash.
				pick : '#filePicker',
				// 只允许选择文件，可选。
				accept : {
					title : 'Images',
					extensions : 'gif,jpg,jpeg,bmp,png',
					mimeTypes : 'image/*'
				},
				compress : false
			});
			// 上传成功
			uploader.on('uploadSuccess', function(file, response) {
				$.post("image_add.action", {
					uuid : response.uuid,
					filename : file.name
				}, function(data) {
					if (!data || data.status === 0) {
						tips.error("上传失败！");
						return;
					}
					$($this.dialog.node).find(".js_loading").show();
					$this.getImageList({
						count : opts.pageSize
					}, function(data) {
						var images = data.images;
						
						$this.imgArr = [getImageJsonData(images[0])];
						
						$this.renderImageList(images, $this.imgArr);
						$this.initPageBar(data.total);
						$($this.dialog.node).find(".js_loading").hide();
					});
					tips.success("上传成功！");
				}, "json");
			});

			// 上传失败
			uploader.on('uploadError', function(file) {
				tips.error("上传失败！");
			});
			// 上传完成
			uploader.on('uploadComplete', function(file) {
				$(".progress-box").fadeOut();
			});
			// 图片加入上传队列
			uploader.on('fileQueued', function(e) {
				$(".progress .progress-bar").css('width', '0%');
				$(".progress-box").fadeIn();
			});
			// 上传进度条
			uploader.on('uploadProgress', function(file, percentage) {
				$(".progress .progress-bar").css('width', percentage * 100 + '%');
			});
			uploader.on("uploadFinished", function() {
				this.reset();
			});
		},
		getImageList : function(options, onCallback) {
			options = $.extend({
				begin : 0,
				count : 12
			}, options);
			$.getJSON("image_list.action", options, function(data) {
				data.status !== 1 ? tips.error("图片列表加载失败！") : onCallback(data);
			});
		},
		renderImageList : function(images, imgArr) {
			var imgs = [];
			images = images ? images : [];
			$.each(images, function(i, n) {
				var image = getImageJsonData(n);
				if (indexOf(imgArr, image.imgid) != -1) {
					image.selected = 1;
				}
				imgs.push(image);
			});
			$("#img-content").html(imglistTplCom.render({
				data : imgs
			}));
		}
	};

	function indexOf(imgArr, imgid) {
		for (var i = 0; i < imgArr.length; i++)
			if (imgArr[i].imgid === imgid) {
				return i;
			}
		return -1;
	}
	
	function getImageJsonData(image) {
		var id = image.substring(0, image.indexOf('_')), name, url;
		name = image.substring(image.indexOf("_") + 1);
		url = "/liontech/webApps/datastore/thumb.ds?uuid=" + id + "&accesspointtype=standardweb";
		return {
			imgid : id,
			imgname : name,
			imgurl : url
		};
	}

	module.exports = ImageDialog;
});
