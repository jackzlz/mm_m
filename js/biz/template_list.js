define("biz/template_list",[],function(a){function b(){var a=LT.startProgress({message:"正在初始化界面"}),b=LT.showPage({url:"proTemplate_toAdd.action",title:"新增模板",width:"100%",height:"100%"},function(){b.find("iframe")[0].contentWindow.closeMe=function(){b.close(),n.refresh()},a.stopProgress(!0)})}function c(){var a=i("id");if(null===a)return void LT.infomation({content:"没有选中记录！"});var b=LT.startProgress({message:"正在初始化界面"}),c=LT.showPage({url:"proTemplate_toCopyAdd.action?id="+a,title:"新增模板",width:"100%",height:"100%"},function(){c.find("iframe")[0].contentWindow.closeMe=function(){c.close(),n.refresh()},b.stopProgress(!0)})}function d(){var a=i("id");if(null===a)return void LT.infomation({content:"没有选中记录！"});var b=LT.startProgress({message:"正在初始化界面"}),c=LT.showPage({url:"proTemplate_toEdit.action?id="+a,title:"编辑模板",width:"100%",height:"100%"},function(){c.find("iframe")[0].contentWindow.closeMe=function(){c.close(),n.refresh()},b.stopProgress(!0)})}function e(){var a=i("id");return null===a?void LT.infomation({content:"没有选中记录！"}):void window.open(LT.getBasePath()+"/webApps/manager/proTemplate_toShow.action?id="+a)}function f(){var a=i("id");return null===a?void LT.infomation({content:"没有选中记录！"}):void LT.asynPost("proTemplate_setDefault.action",{id:a},function(a){n.refresh(),LT.infomation({content:"操作成功！"})})}function g(a,b,c,d){var e,f=j(),g=f.id;return null===g?void LT.infomation({content:"没有选中记录！"}):(e=f.isdefault,void(e&&"0"!==e?k.name="取消默认模板":k.name="设置默认模板"))}function h(){var a=i("id");if(null===a)return void LT.infomation({content:"没有选中记录！"});var b="proTemplate_getAssignForm.action";LT.openForm({title:"分配模板",pos:"center",width:520,height:150,minable:!1,resizable:!1,maxable:!1},{url:b},function(b){if(!b||!b.enterpriseNo)return LT.infomation({content:"请选择企业号"}),!1;b.templateId=a;var c=LT.synPost("proTemplate_assignTemplate.action",{assignJson:LT.toString(b)});return"success"===c?(LT.infomation({content:"分配成功"}),!0):!1})}function i(a){var b=j();return b?b[a]:null}function j(){return n.dataTable.getSelectedRowData()}var k,l,m,n=LT.SimplePage.create();k={name:"设置为默认模板",icon:LT.getBasePath()+"/webApps/manager/img/setdefault.png",action:function(){f()}},l=[{name:"新增模板",icon:LT.getBasePath()+"/common/images/tool/add.png",action:function(){b()}},{name:"复制新增",icon:LT.getBasePath()+"/webApps/manager/img/copy_add.png",action:function(){c()}},{name:"编辑模板",icon:LT.getBasePath()+"/common/images/tool/edit.png",action:function(){d()}},{name:"查看效果",icon:LT.getBasePath()+"/webApps/manager/img/preview.png",action:function(){e()}},k],isRootOrgGroup&&l.push({name:"分配模板",icon:LT.getBasePath()+"/webApps/manager/img/assign.png",action:function(){h()}}),m={url:"proTemplate",menu:l,finish:function(){n.maxAdd=!0,n.maxEdit=!0}},m.tableParam={onRightClickRow:g},n.build(m)});