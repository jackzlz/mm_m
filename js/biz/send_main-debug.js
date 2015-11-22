/**
 * 
 */
define("biz/send_main-debug", [ "../tpl/appmsg_send-debug.html", "../common/appmsgdialog-debug", "../css/ui-dialog-debug.css", "../css/appmsgdialog-debug.css", "../tpl/dialog/appmsg_layout-debug.html", "../tpl/dialog/appmsg_list-debug.html", "../lib/dialog/dialog-debug", "../lib/dialog/popup-debug", "../lib/dialog/dialog-config-debug", "../common/pagebar-debug", "../tpl/pagebar-debug.html", "../common/tips-debug", "../common/newsdialog-debug", "../css/newsdialog-debug.css", "../tpl/dialog/news_layout-debug.html", "../tpl/dialog/news_list-debug.html" ], function(require) {
    var appsmgsendTpl = require("../tpl/appmsg_send-debug.html"), appmsgsendTplCom = juicer(appsmgsendTpl);
    var AppmsgDialog = require("../common/appmsgdialog-debug");
    var NewsDialog = require("../common/newsdialog-debug");
    var tips = require("../common/tips-debug");
    var MsgSend = function() {
        this.shares = [];
        this.newsArr = [];
        this.init();
    };
    MsgSend.prototype = {
        constructor: MsgSend,
        init: function() {
            this.initUI();
            this.initEvents();
            this.showFirstTab();
        },
        initUI: function() {
            $(".msgsend-sender").html(appmsgsendTplCom.render({
                sender: senditem
            }));
            this._refreshMsgCol();
        },
        _refreshMsgCol: function(enterpriseNo) {
            var msgCols = [];
            if (!enterpriseNo || enterpriseNo === "") {
                enterpriseNo = "ohmrong";
            }
            msgCols = enterpriseMsgCols[enterpriseNo];
            if (!msgCols || !msgCols.length) {
                $.getJSON("send_getMsgColsByEnterpriseNo.action", {
                    enterpriseNo: enterpriseNo
                }, function(data) {
                    enterpriseMsgCols[enterpriseNo] = data.msgCols;
                    $("#msgcol").html(juicer(getMsgColTpl(), {
                        data: enterpriseMsgCols[enterpriseNo]
                    }));
                });
            } else {
                $("#msgcol").html(juicer(getMsgColTpl(), {
                    data: msgCols
                }));
            }
        },
        initEvents: function() {
            var $send = this;
            var groupArr = [];
            $("#sendobj").change(function() {
                var value = $(this).val();
                var tpl = getGroupTpl();
                if (value === "all") {
                    $("#group").attr("disabled", true);
                    $("#users").attr("disabled", true);
                    $("#group").html(null);
                    $("#users").html(null);
                    $("#group").trigger("change");
                } else if (value === "group") {
                    $("#group").attr("disabled", false);
                    $("#users").attr("disabled", false);
                    if (groupArr.length === 0) {
                        $.getJSON("send_getGroupList.action", function(data) {
                            var grouplist = data.grouplist;
                            $.each(grouplist, function(i, n) {
                                groupArr.push({
                                    id: n.groupId,
                                    name: n.groupName,
                                    enterpriseNo: n.enterpriseNo
                                });
                            });
                            $("#group").html(juicer(tpl, {
                                data: groupArr
                            }));
                            $("#group").trigger("change");
                        });
                    } else {
                        $("#group").html(juicer(tpl, {
                            data: groupArr
                        }));
                        $("#group").trigger("change");
                    }
                }
            });
            $("#group").change(function() {
                var selGroup, groupId, enterpriseNo;
                selGroup = $(this).find("option:selected");
                groupId = selGroup.val();
                enterpriseNo = selGroup.data("enterpriseNo");
                if (groupId && groupId.length) {
                    $.getJSON("send_getUserListByGroupId.action", {
                        groupid: groupId
                    }, function(data) {
                        if (data.status === 0) {
                            tips.error("加载失败！");
                            return;
                        }
                        var items = [];
                        var userlist = data.userlist;
                        if (userlist && userlist.length) {
                            items.push({
                                id: "ALL",
                                name: "所有用户"
                            });
                            $.each(userlist, function(i, n) {
                                items.push({
                                    id: n.userName,
                                    name: n.userName
                                });
                            });
                        }
                        var tpl = getGroupTpl();
                        $("#users").html(juicer(tpl, {
                            data: items
                        }));
                    });
                }
                $send._refreshMsgCol(enterpriseNo);
            });
            $("#myTab").on("click", "li a", function(event) {
                event.preventDefault();
                var $this = $(this);
                var href = $this.attr("href");
                if (href === "#appmsgpanel") {
                    new AppmsgDialog({
                        pageSize: 12,
                        maxSelect: 100,
                        groupId: $("#group").val(),
                        onOK: function(selectItems) {
                            var html = juicer("#appmsg-tabcontent", {
                                data: selectItems
                            });
                            $("#appmsgpanel").html(html);
                            $send.shares = selectItems;
                        }
                    });
                } else if (href === "#newspanel") {
                    new NewsDialog({
                        maxSelect: 10,
                        groupId: $("#group").val(),
                        onOK: function(newsArr) {
                            var coverImageUrlCom = juicer(getCoverImageUrlTpl());
                            $.each(newsArr, function(i, n) {
                                n.imgurl = coverImageUrlCom.render({
                                    uuid: n.cover
                                });
                            });
                            var html = juicer("#selectnews-list", {
                                data: newsArr
                            });
                            $("#newspanel").html(html);
                            $send.newsArr = newsArr;
                        }
                    });
                }
                $this.tab("show");
                $send.currTab = $this;
            });
            $("#sendBtn").click(function() {
                var datas = $send.getData();
                if (!$send.validate(datas)) {
                    return;
                }
                var $btn = $("#sendBtn").button("loading");
                $.post("send_push.action", {
                    jsondata: JSON.stringify(datas)
                }, function(data) {
                    if (data.status == 1) {
                        tips.success("发送成功！");
                        $send.clear();
                        $send.showFirstTab();
                        $btn.button("reset");
                    } else {
                        tips.error("发送失败！", function() {
                            $btn.button("reset");
                        });
                    }
                }, "json");
            });
        },
        getData: function() {
            var id, tabpanel, msg, title, text, share, news, i;
            if (!this.currTab) {
                tips.error("请选择文字或者图文消息！");
                return null;
            }
            id = this.currTab.attr("href");
            tabpanel = $(id);
            msg = {};
            if (tabpanel.attr("id") === "textpanel") {
                msg.type = "text";
                msg.content = {};
                title = $("#title").val();
                text = tabpanel.find(".editorarea").text().trim();
                msg.content.text = text;
                msg.content.title = title;
            } else if (tabpanel.attr("id") === "appmsgpanel") {
                msg.type = "share";
                msg.content = [];
                for (i = 0; i < this.shares.length; i++) {
                    share = this.shares[i];
                    msg.content.push({
                        title: share.title,
                        desc: share.desc,
                        linkId: share.id,
                        img: share.thumbid
                    });
                }
            } else if (tabpanel.attr("id") === "newspanel") {
                msg.type = "news";
                msg.content = [];
                for (i = 0; i < this.newsArr.length; i++) {
                    news = this.newsArr[i];
                    msg.content.push({
                        title: news.title,
                        linkId: news.id,
                        img: news.cover
                    });
                }
            }
            msg.receiver = {};
            if ($("#sendobj").val() === "all") {
                msg.receiver.group = "ALL";
                msg.receiver.user = "ALL";
            } else {
                msg.receiver.group = $("#group").val();
                msg.receiver.user = $("#users").val();
            }
            //msg.sender = senditem;
            msg.sender = $("#msgcol").val();
            msg.sendertype = "SYSTEM";
            return msg;
        },
        validate: function(datas) {
            if (!datas) {
                tips.error("没有数据!");
                return false;
            }
            if (!datas.sender || datas.sender === "-1") {
                tips.error("请选择一个栏目发送");
                return false;
            }
            if (datas.type === "text") {
                if (!datas.content.title.length || datas.content.title.length > 600) {
                    tips.error("标题必须为1到32个字");
                    return false;
                }
                if (!datas.content.text.length || datas.content.text.length > 600) {
                    tips.error("文字必须为1到600个字");
                    return false;
                }
            } else if (datas.type === "share") {
                if (!datas.content || !datas.content.length) {
                    tips.error("请选择产品信息");
                    return false;
                }
            } else if (datas.type === "news") {
                if (!datas.content || !datas.content.length) {
                    tips.error("请选择资讯信息");
                    return false;
                }
            }
            if (datas.receiver.group !== "ALL" && !datas.receiver.user) {
                tips.error("群发对象不能为空");
                return false;
            }
            return true;
        },
        clear: function() {
            var id = this.currTab.attr("href");
            var tabpanel = $(id);
            if (tabpanel.attr("id") === "textpanel") {
                $("#title").val("");
                tabpanel.find(".editorarea").text("");
            } else if (tabpanel.attr("id") === "appmsgpanel") {
                this.shares = [];
                $("#appmsgpanel").html("");
            } else if (tabpanel.attr("id") === "newspanel") {
                this.newsArr = [];
                $("#newspanel").html("");
            }
        },
        showFirstTab: function() {
            var firstTab = $(".msgsend-tabpanel li:first a"), tabpanel = $(firstTab.attr("href"));
            firstTab.tab("show");
            if (tabpanel.attr("id") === "textpanel") {
                tabpanel.find(".editorarea").focus();
            } else {
                tabpanel.focus();
            }
            this.currTab = firstTab;
        }
    };
    function getCoverImageUrlTpl() {
        return "/liontech/webApps/datastore/thumb.ds?uuid=!{uuid}&accesspointtype=standardweb";
    }
    function getGroupTpl() {
        var tpl = [];
        tpl.push("{@each data as item,index}");
        tpl.push('<option value="!{item.id}" data-enterprise-No="!{item.enterpriseNo}">!{item.name}</option>');
        tpl.push("{@/each}");
        return tpl.join("");
    }
    function getUserTpl() {
        var tpl = [];
        tpl.push("{@each data as item,index}");
        tpl.push('<option value="!{item.id}">!{item.name}</option>');
        tpl.push("{@/each}");
        return tpl.join("");
    }
    function getSenderTpl() {
        var tpl = [];
        tpl.push("{@each data as item,index}");
        tpl.push('<option value="!{item.id}">!{item.name}</option>');
        tpl.push("{@/each}");
        return tpl.join("");
    }
    function getMsgColTpl() {
        var tpl = [];
        tpl.push('<option value="-1">请选择栏目</option>');
        tpl.push("{@each data as item,index}");
        tpl.push('<option value="!{item.id}">!{item.name}</option>');
        tpl.push("{@/each}");
        return tpl.join("");
    }
    new MsgSend();
});

