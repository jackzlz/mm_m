/**
 * 
 */
define("biz/template_list-debug", [], function(require) {
    var page = LT.SimplePage.create(), defaultmenu, menus, param;
    defaultmenu = {
        name: "设置为默认模板",
        icon: LT.getBasePath() + "/webApps/manager/img/setdefault.png",
        action: function() {
            setDefault();
        }
    };
    menus = [ {
        name: "新增模板",
        icon: LT.getBasePath() + "/common/images/tool/add.png",
        action: function() {
            openAddPage();
        }
    }, {
        name: "复制新增",
        icon: LT.getBasePath() + "/webApps/manager/img/copy_add.png",
        action: function() {
            copyAdd();
        }
    }, {
        name: "编辑模板",
        icon: LT.getBasePath() + "/common/images/tool/edit.png",
        action: function() {
            openEditPage();
        }
    }, {
        name: "查看效果",
        icon: LT.getBasePath() + "/webApps/manager/img/preview.png",
        action: function() {
            openShowPage();
        }
    }, defaultmenu ];
    // 只有管理组才能分配模板
    if (isRootOrgGroup) {
        menus.push({
            name: "分配模板",
            icon: LT.getBasePath() + "/webApps/manager/img/assign.png",
            action: function() {
                assignTemplate();
            }
        });
    }
    param = {
        url: "proTemplate",
        menu: menus,
        finish: function() {
            page.maxAdd = true;
            page.maxEdit = true;
        }
    };
    param.tableParam = {
        onRightClickRow: rightClickRow
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
            url: "proTemplate_toAdd.action",
            title: "新增模板",
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
	 * 复制新增
	 */
    function copyAdd() {
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
        var addPage = LT.showPage({
            url: "proTemplate_toCopyAdd.action?id=" + id,
            title: "新增模板",
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
            url: "proTemplate_toEdit.action?id=" + id,
            title: "编辑模板",
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
        window.open(LT.getBasePath() + "/webApps/manager/proTemplate_toShow.action?id=" + id);
    }
    /**
	 * 设置默认模板
	 */
    function setDefault() {
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        LT.asynPost("proTemplate_setDefault.action", {
            id: id
        }, function(data) {
            page.refresh();
            LT.infomation({
                content: "操作成功！"
            });
        });
    }
    /**
	 * 右键处理事件
	 */
    function rightClickRow(rowid, iRow, iCol, e) {
        var selectedData = getSelectedRowData(), id = selectedData.id, isdefault;
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        isdefault = selectedData.isdefault;
        if (isdefault && isdefault !== "0") {
            defaultmenu.name = "取消默认模板";
        } else {
            defaultmenu.name = "设置默认模板";
        }
    }
    /**
	 * 分配模板
	 */
    function assignTemplate() {
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        var url = "proTemplate_getAssignForm.action";
        var assignForm = LT.openForm({
            title: "分配模板",
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
            data.templateId = id;
            var result = LT.synPost("proTemplate_assignTemplate.action", {
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
