/**
 * 
 */
define("biz/appmsg_list-debug", [], function(require) {
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
    // 只有管理组才能分配素材
    if (isRootOrgGroup) {
        menus.push({
            name: "分配素材",
            icon: LT.getBasePath() + "/webApps/manager/img/assign.png",
            action: function() {
                assignAppmsg();
            }
        });
    }
    param = {
        url: "appmsg",
        menu: menus,
        finish: function() {
            page.maxAdd = true;
            page.maxEdit = true;
        }
    };
    param.tableParam = {};
    page.build(param);
    /**
	 * 打开新增界面
	 */
    function openAddPage() {
        var pro = LT.startProgress({
            message: "正在初始化界面"
        });
        var addPage = LT.showPage({
            url: "appmsg_toAdd.action",
            title: "新增素材",
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
        var id = getSelectedRowItemData("id");
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
            url: "appmsg_toEdit.action?id=" + id,
            title: "编辑素材",
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
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        window.open(LT.getBasePath() + "/webApps/manager/appmsg_toShow.action?id=" + id);
    }
    /**
	 * 分配素材
	 */
    function assignAppmsg() {
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        var url = "appmsg_getAssignForm.action";
        var assignForm = LT.openForm({
            title: "分配素材",
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
            data.appmsgId = id;
            var result = LT.synPost("appmsg_assignAppmsg.action", {
                assignJson: LT.toString(data)
            });
            if (result === "success") {
                LT.infomation({
                    content: "分配成功"
                });
                return true;
            }
            return false;
        });
    }
    function getSelectedRowItemData(item) {
        return getSelectedRowData()[item];
    }
    function getSelectedRowData() {
        return page.dataTable.getSelectedRowData();
    }
});