define("tpl/appmsg_send-debug.html", [], '<!-- 消息推送主界面 -->\n<div class="msgsend-toolbar">\n	<div class="form-inline">\n		<div class="form-group">\n			<label for="sendobj">群发对象</label> <select class="form-control" id="sendobj" name="sendobj">\n				<option value="all">全部用户</option>\n				<option value="group">按分组选择</option>\n			</select>\n		</div>\n		<div class="form-group">\n			<label class="sr-only" for="group">分组</label> <select class="form-control" id="group" name="group" disabled="true">\n			</select>\n		</div>\n		<div class="form-group">\n			<label class="sr-only" for="users">用户</label> <select class="form-control" id="users" name="users" disabled="true">\n			</select>\n		</div>\n		<div class="form-group">\n			<label class="sr-only" for="msgcol">选择栏目</label> <select class="form-control" id="msgcol" name="msgcol">\n				<option value="-1">请选择栏目</option>\n			</select>\n		</div>\n		{@if sender==="systemNotice"}\n		<div class="form-group">\n			<label for="title">标题</label> <input type="text" class="form-control" id="title" placeholder="请输入标题">\n		</div>\n		{@/if}\n		<button type="button" class="btn btn-primary" id="sendBtn" style="width: 104px" data-loading-text="正在发送...">群发</button>\n	</div>\n</div>\n<div role="tabpanel" class="tabpanel msgsend-tabpanel">\n	<ul class="nav nav-tabs" role="tablist" id="myTab">\n		{@if sender==="systemNotice"}\n		<li role="presentation" class="active tab-text" id="tab_text"><a href="#textpanel" aria-controls="textpanel"\n			role="tab"><i class="icon_msg_sender"></i><span class="msgsend-tabtitle">文字</span></a></li> {@/if} {@if\n		sender==="shareCenter"}\n		<li role="presentation" class="active tab-appmsg" id="tab_appmsg"><a href="#appmsgpanel"\n			aria-controls="appmsgpanel" role="tab"><i class="icon_msg_sender"></i><span class="msgsend-tabtitle">产品</span></a></li>\n		{@/if} {@if sender==="hotNews"}\n		<li role="presentation" class="active tab-news" id="tab_news"><a href="#newspanel" aria-controls="newspanel"\n			role="tab"><i class="icon_msg_sender"></i><span class="msgsend-tabtitle">资讯</span></a></li> {@/if}\n	</ul>\n	<div class="tab-content msgsend-tabcontent">\n		{@if sender==="systemNotice"}\n		<div role="tabpanel" class="tab-pane active" id="textpanel">\n			<div class="editorarea" contenteditable="true">\n				<br />\n			</div>\n		</div>\n		{@/if} {@if sender==="shareCenter"}\n		<div role="tabpanel" class="tab-pane active" id="appmsgpanel"></div>\n		{@/if} {@if sender==="hotNews"}\n		<div role="tabpanel" class="tab-pane active" id="newspanel"></div>\n		{@/if}\n	</div>\n</div>');

/**
 * 图文消息-产品列表
 */
define("common/appmsgdialog-debug", [ "lib/dialog/dialog-debug", "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug", "common/pagebar-debug", "common/tips-debug" ], function(require, exports, module) {
    require("css/ui-dialog-debug.css");
    require("css/appmsgdialog-debug.css");
    var appmsglayoutTpl = require("tpl/dialog/appmsg_layout-debug.html"), appmsglayoutTplCom = juicer(appmsglayoutTpl);
    var appmsglistTpl = require("tpl/dialog/appmsg_list-debug.html"), appmsglistTplCom = juicer(appmsglistTpl);
    var dialog = require("lib/dialog/dialog-debug");
    var PageBar = require("common/pagebar-debug");
    var tips = require("common/tips-debug");
    var defaultOpts = {
        pageSize: 12,
        maxSelect: 1
    };
    var AppmsgDialog = function(opts) {
        this.appmsgArr = [];
        this.options = opts = $.extend(true, {}, defaultOpts, opts);
        this.init();
    };
    AppmsgDialog.prototype = {
        constructor: AppmsgDialog,
        init: function() {
            var that = this;
            var opts = that.options;
            that.dialog = dialog({
                // !!!fix.css通过id控制样式，不要更改
                id: "selectAppmsg",
                title: "选择产品",
                content: appmsglayoutTplCom.render(),
                padding: 0,
                // !!!通过选择器控制样式，不要更改
                skin: "appmsgdg"
            }).showModal();
            $(that.dialog.node).find(".js_loading").show();
            that.getAppmsgList({
                pagesize: opts.pageSize,
                groupId: opts.groupId
            }, function(data) {
                var appmsgs = data.datalist;
                that.renderAppmsgList(appmsgs, that.appmsgArr);
                that.initEvents();
                that.initPageBar(data.total);
                $(that.dialog.node).find(".js_loading").hide();
            });
        },
        initEvents: function() {
            var that = this, opts = that.options, dialog = $(that.dialog.node);
            $("#appmsgSearchBtn").click(function() {
                var keyword = $("#appmsgSearchInput").val();
                $(that.dialog.node).find(".js_loading").show();
                that.getAppmsgList({
                    keyword: keyword,
                    pagesize: opts.pageSize,
                    groupId: opts.groupId
                }, function(data) {
                    var appmsgs = data.datalist;
                    that.renderAppmsgList(appmsgs, that.appmsgArr);
                    that.initPageBar(data.total);
                    $(that.dialog.node).find(".js_loading").hide();
                });
            });
            dialog.find(".appmsgcreate").click(function() {
                var page = top.LT.showPage({
                    url: "/liontech/webApps/manager/share_toAdd.action",
                    title: "新增产品",
                    width: 900,
                    height: 600,
                    draggable: true,
                    resizable: true,
                    minable: true,
                    maxable: true
                }, function() {
                    page.find("iframe")[0].contentWindow.closeMe = function() {
                        page.close();
                        $("#appmsgSearchBtn").trigger("click");
                    };
                });
            });
            dialog.on("click", ".appmsg-item .thumbnail", function() {
                var appmsgitem = $(this).parent(), appmsgid = appmsgitem.data("id");
                var title = $(this).find(".appmsg-title").text().trim();
                var publishtime = $(this).find(".appmsg-date").text().trim();
                var thumb = $(this).find(".appmsg-thumb-wrp img");
                var thumbid = thumb.data("id"), thumburl = thumb.attr("src");
                var desc = $(this).find(".appmsg-desc").text().trim();
                if (appmsgitem.hasClass("selected")) {
                    appmsgitem.removeClass("selected");
                    var i = indexOf(that.appmsgArr, appmsgid);
                    if (i >= 0) {
                        that.appmsgArr.splice(i, 1);
                    }
                } else {
                    if (opts.maxSelect === 1) {
                        appmsgitem.addClass("selected");
                        appmsgitem.siblings(".selected").removeClass("selected");
                        that.appmsgArr = [ {
                            id: appmsgid,
                            title: title,
                            publishtime: publishtime,
                            thumburl: thumburl,
                            thumbid: thumbid,
                            desc: desc
                        } ];
                    } else {
                        if (opts.maxSelect > that.appmsgArr.length) {
                            appmsgitem.addClass("selected");
                            that.appmsgArr.push({
                                id: appmsgid,
                                title: title,
                                publishtime: publishtime,
                                thumburl: thumburl,
                                thumbid: thumbid,
                                desc: desc
                            });
                        } else {
                            tips.error("最多可选" + opts.maxSelect + "项");
                        }
                    }
                }
            });
            dialog.on("click", "#okButton", function() {
                if (that.appmsgArr.length === 0) {
                    return false;
                }
                opts.onOK && opts.onOK(that.appmsgArr);
                that.dialog.close().remove();
            });
            dialog.on("click", "#cancelButton", function() {
                opts.onCancel && opts.onCancel();
                that.dialog.close().remove();
            });
        },
        initPageBar: function(appmsgcount) {
            var that = this, opts = that.options, appsgdg = $(that.dialog.node);
            that.pagebar && that.pagebar.destroy();
            if (opts.pageSize >= appmsgcount) {
                $("#appmsg-pagebar").empty();
                $("#appmsg-pagebar").hide();
                return;
            }
            that.pagebar = new PageBar({
                container: "#appmsg-pagebar",
                totalCount: appmsgcount,
                pageSize: opts.pageSize,
                onCallback: function(index) {
                    appsgdg.find("#appmsg-pagebar").hide();
                    appsgdg.find(".js_loading").show();
                    var keyword = $("#appmsgSearchInput").val();
                    that.getAppmsgList({
                        keyword: keyword,
                        index: index,
                        pagesize: opts.pageSize,
                        groupId: opts.groupId
                    }, function(data) {
                        var appmsgs = data.datalist;
                        that.renderAppmsgList(appmsgs, that.appmsgArr);
                        appsgdg.find(".js_loading").hide();
                        appsgdg.find("#appmsg-pagebar").show();
                    });
                    appsgdg.find(".newsdg-main").scrollTop(0);
                }
            });
        },
        getAppmsgList: function(options, onCallback) {
            options = $.extend({
                index: 1,
                pagesize: 12
            }, options);
            $.getJSON("share_getShareList.action", options, function(data) {
                data.status !== 1 ? tips.error("图文消息列表加载失败！") : onCallback(data);
            });
        },
        renderAppmsgList: function(appmsgs, appmsgArr) {
            var that = this, opts = that.options;
            appmsgs = appmsgs ? appmsgs : [];
            $.each(appmsgs, function(i, n) {
                n.thumb = "/liontech/webApps/datastore/openSource.ds?uuid=" + n.cover + "&accesspointtype=standardweb";
                if (indexOf(appmsgArr, n.id) !== -1) {
                    n.selected = 1;
                }
            });
            $("#appmsg-content").html(appmsglistTplCom.render({
                data: appmsgs
            }));
        }
    };
    function indexOf(appmsgArr, appmsgId) {
        for (var i = 0; i < appmsgArr.length; i++) {
            if (appmsgArr[i].id === appmsgId) {
                return i;
            }
        }
        return -1;
    }
    module.exports = AppmsgDialog;
});

