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
