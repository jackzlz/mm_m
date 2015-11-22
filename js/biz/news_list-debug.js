define("biz/news_list-debug", [], function(require) {
    var page = LT.SimplePage.create(), menus, param;
    menus = [ {
        name: "新增",
        icon: LT.getBasePath() + "/common/images/tool/add.png",
        action: function() {
            openAddPage();
        }
    }, {
        name: "查看",
        icon: LT.getBasePath() + "/webApps/manager/img/preview.png",
        action: function() {
            openShowPage();
        }
    }, {
        name: "编辑",
        icon: LT.getBasePath() + "/common/images/tool/edit.png",
        action: function() {
            openEditPage();
        }
    } ];
    // 只有管理组才能下发资讯
    if (isRootOrgGroup) {
        menus.push({
            name: "下发资讯",
            icon: LT.getBasePath() + "/webApps/manager/img/send.png",
            action: function() {
                issuedNews();
            }
        });
    }
    param = {
        url: "news",
        menu: menus,
        finish: function() {
            page.maxAdd = true;
            page.maxEdit = true;
        }
    };
    page.build(param);
    /**
	 * 打开新增界面
	 */
    function openAddPage() {
        var pro = LT.startProgress({
            message: "正在初始化界面"
        });
        var addPage = LT.showPage({
            url: "news_toAdd.action",
            title: "新增资讯",
            width: "100%",
            height: "100%"
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
        var selectedData = page.dataTable.getSelectedRowData();
        var id = selectedData.id;
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        var pro = LT.startProgress({
            message: "正在初始化界面"
        });
        var editPage = LT.showPage({
            url: "news_toEdit.action?id=" + id,
            title: "编辑资讯",
            width: "100%",
            height: "100%"
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
        var selectedData = page.dataTable.getSelectedRowData();
        var id = selectedData.id;
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        window.open("news_preview.action?id=" + id);
    }
    /**
	 * 下发资讯
	 */
    function issuedNews() {
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        var url = "news_getIssuedForm.action";
        var assignForm = LT.openForm({
            title: "下发资讯",
            pos: "center",
            width: 520,
            height: 150,
            minable: false,
            resizable: false,
            maxable: false
        }, {
            url: url
        }, function(data) {
            if (!data || !data.enterpriseNo) {
                LT.infomation({
                    content: "请选择企业号"
                });
                return false;
            }
            data.newsId = id;
            var result = LT.synPost("news_issuedNews.action", {
                issuedJson: LT.toString(data)
            });
            if (result === "success") {
                LT.infomation({
                    content: "下发成功"
                });
                return true;
            }
            return false;
        });
    }
    function getSelectedRowItemData(item) {
        var selectedRow = getSelectedRowData();
        if (!selectedRow) {
            return null;
        }
        return selectedRow[item];
    }
    function getSelectedRowData() {
        return page.dataTable.getSelectedRowData();
    }
});