define("css/ui-dialog-debug.css", [], function() {
    seajs.importStyle(".ui-dialog{*zoom:1;_float:left;position:relative;background-color:#FFF;border:1px solid #999;border-radius:6px;outline:0;background-clip:padding-box;font-family:Helvetica,arial,sans-serif;font-size:14px;line-height:1.428571429;color:#333;opacity:0;-webkit-transform:scale(0);transform:scale(0);-webkit-transition:-webkit-transform .15s ease-in-out,opacity .15s ease-in-out;transition:transform .15s ease-in-out,opacity .15s ease-in-out}.ui-popup-show .ui-dialog{opacity:1;-webkit-transform:scale(1);transform:scale(1)}.ui-popup-focus .ui-dialog{box-shadow:0 0 8px rgba(0,0,0,.1)}.ui-popup-modal .ui-dialog{box-shadow:0 0 8px rgba(0,0,0,.1),0 0 256px rgba(255,255,255,.3)}.ui-dialog-grid{width:auto;margin:0;border:0 none;border-collapse:collapse;border-spacing:0;background:transparent}.ui-dialog-header,.ui-dialog-body,.ui-dialog-footer{padding:0;border:0 none;text-align:left;background:transparent}.ui-dialog-header{white-space:nowrap;border-bottom:1px solid #E5E5E5}.ui-dialog-close{position:relative;_position:absolute;float:right;top:13px;right:13px;_height:26px;padding:0 4px;font-size:21px;font-weight:700;line-height:1;color:#000;text-shadow:0 1px 0 #FFF;opacity:.2;filter:alpha(opacity=20);cursor:pointer;background:transparent;_background:#FFF;border:0;-webkit-appearance:none}.ui-dialog-close:hover,.ui-dialog-close:focus{color:#000;text-decoration:none;cursor:pointer;outline:0;opacity:.5;filter:alpha(opacity=50)}.ui-dialog-title{margin:0;line-height:1.428571429;min-height:16.428571429px;padding:10px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:700;cursor:default}.ui-dialog-body{padding:20px;text-align:center}.ui-dialog-content{display:inline-block;position:relative;vertical-align:middle;*zoom:1;*display:inline;text-align:left}.ui-dialog-footer{padding:10px 20px}.ui-dialog-statusbar{float:left;margin-right:20px;padding:6px 0;line-height:1.428571429;font-size:14px;color:#888;white-space:nowrap}.ui-dialog-statusbar label:hover{color:#333}.ui-dialog-statusbar input,.ui-dialog-statusbar .label{vertical-align:middle}.ui-dialog-button{float:right;white-space:nowrap}.ui-dialog-footer button+button{margin-bottom:0;margin-left:5px}.ui-dialog-footer button{width:auto;overflow:visible;display:inline-block;padding:6px 12px;_margin-left:5px;margin-bottom:0;font-size:14px;font-weight:400;line-height:1.428571429;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;background-image:none;border:1px solid transparent;border-radius:4px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-o-user-select:none;user-select:none}.ui-dialog-footer button:focus{outline:thin dotted #333;outline:5px auto -webkit-focus-ring-color;outline-offset:-2px}.ui-dialog-footer button:hover,.ui-dialog-footer button:focus{color:#333;text-decoration:none}.ui-dialog-footer button:active{background-image:none;outline:0;-webkit-box-shadow:inset 0 3px 5px rgba(0,0,0,.125);box-shadow:inset 0 3px 5px rgba(0,0,0,.125)}.ui-dialog-footer button[disabled]{pointer-events:none;cursor:not-allowed;opacity:.65;filter:alpha(opacity=65);-webkit-box-shadow:none;box-shadow:none}.ui-dialog-footer button{color:#333;background-color:#fff;border-color:#ccc}.ui-dialog-footer button:hover,.ui-dialog-footer button:focus,.ui-dialog-footer button:active{color:#333;background-color:#ebebeb;border-color:#adadad}.ui-dialog-footer button:active{background-image:none}.ui-dialog-footer button[disabled],.ui-dialog-footer button[disabled]:hover,.ui-dialog-footer button[disabled]:focus,.ui-dialog-footer button[disabled]:active{background-color:#fff;border-color:#ccc}.ui-dialog-footer button.ui-dialog-autofocus{color:#fff;background-color:#428bca;border-color:#357ebd}.ui-dialog-footer button.ui-dialog-autofocus:hover,.ui-dialog-footer button.ui-dialog-autofocus:focus,.ui-dialog-footer button.ui-dialog-autofocus:active{color:#fff;background-color:#3276b1;border-color:#285e8e}.ui-dialog-footer button.ui-dialog-autofocus:active{background-image:none}.ui-popup-top-left .ui-dialog,.ui-popup-top .ui-dialog,.ui-popup-top-right .ui-dialog{top:-8px}.ui-popup-bottom-left .ui-dialog,.ui-popup-bottom .ui-dialog,.ui-popup-bottom-right .ui-dialog{top:8px}.ui-popup-left-top .ui-dialog,.ui-popup-left .ui-dialog,.ui-popup-left-bottom .ui-dialog{left:-8px}.ui-popup-right-top .ui-dialog,.ui-popup-right .ui-dialog,.ui-popup-right-bottom .ui-dialog{left:8px}.ui-dialog-arrow-a,.ui-dialog-arrow-b{position:absolute;display:none;width:0;height:0;overflow:hidden;_color:#FF3FFF;_filter:chroma(color=#FF3FFF);border:8px dashed transparent}.ui-popup-follow .ui-dialog-arrow-a,.ui-popup-follow .ui-dialog-arrow-b{display:block}.ui-popup-top-left .ui-dialog-arrow-a,.ui-popup-top .ui-dialog-arrow-a,.ui-popup-top-right .ui-dialog-arrow-a{bottom:-16px;border-top:8px solid #7C7C7C}.ui-popup-top-left .ui-dialog-arrow-b,.ui-popup-top .ui-dialog-arrow-b,.ui-popup-top-right .ui-dialog-arrow-b{bottom:-15px;border-top:8px solid #fff}.ui-popup-top-left .ui-dialog-arrow-a,.ui-popup-top-left .ui-dialog-arrow-b{left:15px}.ui-popup-top .ui-dialog-arrow-a,.ui-popup-top .ui-dialog-arrow-b{left:50%;margin-left:-8px}.ui-popup-top-right .ui-dialog-arrow-a,.ui-popup-top-right .ui-dialog-arrow-b{right:15px}.ui-popup-bottom-left .ui-dialog-arrow-a,.ui-popup-bottom .ui-dialog-arrow-a,.ui-popup-bottom-right .ui-dialog-arrow-a{top:-16px;border-bottom:8px solid #7C7C7C}.ui-popup-bottom-left .ui-dialog-arrow-b,.ui-popup-bottom .ui-dialog-arrow-b,.ui-popup-bottom-right .ui-dialog-arrow-b{top:-15px;border-bottom:8px solid #fff}.ui-popup-bottom-left .ui-dialog-arrow-a,.ui-popup-bottom-left .ui-dialog-arrow-b{left:15px}.ui-popup-bottom .ui-dialog-arrow-a,.ui-popup-bottom .ui-dialog-arrow-b{margin-left:-8px;left:50%}.ui-popup-bottom-right .ui-dialog-arrow-a,.ui-popup-bottom-right .ui-dialog-arrow-b{right:15px}.ui-popup-left-top .ui-dialog-arrow-a,.ui-popup-left .ui-dialog-arrow-a,.ui-popup-left-bottom .ui-dialog-arrow-a{right:-16px;border-left:8px solid #7C7C7C}.ui-popup-left-top .ui-dialog-arrow-b,.ui-popup-left .ui-dialog-arrow-b,.ui-popup-left-bottom .ui-dialog-arrow-b{right:-15px;border-left:8px solid #fff}.ui-popup-left-top .ui-dialog-arrow-a,.ui-popup-left-top .ui-dialog-arrow-b{top:15px}.ui-popup-left .ui-dialog-arrow-a,.ui-popup-left .ui-dialog-arrow-b{margin-top:-8px;top:50%}.ui-popup-left-bottom .ui-dialog-arrow-a,.ui-popup-left-bottom .ui-dialog-arrow-b{bottom:15px}.ui-popup-right-top .ui-dialog-arrow-a,.ui-popup-right .ui-dialog-arrow-a,.ui-popup-right-bottom .ui-dialog-arrow-a{left:-16px;border-right:8px solid #7C7C7C}.ui-popup-right-top .ui-dialog-arrow-b,.ui-popup-right .ui-dialog-arrow-b,.ui-popup-right-bottom .ui-dialog-arrow-b{left:-15px;border-right:8px solid #fff}.ui-popup-right-top .ui-dialog-arrow-a,.ui-popup-right-top .ui-dialog-arrow-b{top:15px}.ui-popup-right .ui-dialog-arrow-a,.ui-popup-right .ui-dialog-arrow-b{margin-top:-8px;top:50%}.ui-popup-right-bottom .ui-dialog-arrow-a,.ui-popup-right-bottom .ui-dialog-arrow-b{bottom:15px}@-webkit-keyframes ui-dialog-loading{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes ui-dialog-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.ui-dialog-loading{vertical-align:middle;position:relative;display:block;*zoom:1;*display:inline;overflow:hidden;width:32px;height:32px;top:50%;margin:-16px auto 0 auto;font-size:0;text-indent:-999em;color:#666}.ui-dialog-loading{width:100%\\9;text-indent:0\\9;line-height:32px\\9;text-align:center\\9;font-size:12px\\9}.ui-dialog-loading::after{position:absolute;content:'';width:3px;height:3px;margin:14.5px 0 0 14.5px;border-radius:100%;box-shadow:0 -10px 0 1px #ccc,10px 0 #ccc,0 10px #ccc,-10px 0 #ccc,-7px -7px 0 .5px #ccc,7px -7px 0 1.5px #ccc,7px 7px #ccc,-7px 7px #ccc;-webkit-transform:rotate(360deg);-webkit-animation:ui-dialog-loading 1.5s infinite linear;transform:rotate(360deg);animation:ui-dialog-loading 1.5s infinite linear;display:none\\9}");
});

