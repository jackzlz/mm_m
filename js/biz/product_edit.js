define("biz/product_edit",[],function(a){function b(a){d(proTypeArr),f(null,a),a.getElement("enterpriseNo")&&(a.getElement("enterpriseNo").event.change=function(b){e(b,a)}),a.getElement("type").event.change=function(b){f(b,a)}}function c(a){d(proTypeArr),f(null,a),a.getElement("enterpriseNo")&&(a.getElement("enterpriseNo").event.change=function(b){e(b,a)}),a.getElement("type").event.change=function(b){f(b,a)},a.getElement("type").content.attr("readonly",!0)}function d(a){for(var b,c={},d=0;d<a.length;d++)b=a[d],b.paramValue.match("^{(.+:.+,*){1,}}$")&&(c=JSON.parse(b.paramValue)),i[b.paramKey]=c}function e(a,b){$.getJSON("product_getProductTypesByEnterpriseNo.action",{enterpriseNo:a},function(a){var c,e,f,g={"":"请选择"};for(c=a.productTypes,d(c),e=0;e<c.length;e++)f=c[e].paramValue,f.match("^{(.+:.+,*){1,}}$")&&(f=JSON.parse(f).name),g[c[e].paramKey]=f;b.getElement("type").content.refresh(g),b.getElement("type").content.change()})}function f(a,b){var c,d,e,f,i=b.model.formItems;for(a=a||b.getElementValue(b.getElement("type").content),d=0;d<i.length;d++)c=i[d],f=b.getElement(c.name).root,e=g(c,a),e?f.show():f.hide();h(b.getElement("type1"),a)}function g(a,b){var c,d=!1,e=a.productTypes;if(!e||!e.length)return!0;for(c=0;c<e.length;c++){if("ALL"===e[c]){d=!0;break}if(e[c]===b){d=!0;break}}return d}function h(a,b){var c,d,e={"":"请选择"};if(c=i[b],c&&(d=c.children))for(var f=0;f<d.length;f++)e[d[f].code]=d[f].name;a.content.refresh(e)}var i={};window.simplePageAdd=b,window.simplePageEdit=c});