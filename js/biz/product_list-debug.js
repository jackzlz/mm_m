/**
 * 产品管理列表
 */
define("biz/product_list-debug", [ "./product_edit-debug" ], function(require) {
    var page, typeToChildTypes = {};
    /**
	 * 初始化页面
	 */
    function initPage() {
        var param, menus, topmenu, detailmenu;
        topmenu = {
            name: "置顶",
            icon: LT.getBasePath() + "/webApps/manager/img/top.png",
            action: function() {
                top();
            }
        };
        detailmenu = {
            name: "编辑详情",
            icon: LT.getBasePath() + "/webApps/manager/img/edit_detail.png",
            action: function() {
                editDetail();
            }
        };
        menus = [ {
            name: "查看详情",
            icon: LT.getBasePath() + "/webApps/manager/img/preview.png",
            action: function() {
                openShowPage();
            }
        }, detailmenu, topmenu ];
        param = {
            url: "product",
            menu: menus,
            finish: function() {
                page.menus.topmenu = topmenu;
                page.menus.detailmenu = detailmenu;
                // 初始化完成
                initFinish();
            }
        };
        param.tableParam = {
            onRightClickRow: rightClickRow
        };
        page = LT.SimplePage.create();
        page.build(param);
    }
    /**
	 * 初始化完成后事件
	 */
    function initFinish() {
        // 初始化子类型
        initChildTypes(proTypeArr);
        // 根据产品类型隐藏数据列
        hideBodyCols();
        // 刷新子类型
        refreshChildTypes(page.form.getElement("type1"), page.form.getElementValue(page.form.getElement("type").content));
        // 企业号改变事件
        if (page.form.getElement("enterpriseNo")) {
            page.form.getElement("enterpriseNo").event.change = function(enterpriseNo) {
                // 刷新产品类型
                refreshProductTypes(enterpriseNo);
            };
        }
        // 产品类型改变事件
        page.form.getElement("type").event.change = function(proType) {
            // 刷新子类型
            refreshChildTypes(page.form.getElement("type1"), proType);
        };
        page.customButton["查询"].click(function() {
            page.fireQuery();
            // 根据产品类型隐藏数据列
            hideBodyCols();
        });
        page.menus.add.name = "新增产品";
        page.menus.edit.name = "修改产品";
        page.maxAdd = true;
        page.maxEdit = true;
    }
    /**
	 * 根据产品类型隐藏数据列
	 */
    function hideBodyCols(proType) {
        var hideCols = [], showCols = [], i, flag;
        var tableCols = page.dataTable.param.model.tableCols;
        proType = proType || page.form.getElementValue(page.form.getElement("type").content);
        for (i = 0; i < tableCols.length; i++) {
            flag = isShow(tableCols[i], proType);
            if (flag) {
                showCols.push(tableCols[i].proName);
            } else {
                hideCols.push(tableCols[i].proName);
            }
        }
        page.dataTable.hideCol(hideCols);
        page.dataTable.showCol(showCols);
        page.dataTable.table.jqGrid("clearGridData");
    }
    function isShow(tableCol, proType) {
        var flag = false, i;
        var productTypes = tableCol.productTypes;
        if (tableCol.hidden) {
            return false;
        }
        if (!productTypes || !productTypes.length) {
            return true;
        }
        for (i = 0; i < productTypes.length; i++) {
            if (productTypes[i] === "ALL") {
                flag = true;
                break;
            }
            if (productTypes[i] === proType) {
                flag = true;
                break;
            }
        }
        return flag;
    }
    /**
	 * 初始化子类型
	 */
    function initChildTypes(proTypeArr) {
        var proType, childTypes = {};
        for (var i = 0; i < proTypeArr.length; i++) {
            proType = proTypeArr[i];
            // 是json格式的字符串
            if (proType.paramValue.match("^{(.+:.+,*){1,}}$")) {
                childTypes = JSON.parse(proType.paramValue);
            }
            typeToChildTypes[proType.paramKey] = childTypes;
        }
    }
    /**
	 * 企业号联动产品类型
	 */
    function refreshProductTypes(enterpriseNo) {
        $.getJSON("product_getProductTypesByEnterpriseNo.action", {
            enterpriseNo: enterpriseNo
        }, function(data) {
            var productTypes, productTypeMap = {
                "": "请选择"
            }, i, productTypeValue;
            productTypes = data.productTypes;
            initChildTypes(productTypes);
            for (i = 0; i < productTypes.length; i++) {
                productTypeValue = productTypes[i].paramValue;
                if (productTypeValue.match("^{(.+:.+,*){1,}}$")) {
                    productTypeValue = JSON.parse(productTypeValue)["name"];
                }
                productTypeMap[productTypes[i].paramKey] = productTypeValue;
            }
            page.form.getElement("type").content.refresh(productTypeMap);
            page.form.getElement("type").content.change();
        });
    }
    /**
	 * 产品类型联动产品子类型
	 */
    function refreshChildTypes(childTypeElement, proType) {
        var childTypes, childs, childTypeMap = {
            "": "请选择"
        };
        childTypes = typeToChildTypes[proType];
        if (childTypes) {
            childs = childTypes["children"];
            if (childs) {
                for (var i = 0; i < childs.length; i++) {
                    childTypeMap[childs[i].code] = childs[i].name;
                }
            }
        }
        childTypeElement.content.refresh(childTypeMap);
    }
    /**
	 * 打开显示界面
	 */
    function openShowPage() {
        var shareid = getSelectedRowItemData("shareId");
        if (!shareid) {
            LT.infomation({
                content: "当前产品没有详情！"
            });
            return;
        }
        window.open(LT.getBasePath() + "/webApps/public/share/show.html?id=" + shareid);
    }
    function top() {
        var id = getSelectedRowItemData("id");
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        LT.asynPost("product_top.action", {
            id: id
        }, function(data) {
            page.refresh();
            LT.infomation({
                content: "操作成功！"
            });
        });
    }
    function editDetail() {
        var proid = getSelectedRowItemData("id");
        var shareid = getSelectedRowItemData("shareId");
        var pro = LT.startProgress({
            message: "正在初始化界面"
        });
        var editPage = LT.showPage({
            url: "share_toEdit.action?proid=" + proid + "&" + "id=" + shareid,
            title: "编辑产品详情",
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
    function rightClickRow(rowid, iRow, iCol, e) {
        var selectedData = getSelectedRowData(), id = selectedData.id, top;
        if (id === null) {
            LT.infomation({
                content: "没有选中记录！"
            });
            return;
        }
        top = selectedData.top;
        page.menus.topmenu.name = "置顶";
        if (top && top !== "0") {
            page.menus.topmenu.name = "取消置顶";
        }
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
    initPage();
    require("./product_edit-debug");
});

/**
 * 产品管理列表
 */
define("biz/product_edit-debug", [], function(require) {
    var typeToChildTypes = {};
    /**
	 * 新增后处理事件
	 */
    function simplePageAdd(form) {
        initChildTypes(proTypeArr);
        productTypeChangeOnEdit(null, form);
        // 企业号改变事件
        if (form.getElement("enterpriseNo")) {
            form.getElement("enterpriseNo").event.change = function(enterpriseNo) {
                // 刷新产品类型
                refreshProductTypes(enterpriseNo, form);
            };
        }
        // 产品类型改变事件
        form.getElement("type").event.change = function(proType) {
            productTypeChangeOnEdit(proType, form);
        };
    }
    function simplePageEdit(form) {
        initChildTypes(proTypeArr);
        productTypeChangeOnEdit(null, form);
        // 企业号改变事件
        if (form.getElement("enterpriseNo")) {
            form.getElement("enterpriseNo").event.change = function(enterpriseNo) {
                // 刷新产品类型
                refreshProductTypes(enterpriseNo, form);
            };
        }
        // 产品类型改变事件
        form.getElement("type").event.change = function(proType) {
            productTypeChangeOnEdit(proType, form);
        };
        form.getElement("type").content.attr("readonly", true);
    }
    function initChildTypes(proTypeArr) {
        var proType, childTypes = {};
        for (var i = 0; i < proTypeArr.length; i++) {
            proType = proTypeArr[i];
            // 是json格式的字符串
            if (proType.paramValue.match("^{(.+:.+,*){1,}}$")) {
                childTypes = JSON.parse(proType.paramValue);
            }
            typeToChildTypes[proType.paramKey] = childTypes;
        }
    }
    /**
	 * 企业号联动产品类型
	 */
    function refreshProductTypes(enterpriseNo, form) {
        $.getJSON("product_getProductTypesByEnterpriseNo.action", {
            enterpriseNo: enterpriseNo
        }, function(data) {
            var productTypes, productTypeMap = {
                "": "请选择"
            }, i, productTypeValue;
            productTypes = data.productTypes;
            initChildTypes(productTypes);
            for (i = 0; i < productTypes.length; i++) {
                productTypeValue = productTypes[i].paramValue;
                if (productTypeValue.match("^{(.+:.+,*){1,}}$")) {
                    productTypeValue = JSON.parse(productTypeValue)["name"];
                }
                productTypeMap[productTypes[i].paramKey] = productTypeValue;
            }
            form.getElement("type").content.refresh(productTypeMap);
            form.getElement("type").content.change();
        });
    }
    function productTypeChangeOnEdit(proType, form) {
        var formItem, i, flag, col;
        var formItems = form.model.formItems;
        proType = proType || form.getElementValue(form.getElement("type").content);
        for (i = 0; i < formItems.length; i++) {
            formItem = formItems[i];
            col = form.getElement(formItem.name).root;
            flag = isShow(formItem, proType);
            if (flag) {
                col.show();
            } else {
                col.hide();
            }
        }
        // 刷新子类型
        refreshChildTypes(form.getElement("type1"), proType);
    }
    function isShow(formItem, proType) {
        var flag = false, i;
        var productTypes = formItem.productTypes;
        if (!productTypes || !productTypes.length) {
            return true;
        }
        for (i = 0; i < productTypes.length; i++) {
            if (productTypes[i] === "ALL") {
                flag = true;
                break;
            }
            if (productTypes[i] === proType) {
                flag = true;
                break;
            }
        }
        return flag;
    }
    /**
	 * 刷新子类型
	 */
    function refreshChildTypes(childTypeElement, proType) {
        var childTypes, childs, childTypeMap = {
            "": "请选择"
        };
        childTypes = typeToChildTypes[proType];
        if (childTypes) {
            childs = childTypes["children"];
            if (childs) {
                for (var i = 0; i < childs.length; i++) {
                    childTypeMap[childs[i].code] = childs[i].name;
                }
            }
        }
        childTypeElement.content.refresh(childTypeMap);
    }
    window.simplePageAdd = simplePageAdd;
    window.simplePageEdit = simplePageEdit;
});