define("css/appmsgdialog-debug.css", [], function() {
    seajs.importStyle(".ui-popup.ui-popup-modal[aria-labelledby*=selectAppmsg]{width:90%;height:100%;bottom:0;min-width:800px}.appmsgdg.ui-dialog,.appmsgdg .ui-dialog-grid,.appmsgdg .ui-dialog-content{width:100%;height:100%}.appmsgdg .ui-dialog-grid>tbody>tr:first-child{height:40px}.appmsgdg .ui-dialog-grid>tbody>tr:nth-child(2){position:absolute;top:40px;bottom:0;width:100%}.appmsgdg .ui-dialog-grid>tbody>tr:nth-child(2)>td{position:absolute;left:0;right:0;top:0;bottom:0}.appmsgdg-bd{height:100%;border-left:0;border-right:0}.appmsgdg-hd{height:47px;padding-top:6px;padding-bottom:6px;padding-left:10px}.appmsgdg-hd .appmsgsearch{width:65%}.appmsgdg-hd .appmsgcreate{font-size:16px;font-weight:700}.appmsgdg-main{position:absolute;top:48px;bottom:40px;width:100%;padding:10px!important;overflow-y:auto}.appmsg-item{min-width:180px}.appmsg-item-bd{position:relative;cursor:pointer}.appmsg-item-bd .appmsg-title{margin-top:5px;margin-bottom:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.appmsg-item-bd .appmsg-thumb-wrp{height:180px;overflow:hidden}.appmsg-item-bd .appmsg-desc{height:45px;padding:5px 0;overflow:hidden;word-wrap:break-word;word-break:break-all}.appmsg-item.selected .selected-mask{position:absolute;width:100%;height:100%;top:0;left:0;cursor:pointer}.appmsg-item.selected .appmsg-mask{width:100%;height:100%;background-color:#000;filter:alpha(opacity=60);-moz-opacity:.6;-khtml-opacity:.6;opacity:.6;z-index:1}.appmsg-item .icon-card-selected{display:none}.appmsg-item.selected .icon-card-selected{display:block;position:absolute;top:50%;left:50%;margin-top:-23px;margin-left:-23px;line-height:999em;overflow:hidden;z-index:1;background:url(/liontech/webApps/manager/img/base_z.png) 0 -6085px no-repeat;width:46px;height:46px;vertical-align:middle}.appmsgdg-ft{position:absolute;bottom:0;left:0;right:0;padding-top:6px;padding-bottom:6px;height:47px}.appmsgdg-ft-btn{position:absolute;top:6px;right:12px;width:230px}.appmsgdg-ft-btn>button{width:110px}");
});

define("tpl/dialog/appmsg_layout-debug.html", [], '<!-- 产品管理弹出层 -->\n<div class="panel panel-default appmsgdg-bd">\n	<div class="panel-heading appmsgdg-hd">\n		<form class="form-inline">\n			<div class="form-group appmsgsearch">\n				<label class="sr-only" for="keyword">keyword</label> <input type="text" class="form-control" id="appmsgSearchInput"\n					placeholder="标题/作者/摘要" style="width: 100%" />\n			</div>\n			<button type="button" id="appmsgSearchBtn" class="btn btn-primary" style="width: 104px">查询</button>\n			<!--<button type="button" class="btn btn-link pull-right appmsgcreate">新建图文消息</button>-->\n		</form>\n	</div>\n	<div class="panel-body appmsgdg-main">\n		<i class="icon_loading_small white js_loading" style="display: none;"></i>\n		<div id="appmsg-content"></div>\n	</div>\n	<div class="panel-footer appmsgdg-ft">\n		<div id="appmsg-pagebar" class="text-center"></div>\n		<div class="appmsgdg-ft-btn">\n			<button id="cancelButton" type="button" class="btn btn-default">取消</button>\n			<button id="okButton" type="button" class="btn btn-primary">确定</button>\n		</div>\n	</div>\n</div>');

define("tpl/dialog/appmsg_list-debug.html", [], '<!-- 产品管理弹出层-列表 --> \n{@each data as it,index}\n<div class="col-xs-3 appmsg-item{@if it.selected} selected{@/if}" data-id="!{it.id}">\n	<div class="thumbnail appmsg-item-bd">\n		<h4 class="appmsg-title">\n			<a href="#">!{it.title}</a>\n		</h4>\n		<div class="appmsg-info">\n			<em class="appmsg-date">!{it.publishtimestr}</em>\n		</div>\n		<div class="appmsg-thumb-wrp">\n			<img src="!{it.thumb}" alt="..." class="img-responsive" data-id="!{it.cover}" />\n		</div>\n		<p class="appmsg-desc">!{it.abstracts}</p>\n		<div class="selected-mask">\n			<div class="appmsg-mask"></div>\n			<i class="icon-card-selected">已选择</i>\n		</div>\n	</div>\n</div>\n{@/each}\n');

/*!
 * artDialog
 * Date: 2014-11-09
 * https://github.com/aui/artDialog
 * (c) 2009-2014 TangBin, http://www.planeArt.cn
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://www.gnu.org/licenses/lgpl-2.1.html
 */
