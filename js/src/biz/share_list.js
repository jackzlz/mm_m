/**
 * 
 */
define(function(require) {
	var page = LT.SimplePage.create(), menus, param, topmenu;
	topmenu = {
		name : "置顶",
		icon : LT.getBasePath() + "/webApps/manager/img/top.png",
		action : function() {
			top();
		}
	};
	menus = [ {
		name : "新增",
		icon : LT.getBasePath() + "/common/images/tool/add.png",
		action : function() {
			openAddPage();
		}
	}, {
		name : "查看",
		icon : LT.getBasePath() + "/webApps/manager/img/preview.png",
		action : function() {
			openShowPage();
		}
	}, {
		name : "编辑",
		icon : LT.getBasePath() + "/common/images/tool/edit.png",
		action : function() {
			openEditPage();
		}
	}, topmenu ];
	param = {
		url : "share",
		menu : menus,
		finish : function() {
			page.maxAdd = true;
			page.maxEdit = true;
		}
	};
	param.tableParam = {
		onRightClickRow : rightClickRow
	};
	page.build(param);

	/**
	 * 打开新增界面
	 */
	function openAddPage() {
		var pro = LT.startProgress({
			message : "正在初始化界面"
		});
		var addPage = LT.showPage({
			url : "share_toAdd.action",
			title : "新增产品",
			width : '100%',
			height : '100%'
		}, function() {
			addPage.find("iframe")[0].contentWindow.closeMe = function() {
				addPage.close();
				page.refresh();
			};
			pro.stopProgress(true);
		});
	}
	/**
	 * 打开编辑界面
	 */
	function openEditPage() {
		var id = getSelectedRowItemData("id");
		if (id === null) {
			LT.infomation({
				content : "没有选中记录！"
			});
			return;
		}
		var pro = LT.startProgress({
			message : "正在初始化界面"
		});
		var editPage = LT.showPage({
			url : "share_toEdit.action?id=" + id,
			title : "编辑产品",
			width : '100%',
			height : '100%'
		}, function() {
			editPage.find("iframe")[0].contentWindow.closeMe = function() {
				editPage.close();
				page.refresh();
			};
			pro.stopProgress(true);
		});
	}

	/**
	 * 打开显示界面
	 */
	function openShowPage() {
		var id = getSelectedRowItemData("id");
		if (id === null) {
			LT.infomation({
				content : "没有选中记录！"
			});
			return;
		}
		window.open(LT.getBasePath() + "/webApps/public/share/show.html?id=" + id);
	}

	function top() {
		var id = getSelectedRowItemData("id");
		if (id === null) {
			LT.infomation({
				content : "没有选中记录！"
			});
			return;
		}
		LT.asynPost("share_top.action", {
			id : id
		}, function(data) {
			page.refresh();
			LT.infomation({
				content : "操作成功！"
			});
		});
	}
	function rightClickRow(rowid, iRow, iCol, e) {
		var selectedData = getSelectedRowData(), id = selectedData.id, top;
		if (id === null) {
			LT.infomation({
				content : "没有选中记录！"
			});
			return;
		}
		top = selectedData.top;
		if (top && top !== "0") {
			topmenu.name = "取消置顶";
		} else {
			topmenu.name = "置顶";
		}
	}

	function getSelectedRowItemData(item) {
		return getSelectedRowData()[item];
	}
	function getSelectedRowData() {
		return page.dataTable.getSelectedRowData();
	}
});