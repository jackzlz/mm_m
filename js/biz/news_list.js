define("biz/news_list",[],function(a){function b(){var a=LT.startProgress({message:"正在初始化界面"}),b=LT.showPage({url:"news_toAdd.action",title:"新增资讯",width:"100%",height:"100%"},function(){b.find("iframe")[0].contentWindow.closeMe=function(){b.close(),j.refresh()},a.stopProgress(!0)})}function c(){var a=j.dataTable.getSelectedRowData(),b=a.id;if(null===b)return void LT.infomation({content:"没有选中记录！"});var c=LT.startProgress({message:"正在初始化界面"}),d=LT.showPage({url:"news_toEdit.action?id="+b,title:"编辑资讯",width:"100%",height:"100%"},function(){d.find("iframe")[0].contentWindow.closeMe=function(){d.close(),j.refresh()},c.stopProgress(!0)})}function d(){var a=j.dataTable.getSelectedRowData(),b=a.id;return null===b?void LT.infomation({content:"没有选中记录！"}):void window.open("news_preview.action?id="+b)}function e(){var a=f("id");if(null===a)return void LT.infomation({content:"没有选中记录！"});var b="news_getIssuedForm.action";LT.openForm({title:"下发资讯",pos:"center",width:520,height:150,minable:!1,resizable:!1,maxable:!1},{url:b},function(b){if(!b||!b.enterpriseNo)return LT.infomation({content:"请选择企业号"}),!1;b.newsId=a;var c=LT.synPost("news_issuedNews.action",{issuedJson:LT.toString(b)});return"success"===c?(LT.infomation({content:"下发成功"}),!0):!1})}function f(a){var b=g();return b?b[a]:null}function g(){return j.dataTable.getSelectedRowData()}var h,i,j=LT.SimplePage.create();h=[{name:"新增",icon:LT.getBasePath()+"/common/images/tool/add.png",action:function(){b()}},{name:"查看",icon:LT.getBasePath()+"/webApps/manager/img/preview.png",action:function(){d()}},{name:"编辑",icon:LT.getBasePath()+"/common/images/tool/edit.png",action:function(){c()}}],isRootOrgGroup&&h.push({name:"下发资讯",icon:LT.getBasePath()+"/webApps/manager/img/send.png",action:function(){e()}}),i={url:"news",menu:h,finish:function(){j.maxAdd=!0,j.maxEdit=!0}},j.build(i)});