define("lib/dialog/dialog-debug", [ "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug" ], function(require) {
    var Popup = require("lib/dialog/popup-debug");
    var defaults = require("lib/dialog/dialog-config-debug");
    var css = defaults.cssUri;
    // css loader: RequireJS & SeaJS
    if (css) {
        var fn = require[require.toUrl ? "toUrl" : "resolve"];
        if (fn) {
            css = fn(css);
            css = '<link rel="stylesheet" href="' + css + '" />';
            if ($("base")[0]) {
                $("base").before(css);
            } else {
                $("head").append(css);
            }
        }
    }
    var _count = 0;
    var _expando = new Date() - 0;
    // Date.now()
    var _isIE6 = !("minWidth" in $("html")[0].style);
    var _isMobile = "createTouch" in document && !("onmousemove" in document) || /(iPhone|iPad|iPod)/i.test(navigator.userAgent);
    var _isFixed = !_isIE6 && !_isMobile;
    var artDialog = function(options, ok, cancel) {
        var originalOptions = options = options || {};
        if (typeof options === "string" || options.nodeType === 1) {
            options = {
                content: options,
                fixed: !_isMobile
            };
        }
        options = $.extend(true, {}, artDialog.defaults, options);
        options.original = originalOptions;
        var id = options.id = options.id || _expando + _count;
        var api = artDialog.get(id);
        // 如果存在同名的对话框对象，则直接返回
        if (api) {
            return api.focus();
        }
        // 目前主流移动设备对fixed支持不好，禁用此特性
        if (!_isFixed) {
            options.fixed = false;
        }
        // 快捷关闭支持：点击对话框外快速关闭对话框
        if (options.quickClose) {
            options.modal = true;
            options.backdropOpacity = 0;
        }
        // 按钮组
        if (!$.isArray(options.button)) {
            options.button = [];
        }
        // 取消按钮
        if (cancel !== undefined) {
            options.cancel = cancel;
        }
        if (options.cancel) {
            options.button.push({
                id: "cancel",
                value: options.cancelValue,
                callback: options.cancel,
                display: options.cancelDisplay
            });
        }
        // 确定按钮
        if (ok !== undefined) {
            options.ok = ok;
        }
        if (options.ok) {
            options.button.push({
                id: "ok",
                value: options.okValue,
                callback: options.ok,
                autofocus: true
            });
        }
        return artDialog.list[id] = new artDialog.create(options);
    };
    var popup = function() {};
    popup.prototype = Popup.prototype;
    var prototype = artDialog.prototype = new popup();
    artDialog.create = function(options) {
        var that = this;
        $.extend(this, new Popup());
        var originalOptions = options.original;
        var $popup = $(this.node).html(options.innerHTML);
        var $backdrop = $(this.backdrop);
        this.options = options;
        this._popup = $popup;
        $.each(options, function(name, value) {
            if (typeof that[name] === "function") {
                that[name](value);
            } else {
                that[name] = value;
            }
        });
        // 更新 zIndex 全局配置
        if (options.zIndex) {
            Popup.zIndex = options.zIndex;
        }
        // 设置 ARIA 信息
        $popup.attr({
            "aria-labelledby": this._$("title").attr("id", "title:" + this.id).attr("id"),
            "aria-describedby": this._$("content").attr("id", "content:" + this.id).attr("id")
        });
        // 关闭按钮
        this._$("close").css("display", this.cancel === false ? "none" : "").attr("title", this.cancelValue).on("click", function(event) {
            that._trigger("cancel");
            event.preventDefault();
        });
        // 添加视觉参数
        this._$("dialog").addClass(this.skin);
        this._$("body").css("padding", this.padding);
        // 点击任意空白处关闭对话框
        if (options.quickClose) {
            $backdrop.on("onmousedown" in document ? "mousedown" : "click", function() {
                that._trigger("cancel");
                return false;
            });
        }
        // 遮罩设置
        this.addEventListener("show", function() {
            $backdrop.css({
                opacity: 0,
                background: options.backdropBackground
            }).animate({
                opacity: options.backdropOpacity
            }, 150);
        });
        // ESC 快捷键关闭对话框
        this._esc = function(event) {
            var target = event.target;
            var nodeName = target.nodeName;
            var rinput = /^input|textarea$/i;
            var isTop = Popup.current === that;
            var keyCode = event.keyCode;
            // 避免输入状态中 ESC 误操作关闭
            if (!isTop || rinput.test(nodeName) && target.type !== "button") {
                return;
            }
            if (keyCode === 27) {
                that._trigger("cancel");
            }
        };
        $(document).on("keydown", this._esc);
        this.addEventListener("remove", function() {
            $(document).off("keydown", this._esc);
            delete artDialog.list[this.id];
        });
        _count++;
        artDialog.oncreate(this);
        return this;
    };
    artDialog.create.prototype = prototype;
    $.extend(prototype, {
        /**
     * 显示对话框
     * @name artDialog.prototype.show
     * @param   {HTMLElement Object, Event Object}  指定位置（可选）
     */
        /**
     * 显示对话框（模态）
     * @name artDialog.prototype.showModal
     * @param   {HTMLElement Object, Event Object}  指定位置（可选）
     */
        /**
     * 关闭对话框
     * @name artDialog.prototype.close
     * @param   {String, Number}    返回值，可被 onclose 事件收取（可选）
     */
        /**
     * 销毁对话框
     * @name artDialog.prototype.remove
     */
        /**
     * 重置对话框位置
     * @name artDialog.prototype.reset
     */
        /**
     * 让对话框聚焦（同时置顶）
     * @name artDialog.prototype.focus
     */
        /**
     * 让对话框失焦（同时置顶）
     * @name artDialog.prototype.blur
     */
        /**
     * 添加事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     * @name artDialog.prototype.addEventListener
     */
        /**
     * 删除事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     * @name artDialog.prototype.removeEventListener
     */
        /**
     * 对话框显示事件，在 show()、showModal() 执行
     * @name artDialog.prototype.onshow
     * @event
     */
        /**
     * 关闭事件，在 close() 执行
     * @name artDialog.prototype.onclose
     * @event
     */
        /**
     * 销毁前事件，在 remove() 前执行
     * @name artDialog.prototype.onbeforeremove
     * @event
     */
        /**
     * 销毁事件，在 remove() 执行
     * @name artDialog.prototype.onremove
     * @event
     */
        /**
     * 重置事件，在 reset() 执行
     * @name artDialog.prototype.onreset
     * @event
     */
        /**
     * 焦点事件，在 foucs() 执行
     * @name artDialog.prototype.onfocus
     * @event
     */
        /**
     * 失焦事件，在 blur() 执行
     * @name artDialog.prototype.onblur
     * @event
     */
        /**
     * 设置内容
     * @param    {String, HTMLElement}   内容
     */
        content: function(html) {
            var $content = this._$("content");
            // HTMLElement
            if (typeof html === "object") {
                html = $(html);
                $content.empty("").append(html.show());
                this.addEventListener("beforeremove", function() {
                    $("body").append(html.hide());
                });
            } else {
                $content.html(html);
            }
            return this.reset();
        },
        /**
     * 设置标题
     * @param    {String}   标题内容
     */
        title: function(text) {
            this._$("title").text(text);
            this._$("header")[text ? "show" : "hide"]();
            return this;
        },
        /** 设置宽度 */
        width: function(value) {
            this._$("content").css("width", value);
            return this.reset();
        },
        /** 设置高度 */
        height: function(value) {
            this._$("content").css("height", value);
            return this.reset();
        },
        /**
     * 设置按钮组
     * @param   {Array, String}
     * Options: value, callback, autofocus, disabled 
     */
        button: function(args) {
            args = args || [];
            var that = this;
            var html = "";
            var number = 0;
            this.callbacks = {};
            if (typeof args === "string") {
                html = args;
                number++;
            } else {
                $.each(args, function(i, val) {
                    var id = val.id = val.id || val.value;
                    var style = "";
                    that.callbacks[id] = val.callback;
                    if (val.display === false) {
                        style = ' style="display:none"';
                    } else {
                        number++;
                    }
                    html += "<button" + ' type="button"' + ' i-id="' + id + '"' + style + (val.disabled ? " disabled" : "") + (val.autofocus ? ' autofocus class="ui-dialog-autofocus"' : "") + ">" + val.value + "</button>";
                    that._$("button").on("click", "[i-id=" + id + "]", function(event) {
                        var $this = $(this);
                        if (!$this.attr("disabled")) {
                            // IE BUG
                            that._trigger(id);
                        }
                        event.preventDefault();
                    });
                });
            }
            this._$("button").html(html);
            this._$("footer")[number ? "show" : "hide"]();
            return this;
        },
        statusbar: function(html) {
            this._$("statusbar").html(html)[html ? "show" : "hide"]();
            return this;
        },
        _$: function(i) {
            return this._popup.find("[i=" + i + "]");
        },
        // 触发按钮回调函数
        _trigger: function(id) {
            var fn = this.callbacks[id];
            return typeof fn !== "function" || fn.call(this) !== false ? this.close().remove() : this;
        }
    });
    artDialog.oncreate = $.noop;
    /** 获取最顶层的对话框API */
    artDialog.getCurrent = function() {
        return Popup.current;
    };
    /**
 * 根据 ID 获取某对话框 API
 * @param    {String}    对话框 ID
 * @return   {Object}    对话框 API (实例)
 */
    artDialog.get = function(id) {
        return id === undefined ? artDialog.list : artDialog.list[id];
    };
    artDialog.list = {};
    /**
 * 默认配置
 */
    artDialog.defaults = defaults;
    return artDialog;
});

/*!
 * PopupJS
 * Date: 2014-11-09
 * https://github.com/aui/popupjs
 * (c) 2009-2014 TangBin, http://www.planeArt.cn
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://www.gnu.org/licenses/lgpl-2.1.html
 */
define("lib/dialog/popup-debug", [], function(require) {
    var _count = 0;
    var _isIE6 = !("minWidth" in $("html")[0].style);
    var _isFixed = !_isIE6;
    function Popup() {
        this.destroyed = false;
        this.__popup = $("<div />").css({
            display: "none",
            position: "absolute",
            /*
        left: 0,
        top: 0,
        bottom: 'auto',
        right: 'auto',
        margin: 0,
        padding: 0,
        border: '0 none',
        background: 'transparent'
        */
            outline: 0
        }).attr("tabindex", "-1").html(this.innerHTML).appendTo("body");
        this.__backdrop = this.__mask = $("<div />").css({
            opacity: .7,
            background: "#000"
        });
        // 使用 HTMLElement 作为外部接口使用，而不是 jquery 对象
        // 统一的接口利于未来 Popup 移植到其他 DOM 库中
        this.node = this.__popup[0];
        this.backdrop = this.__backdrop[0];
        _count++;
    }
    $.extend(Popup.prototype, {
        /**
     * 初始化完毕事件，在 show()、showModal() 执行
     * @name Popup.prototype.onshow
     * @event
     */
        /**
     * 关闭事件，在 close() 执行
     * @name Popup.prototype.onclose
     * @event
     */
        /**
     * 销毁前事件，在 remove() 前执行
     * @name Popup.prototype.onbeforeremove
     * @event
     */
        /**
     * 销毁事件，在 remove() 执行
     * @name Popup.prototype.onremove
     * @event
     */
        /**
     * 重置事件，在 reset() 执行
     * @name Popup.prototype.onreset
     * @event
     */
        /**
     * 焦点事件，在 foucs() 执行
     * @name Popup.prototype.onfocus
     * @event
     */
        /**
     * 失焦事件，在 blur() 执行
     * @name Popup.prototype.onblur
     * @event
     */
        /** 浮层 DOM 素节点[*] */
        node: null,
        /** 遮罩 DOM 节点[*] */
        backdrop: null,
        /** 是否开启固定定位[*] */
        fixed: false,
        /** 判断对话框是否删除[*] */
        destroyed: true,
        /** 判断对话框是否显示 */
        open: false,
        /** close 返回值 */
        returnValue: "",
        /** 是否自动聚焦 */
        autofocus: true,
        /** 对齐方式[*] */
        align: "bottom left",
        /** 内部的 HTML 字符串 */
        innerHTML: "",
        /** CSS 类名 */
        className: "ui-popup",
        /**
     * 显示浮层
     * @param   {HTMLElement, Event}  指定位置（可选）
     */
        show: function(anchor) {
            if (this.destroyed) {
                return this;
            }
            var that = this;
            var popup = this.__popup;
            var backdrop = this.__backdrop;
            this.__activeElement = this.__getActive();
            this.open = true;
            this.follow = anchor || this.follow;
            // 初始化 show 方法
            if (!this.__ready) {
                popup.addClass(this.className).attr("role", this.modal ? "alertdialog" : "dialog").css("position", this.fixed ? "fixed" : "absolute");
                if (!_isIE6) {
                    $(window).on("resize", $.proxy(this.reset, this));
                }
                // 模态浮层的遮罩
                if (this.modal) {
                    var backdropCss = {
                        position: "fixed",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        userSelect: "none",
                        zIndex: this.zIndex || Popup.zIndex
                    };
                    popup.addClass(this.className + "-modal");
                    if (!_isFixed) {
                        $.extend(backdropCss, {
                            position: "absolute",
                            width: $(window).width() + "px",
                            height: $(document).height() + "px"
                        });
                    }
                    backdrop.css(backdropCss).attr({
                        tabindex: "0"
                    }).on("focus", $.proxy(this.focus, this));
                    // 锁定 tab 的焦点操作
                    this.__mask = backdrop.clone(true).attr("style", "").insertAfter(popup);
                    backdrop.addClass(this.className + "-backdrop").insertBefore(popup);
                    this.__ready = true;
                }
                if (!popup.html()) {
                    popup.html(this.innerHTML);
                }
            }
            popup.addClass(this.className + "-show").show();
            backdrop.show();
            this.reset().focus();
            this.__dispatchEvent("show");
            return this;
        },
        /** 显示模态浮层。参数参见 show() */
        showModal: function() {
            this.modal = true;
            return this.show.apply(this, arguments);
        },
        /** 关闭浮层 */
        close: function(result) {
            if (!this.destroyed && this.open) {
                if (result !== undefined) {
                    this.returnValue = result;
                }
                this.__popup.hide().removeClass(this.className + "-show");
                this.__backdrop.hide();
                this.open = false;
                this.blur();
                // 恢复焦点，照顾键盘操作的用户
                this.__dispatchEvent("close");
            }
            return this;
        },
        /** 销毁浮层 */
        remove: function() {
            if (this.destroyed) {
                return this;
            }
            this.__dispatchEvent("beforeremove");
            if (Popup.current === this) {
                Popup.current = null;
            }
            // 从 DOM 中移除节点
            this.__popup.remove();
            this.__backdrop.remove();
            this.__mask.remove();
            if (!_isIE6) {
                $(window).off("resize", this.reset);
            }
            this.__dispatchEvent("remove");
            for (var i in this) {
                delete this[i];
            }
            return this;
        },
        /** 重置位置 */
        reset: function() {
            var elem = this.follow;
            if (elem) {
                this.__follow(elem);
            } else {
                this.__center();
            }
            this.__dispatchEvent("reset");
            return this;
        },
        /** 让浮层获取焦点 */
        focus: function() {
            var node = this.node;
            var popup = this.__popup;
            var current = Popup.current;
            var index = this.zIndex = Popup.zIndex++;
            if (current && current !== this) {
                current.blur(false);
            }
            // 检查焦点是否在浮层里面
            if (!$.contains(node, this.__getActive())) {
                var autofocus = popup.find("[autofocus]")[0];
                if (!this._autofocus && autofocus) {
                    this._autofocus = true;
                } else {
                    autofocus = node;
                }
                this.__focus(autofocus);
            }
            // 设置叠加高度
            popup.css("zIndex", index);
            //this.__backdrop.css('zIndex', index);
            Popup.current = this;
            popup.addClass(this.className + "-focus");
            this.__dispatchEvent("focus");
            return this;
        },
        /** 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户 */
        blur: function() {
            var activeElement = this.__activeElement;
            var isBlur = arguments[0];
            if (isBlur !== false) {
                this.__focus(activeElement);
            }
            this._autofocus = false;
            this.__popup.removeClass(this.className + "-focus");
            this.__dispatchEvent("blur");
            return this;
        },
        /**
     * 添加事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     */
        addEventListener: function(type, callback) {
            this.__getEventListener(type).push(callback);
            return this;
        },
        /**
     * 删除事件
     * @param   {String}    事件类型
     * @param   {Function}  监听函数
     */
        removeEventListener: function(type, callback) {
            var listeners = this.__getEventListener(type);
            for (var i = 0; i < listeners.length; i++) {
                if (callback === listeners[i]) {
                    listeners.splice(i--, 1);
                }
            }
            return this;
        },
        // 获取事件缓存
        __getEventListener: function(type) {
            var listener = this.__listener;
            if (!listener) {
                listener = this.__listener = {};
            }
            if (!listener[type]) {
                listener[type] = [];
            }
            return listener[type];
        },
        // 派发事件
        __dispatchEvent: function(type) {
            var listeners = this.__getEventListener(type);
            if (this["on" + type]) {
                this["on" + type]();
            }
            for (var i = 0; i < listeners.length; i++) {
                listeners[i].call(this);
            }
        },
        // 对元素安全聚焦
        __focus: function(elem) {
            // 防止 iframe 跨域无权限报错
            // 防止 IE 不可见元素报错
            try {
                // ie11 bug: iframe 页面点击会跳到顶部
                if (this.autofocus && !/^iframe$/i.test(elem.nodeName)) {
                    elem.focus();
                }
            } catch (e) {}
        },
        // 获取当前焦点的元素
        __getActive: function() {
            try {
                // try: ie8~9, iframe #26
                var activeElement = document.activeElement;
                var contentDocument = activeElement.contentDocument;
                var elem = contentDocument && contentDocument.activeElement || activeElement;
                return elem;
            } catch (e) {}
        },
        // 居中浮层
        __center: function() {
            var popup = this.__popup;
            var $window = $(window);
            var $document = $(document);
            var fixed = this.fixed;
            var dl = fixed ? 0 : $document.scrollLeft();
            var dt = fixed ? 0 : $document.scrollTop();
            var ww = $window.width();
            var wh = $window.height();
            var ow = popup.width();
            var oh = popup.height();
            var left = (ww - ow) / 2 + dl;
            var top = (wh - oh) * 382 / 1e3 + dt;
            // 黄金比例
            var style = popup[0].style;
            style.left = Math.max(parseInt(left), dl) + "px";
            style.top = Math.max(parseInt(top), dt) + "px";
        },
        // 指定位置 @param    {HTMLElement, Event}  anchor
        __follow: function(anchor) {
            var $elem = anchor.parentNode && $(anchor);
            var popup = this.__popup;
            if (this.__followSkin) {
                popup.removeClass(this.__followSkin);
            }
            // 隐藏元素不可用
            if ($elem) {
                var o = $elem.offset();
                if (o.left * o.top < 0) {
                    return this.__center();
                }
            }
            var that = this;
            var fixed = this.fixed;
            var $window = $(window);
            var $document = $(document);
            var winWidth = $window.width();
            var winHeight = $window.height();
            var docLeft = $document.scrollLeft();
            var docTop = $document.scrollTop();
            var popupWidth = popup.width();
            var popupHeight = popup.height();
            var width = $elem ? $elem.outerWidth() : 0;
            var height = $elem ? $elem.outerHeight() : 0;
            var offset = this.__offset(anchor);
            var x = offset.left;
            var y = offset.top;
            var left = fixed ? x - docLeft : x;
            var top = fixed ? y - docTop : y;
            var minLeft = fixed ? 0 : docLeft;
            var minTop = fixed ? 0 : docTop;
            var maxLeft = minLeft + winWidth - popupWidth;
            var maxTop = minTop + winHeight - popupHeight;
            var css = {};
            var align = this.align.split(" ");
            var className = this.className + "-";
            var reverse = {
                top: "bottom",
                bottom: "top",
                left: "right",
                right: "left"
            };
            var name = {
                top: "top",
                bottom: "top",
                left: "left",
                right: "left"
            };
            var temp = [ {
                top: top - popupHeight,
                bottom: top + height,
                left: left - popupWidth,
                right: left + width
            }, {
                top: top,
                bottom: top - popupHeight + height,
                left: left,
                right: left - popupWidth + width
            } ];
            var center = {
                left: left + width / 2 - popupWidth / 2,
                top: top + height / 2 - popupHeight / 2
            };
            var range = {
                left: [ minLeft, maxLeft ],
                top: [ minTop, maxTop ]
            };
            // 超出可视区域重新适应位置
            $.each(align, function(i, val) {
                // 超出右或下边界：使用左或者上边对齐
                if (temp[i][val] > range[name[val]][1]) {
                    val = align[i] = reverse[val];
                }
                // 超出左或右边界：使用右或者下边对齐
                if (temp[i][val] < range[name[val]][0]) {
                    align[i] = reverse[val];
                }
            });
            // 一个参数的情况
            if (!align[1]) {
                name[align[1]] = name[align[0]] === "left" ? "top" : "left";
                temp[1][align[1]] = center[name[align[1]]];
            }
            //添加follow的css, 为了给css使用
            className += align.join("-") + " " + this.className + "-follow";
            that.__followSkin = className;
            if ($elem) {
                popup.addClass(className);
            }
            css[name[align[0]]] = parseInt(temp[0][align[0]]);
            css[name[align[1]]] = parseInt(temp[1][align[1]]);
            popup.css(css);
        },
        // 获取元素相对于页面的位置（包括iframe内的元素）
        // 暂时不支持两层以上的 iframe 套嵌
        __offset: function(anchor) {
            var isNode = anchor.parentNode;
            var offset = isNode ? $(anchor).offset() : {
                left: anchor.pageX,
                top: anchor.pageY
            };
            anchor = isNode ? anchor : anchor.target;
            var ownerDocument = anchor.ownerDocument;
            var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;
            if (defaultView == window) {
                // IE <= 8 只能使用两个等于号
                return offset;
            }
            // {Element: Ifarme}
            var frameElement = defaultView.frameElement;
            var $ownerDocument = $(ownerDocument);
            var docLeft = $ownerDocument.scrollLeft();
            var docTop = $ownerDocument.scrollTop();
            var frameOffset = $(frameElement).offset();
            var frameLeft = frameOffset.left;
            var frameTop = frameOffset.top;
            return {
                left: offset.left + frameLeft - docLeft,
                top: offset.top + frameTop - docTop
            };
        }
    });
    /** 当前叠加高度 */
    Popup.zIndex = 1024;
    /** 顶层浮层的实例 */
    Popup.current = null;
    return Popup;
});

// artDialog - 默认配置
define("lib/dialog/dialog-config-debug", [], {
    /* -----已注释的配置继承自 popup.js，仍可以再这里重新定义它----- */
    // 对齐方式
    //align: 'bottom left',
    // 是否固定定位
    //fixed: false,
    // 对话框叠加高度值(重要：此值不能超过浏览器最大限制)
    //zIndex: 1024,
    // 设置遮罩背景颜色
    backdropBackground: "#000",
    // 设置遮罩透明度
    backdropOpacity: .7,
    // 消息内容
    content: '<span class="ui-dialog-loading">Loading..</span>',
    // 标题
    title: "",
    // 对话框状态栏区域 HTML 代码
    statusbar: "",
    // 自定义按钮
    button: null,
    // 确定按钮回调函数
    ok: null,
    // 取消按钮回调函数
    cancel: null,
    // 确定按钮文本
    okValue: "ok",
    // 取消按钮文本
    cancelValue: "cancel",
    cancelDisplay: true,
    // 内容宽度
    width: "",
    // 内容高度
    height: "",
    // 内容与边界填充距离
    padding: "",
    // 对话框自定义 className
    skin: "",
    // 是否支持快捷关闭（点击遮罩层自动关闭）
    quickClose: false,
    // css 文件路径，留空则不会使用 js 自动加载样式
    // 注意：css 只允许加载一个
    cssUri: "",
    // 模板（使用 table 解决 IE7 宽度自适应的 BUG）
    // js 使用 i="***" 属性识别结构，其余的均可自定义
    innerHTML: '<div i="dialog" class="ui-dialog">' + '<div class="ui-dialog-arrow-a"></div>' + '<div class="ui-dialog-arrow-b"></div>' + '<table class="ui-dialog-grid">' + "<tr>" + '<td i="header" class="ui-dialog-header">' + '<button i="close" class="ui-dialog-close">&#215;</button>' + '<div i="title" class="ui-dialog-title"></div>' + "</td>" + "</tr>" + "<tr>" + '<td i="body" class="ui-dialog-body">' + '<div i="content" class="ui-dialog-content"></div>' + "</td>" + "</tr>" + "<tr>" + '<td i="footer" class="ui-dialog-footer">' + '<div i="statusbar" class="ui-dialog-statusbar"></div>' + '<div i="button" class="ui-dialog-button"></div>' + "</td>" + "</tr>" + "</table>" + "</div>"
});

/**
 * 分页组件
 */
define("common/pagebar-debug", [], function(require, exports, module) {
    var pageBarTpl = require("tpl/pagebar-debug.html"), pageBarTplCom = juicer(pageBarTpl);
    var defaultOpts = {
        isSimple: false
    };
    var PageBar = function(options) {
        if (!options.totalCount) {
            return;
        }
        this.container = $(options.container);
        this.options = $.extend({}, defaultOpts, options);
        this.init();
    };
    PageBar.prototype = {
        constructor: PageBar,
        init: function() {
            this.initUI();
            this.initEvents();
        },
        initUI: function() {
            var opts = this.options;
            this.pageCount = parseInt((opts.totalCount + opts.pageSize - 1) / opts.pageSize);
            this.container.html(pageBarTplCom.render({
                isSimple: opts.isSimple,
                currPage: 1,
                pagecount: this.pageCount
            }));
            this.pageCount == 1 ? this.container.hide() : this.container.show();
            this.currPage = 1;
            this.pages = this.container.find(".page-nav");
        },
        initEvents: function() {
            var that = this;
            var opts = that.options;
            that.container.on("click", "li a", function() {
                var index = $(this).data("index"), page;
                if (index == "previous") {
                    index = that.currPage - 1;
                } else if (index == "next") {
                    index = that.currPage + 1;
                }
                if (index < 1 || index > that.pageCount) {
                    return;
                }
                if (index === that.currPage) {
                    return;
                }
                for (var i = 0; i < that.pages.length; i++) {
                    page = $(that.pages[i]);
                    page.removeClass("active");
                    if (page.find("a:first-child").data("index") === index) {
                        page.addClass("active");
                    }
                }
                that.currPage = index;
                opts.onCallback && opts.onCallback(index);
            });
        },
        destroy: function() {
            this.container.off("click", "li a");
        }
    };
    module.exports = PageBar;
});

define("tpl/pagebar-debug.html", [], '<!-- 分页组件 -->\n<nav>\n	{@if isSimple}\n	<ul class="pager" style="margin: 0 0">\n		<li><a href="javascript:void(0);" data-index="previous">&laquo;</a></li>\n		<li><a href="javascript:void(0);" data-index="next">&raquo;</a></li>\n	</ul>\n	{@else}\n	<ul class="pagination" style="margin: 0 0">\n		<li class="page-prev"><a href="javascript:void(0);" aria-label="Previous" data-index="previous"> <span\n				aria-hidden="true">&laquo;</span>\n		</a></li> {@each i in range(1, pagecount+1)}\n		<li class="page-nav {@if i==1} active{@/if}"><a href="javascript:void(0);" data-index="!{i}">!{i}</a></li> {@/each}\n		<li class="page-next"><a href="javascript:void(0);" aria-label="Next" data-index="next"> <span\n				aria-hidden="true">&raquo;</span>\n		</a></li>\n	</ul>\n	{@/if}\n</nav>');

define("common/tips-debug", [], function(require, exports, module) {
    var tips = function() {
        this.errMsg = "系统发生错误，请稍后重试";
        this.sucMsg = "操作成功";
        this.delay = 2;
    };
    tips.error = function(msg, onComplete) {
        tip("error", msg || this.errMsg, onComplete);
    };
    tips.success = function(msg, onComplete) {
        tip("success", msg || this.sucMsg, onComplete);
    };
    function tip(type, msg, onComplete) {
        $(".JS_TIPS").remove();
        var template = '<div class="JS_TIPS page_tips !{type}" id="wxTips_' + new Date().getTime() + '"><div class="inner">!{msg}</div></div>';
        var data = {
            type: type || "error",
            msg: msg
        };
        var tt = $(juicer(template, data)).appendTo("body").fadeIn();
        window.setTimeout(function() {
            tt.fadeOut({
                complete: function() {
                    tt.remove();
                    if (onComplete) {
                        onComplete();
                    }
                }
            });
        }, 2e3);
    }
    module.exports = tips;
});

/**
 * 资讯列表对话框
 */
define("common/newsdialog-debug", [ "lib/dialog/dialog-debug", "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug", "common/pagebar-debug", "common/tips-debug" ], function(require, exports, module) {
    require("css/ui-dialog-debug.css");
    require("css/newsdialog-debug.css");
    var newslayoutTpl = require("tpl/dialog/news_layout-debug.html"), newslayoutTplCom = juicer(newslayoutTpl);
    var newslistTpl = require("tpl/dialog/news_list-debug.html"), newslistTplCom = juicer(newslistTpl);
    var dialog = require("lib/dialog/dialog-debug");
    var PageBar = require("common/pagebar-debug");
    var tips = require("common/tips-debug");
    var defaultOpts = {
        pageSize: 12,
        maxSelect: 1
    };
    var NewsDialog = function(opts) {
        this.newsArr = [];
        this.options = opts = $.extend(true, {}, defaultOpts, opts);
        this.init();
    };
    NewsDialog.prototype = {
        constructor: NewsDialog,
        init: function() {
            var $this = this;
            var opts = $this.options;
            $this.dialog = dialog({
                id: "selectNews",
                title: "选择资讯",
                content: newslayoutTplCom.render(),
                padding: 0,
                width: 960,
                fixed: true,
                okValue: "确定",
                ok: function() {
                    if (!$this.newsArr || $this.newsArr.length === 0) {
                        return false;
                    }
                    opts.onOK && opts.onOK($this.newsArr);
                },
                cancelValue: "取消",
                cancel: function() {}
            }).showModal();
            $($this.dialog.node).find(".js_loading").show();
            $this.getNewsList({
                pagesize: opts.pageSize,
                groupId: opts.groupId
            }, function(data) {
                var newsData = data.datalist;
                $this.renderNewsList(newsData, $this.newsArr);
                $this.initEvents();
                $this.initPageBar(data.total);
                $($this.dialog.node).find(".js_loading").hide();
            });
        },
        initEvents: function() {
            var $this = this;
            var options = $this.options;
            var dialog = $($this.dialog.node);
            $("#newsSearchBtn").click(function() {
                var keyword = $("#newsSearchInput").val();
                $($this.dialog.node).find(".js_loading").show();
                $this.getNewsList({
                    pagesize: options.pageSize,
                    keyword: keyword,
                    groupId: options.groupId
                }, function(data) {
                    var newsData = data.datalist;
                    $this.renderNewsList(newsData, $this.newsArr);
                    $this.initPageBar(data.total);
                    $($this.dialog.node).find(".js_loading").hide();
                });
            });
            dialog.on("click", ".newscreate", function() {
                if (!top.LT) {
                    window.open("/liontech/webApps/manager/news_toAdd.action");
                    return;
                }
                var page = top.LT.showPage({
                    url: "/liontech/webApps/manager/news_toAdd.action",
                    title: "新增资讯",
                    width: 900,
                    height: 600,
                    draggable: true,
                    resizable: true,
                    minable: true,
                    maxable: true
                }, function() {
                    page.find("iframe")[0].contentWindow.closeMe = function() {
                        page.close();
                        $("#newsSearchBtn").trigger("click");
                    };
                });
            });
            dialog.on("click", ".news-item", function(event) {
                $(this).find(":checkbox").click();
            });
            dialog.on("click", ".item-check label", function(event) {
                event.stopPropagation();
            });
            dialog.on("change", ".item-check :checkbox", function() {
                var checkbox = $(this), ischecked = checkbox.is(":checked"), itemrow = checkbox.closest(".news-item");
                var id = $(this).data("id"), cover, title, publisher, publishtime;
                cover = $(this).data("cover");
                title = itemrow.find(".item-title").text();
                publisher = itemrow.find(".item-publisher").text();
                publishtime = itemrow.find(".item-publishtimestr").text();
                if (ischecked) {
                    if (options.maxSelect === 1) {
                        var allCheckBox = dialog.find(".news-item .item-check :checkbox");
                        allCheckBox.each(function(i) {
                            if ($(this).val() === checkbox.val()) {
                                return;
                            }
                            if ($(this).is(":checked")) {
                                $(this).attr("checked", false);
                            }
                        });
                        $this.newsArr = [ {
                            id: id,
                            title: title,
                            publisher: publisher,
                            publishtime: publishtime,
                            cover: cover
                        } ];
                    } else {
                        if (options.maxSelect > $this.newsArr.length) {
                            $this.newsArr.push({
                                id: id,
                                title: title,
                                publisher: publisher,
                                publishtime: publishtime,
                                cover: cover
                            });
                        } else {
                            checkbox.attr("checked", false);
                            tips.error("最多可选" + options.maxSelect + "条");
                        }
                    }
                } else {
                    var i = indexOf($this.newsArr, id);
                    if (i >= 0) {
                        $this.newsArr.splice(i, 1);
                    }
                }
            });
        },
        initPageBar: function(newscount) {
            var that = this;
            var newsdg = $(that.dialog.node);
            var opts = that.options;
            that.pagebar && that.pagebar.destroy();
            if (opts.pageSize >= newscount) {
                $("#news-pagebar").empty();
                $("#news-pagebar").hide();
                return;
            }
            that.pagebar = new PageBar({
                container: "#news-pagebar",
                totalCount: newscount,
                pageSize: opts.pageSize,
                onCallback: function(index) {
                    newsdg.find("#news-pagebar").hide();
                    newsdg.find(".js_loading").show();
                    var keyword = $("#newsSearchInput").val();
                    that.getNewsList({
                        keyword: keyword,
                        index: index,
                        pagesize: opts.pageSize,
                        groupId: opts.groupId
                    }, function(data) {
                        var newsData = data.datalist;
                        that.renderNewsList(newsData, that.newsArr);
                        newsdg.find(".js_loading").hide();
                        newsdg.find("#news-pagebar").show();
                    });
                    newsdg.find(".newsdg-main").scrollTop(0);
                }
            });
        },
        getNewsList: function(options, onCallback) {
            options = $.extend({
                index: 1,
                pagesize: 12
            }, options);
            $.getJSON("news_getNewsList.action", options, function(data) {
                data.status !== 1 ? tips.error("资讯列表加载失败！") : onCallback(data);
            });
        },
        renderNewsList: function(datas, newsArr) {
            var coverImageUrlCom = juicer(getCoverImageUrlTpl());
            datas = datas ? datas : [];
            $.each(datas, function(i, n) {
                if (indexOf(newsArr, n.id) !== -1) {
                    n.selected = 1;
                }
                n.imgurl = coverImageUrlCom.render({
                    uuid: n.cover
                });
            });
            $("#news-content").html(newslistTplCom.render({
                data: datas
            }));
        }
    };
    function getCoverImageUrlTpl() {
        return "/liontech/webApps/datastore/thumb.ds?uuid=!{uuid}&accesspointtype=standardweb";
    }
    function indexOf(newsArr, newsId) {
        for (var i = 0; i < newsArr.length; i++) if (newsArr[i].id === newsId) {
            return i;
        }
        return -1;
    }
    module.exports = NewsDialog;
});

define("css/newsdialog-debug.css", [], function() {
    seajs.importStyle(".newsdg-bd{border:0;border-bottom:1px solid #ddd;margin-bottom:0;border-radius:0}.newsdg-bd .newscreate{font-size:16px;font-weight:700}.newsdg-main{overflow-y:auto;height:400px}.news-item{border-bottom:1px solid #ddd;padding-top:10px;padding-bottom:10px;cursor:pointer}.news-item .item-title,.news-item .item-publisher,.news-item .item-publishtimestr{margin-bottom:10px;margin-top:10px}.news-ft{padding-top:6px;padding-bottom:6px}");
});

define("tpl/dialog/news_layout-debug.html", [], '<!-- 资讯选择弹出层 -->\n<div class="panel panel-default newsdg-bd">\n	<div class="panel-heading">\n		<form class="form-inline">\n			<div class="form-group">\n				<label class="sr-only" for="newsSearchInput">newsSearchInput</label> <input type="text" class="form-control"\n					id="newsSearchInput" placeholder="标题" style="width: 350px" />\n			</div>\n			<button type="button" id="newsSearchBtn" class="btn btn-primary" style="width: 104px">查询</button>\n			<button type="button" class="btn btn-link pull-right newscreate">新建资讯</button>\n		</form>\n	</div>\n	<div class="panel-body newsdg-main">\n		<i class="icon_loading_small white js_loading" style="display: none;"></i>\n		<div id="news-content" class="container" style="width: 100%"></div>\n	</div>\n	<div class="panel-footer text-right news-ft" id="news-pagebar"></div>\n</div>');

define("tpl/dialog/news_list-debug.html", [], '<!-- 资讯选择弹出层-列表 -->\n{@each data as news,index}\n<div class="row news-item">\n	<div class="col-xs-1">\n		<div class="checkbox item-check">\n			<label> <input type="checkbox" data-id="!{news.id}" data-cover="!{news.cover}" id="!{news.id}"\n				value="!{news.id}" aria-label="选择" {@if news.selected==1}checked{@/if}>\n			</label>\n		</div>\n	</div>\n	<div class="col-xs-4">\n		<img src="!{news.imgurl}" />\n	</div>\n	<div class="col-xs-3 item-title">!{news.title}</div>\n	<div class="col-xs-2 item-publisher">!{news.publisher}</div>\n	<div class="col-xs-2 item-publishtimestr">!{news.publishtimestr}</div>\n</div>\n{@/each}\n');
