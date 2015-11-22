/**
 * 
 */
define(function(require) {
	var appsmgsendTpl = require("../tpl/appmsg_send.html"), appmsgsendTplCom = juicer(appsmgsendTpl);
	var AppmsgDialog = require("../common/appmsgdialog");
	var NewsDialog = require("../common/newsdialog");
	var tips = require("../common/tips.js");

	var MsgSend = function() {
		this.shares = [];
		this.newsArr = [];
		this.init();
	};

	MsgSend.prototype = {
		constructor : MsgSend,
		init : function() {
			this.initUI();
			this.initEvents();
			this.showFirstTab();
		},
		initUI : function() {
			$(".msgsend-sender").html(appmsgsendTplCom.render({
				sender : senditem
			}));
			this._refreshMsgCol();
		},
		_refreshMsgCol : function(enterpriseNo) {
			var msgCols = [];
			if (!enterpriseNo || enterpriseNo === "") {
				enterpriseNo = "ohmrong";
			}
			msgCols = enterpriseMsgCols[enterpriseNo];
			if (!msgCols || !msgCols.length) {
				$.getJSON("send_getMsgColsByEnterpriseNo.action", {
					enterpriseNo : enterpriseNo
				}, function(data) {
					enterpriseMsgCols[enterpriseNo] = data.msgCols;

					$("#msgcol").html(juicer(getMsgColTpl(), {
						data : enterpriseMsgCols[enterpriseNo]
					}));
				});
			} else {
				$("#msgcol").html(juicer(getMsgColTpl(), {
					data : msgCols
				}));
			}
		},
		initEvents : function() {
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
				} else if (value === 'group') {
					$("#group").attr("disabled", false);
					$("#users").attr("disabled", false);
					if (groupArr.length === 0) {
						$.getJSON("send_getGroupList.action", function(data) {
							var grouplist = data.grouplist;
							$.each(grouplist, function(i, n) {
								groupArr.push({
									id : n.groupId,
									name : n.groupName,
									enterpriseNo : n.enterpriseNo
								});
							});
							$("#group").html(juicer(tpl, {
								data : groupArr
							}));
							$("#group").trigger("change");
						});
					} else {
						$("#group").html(juicer(tpl, {
							data : groupArr
						}));
						$("#group").trigger("change");
					}
				}
			});
			$("#group").change(function() {
				var selGroup, groupId, enterpriseNo;
				selGroup = $(this).find('option:selected');
				groupId = selGroup.val();
				enterpriseNo = selGroup.data("enterpriseNo");
				
				if (groupId && groupId.length) {
					$.getJSON("send_getUserListByGroupId.action", {
						groupid : groupId
					}, function(data) {
						if (data.status === 0) {
							tips.error("加载失败！");
							return;
						}
						var items = [];
						var userlist = data.userlist;
						if (userlist && userlist.length) {
							items.push({
								id : "ALL",
								name : "所有用户"
							});
							$.each(userlist, function(i, n) {
								items.push({
									id : n.userName,
									name : n.userName
								});
							});
						}

						var tpl = getGroupTpl();
						$("#users").html(juicer(tpl, {
							data : items
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
						pageSize : 12,
						maxSelect : 100,
						groupId : $("#group").val(),
						onOK : function(selectItems) {
							var html = juicer("#appmsg-tabcontent", {
								data : selectItems
							});
							$("#appmsgpanel").html(html);
							$send.shares = selectItems;
						}
					});
				} else if (href === "#newspanel") {
					new NewsDialog({
						maxSelect : 10,
						groupId : $("#group").val(),
						onOK : function(newsArr) {
							var coverImageUrlCom = juicer(getCoverImageUrlTpl());
							$.each(newsArr, function(i, n) {
								n.imgurl = coverImageUrlCom.render({uuid:n.cover});
							});
							var html = juicer('#selectnews-list', {
								data : newsArr
							});
							$("#newspanel").html(html);
							$send.newsArr = newsArr;
						}
					});
				}
				$this.tab('show');
				$send.currTab = $this;
			});

			$("#sendBtn").click(function() {
				var datas = $send.getData();
				if (!$send.validate(datas)) {
					return;
				}
				var $btn = $("#sendBtn").button('loading');
				$.post("send_push.action", {
					jsondata : JSON.stringify(datas)
				}, function(data) {
					if (data.status == 1) {
						tips.success("发送成功！");
						$send.clear();
						$send.showFirstTab();
						$btn.button('reset');
					} else {
						tips.error("发送失败！", function() {
							$btn.button('reset');
						});
					}
				}, "json");
			});
		},
		getData : function() {
			var id, tabpanel, msg, title, text, share, news, i;
			if (!this.currTab) {
				tips.error("请选择文字或者图文消息！");
				return null;
			}
			id = this.currTab.attr("href");
			tabpanel = $(id);
			msg = {};
			if (tabpanel.attr("id") === 'textpanel') {
				msg.type = "text";
				msg.content = {};
				title = $("#title").val();
				text = tabpanel.find(".editorarea").text().trim();
				
				msg.content.text = text;
				msg.content.title = title;
			} else if (tabpanel.attr("id") === 'appmsgpanel') {
				msg.type = "share";
				msg.content = [];
				for (i = 0; i < this.shares.length; i++) {
					share = this.shares[i];
					msg.content.push({
						title : share.title,
						desc : share.desc,
						linkId : share.id,
						img : share.thumbid
					});
				}
			} else if (tabpanel.attr("id") === 'newspanel') {
				msg.type = "news";
				msg.content = [];
				for (i = 0; i < this.newsArr.length; i++) {
					news = this.newsArr[i];
					msg.content.push({
						title : news.title,
						linkId : news.id,
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
		validate : function(datas) {
			if (!datas) {
				tips.error("没有数据!");
				return false;
			}
			if (!datas.sender || datas.sender === "-1") {
				tips.error("请选择一个栏目发送");
				return false;
			}
			
			if (datas.type === 'text') {
				if (!datas.content.title.length || datas.content.title.length > 600) {
					tips.error("标题必须为1到32个字");
					return false;
				}
				if (!datas.content.text.length || datas.content.text.length > 600) {
					tips.error("文字必须为1到600个字");
					return false;
				}
			} else if (datas.type === 'share') {
				if (!datas.content || !datas.content.length) {
					tips.error("请选择产品信息");
					return false;
				}
			} else if (datas.type === 'news') {
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
		clear : function() {
			var id = this.currTab.attr("href");
			var tabpanel = $(id);
			if (tabpanel.attr("id") === 'textpanel') {
				$("#title").val("");
				tabpanel.find(".editorarea").text("");
			} else if (tabpanel.attr("id") === 'appmsgpanel') {
				this.shares = [];
				$("#appmsgpanel").html("");
			} else if (tabpanel.attr("id") === 'newspanel') {
				this.newsArr = [];
				$("#newspanel").html("");
			}
		},
		showFirstTab : function() {
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
		tpl.push('{@each data as item,index}');
		tpl.push('<option value="!{item.id}" data-enterprise-No="!{item.enterpriseNo}">!{item.name}</option>');
		tpl.push('{@/each}');
		return tpl.join('');
	}

	function getUserTpl() {
		var tpl = [];
		tpl.push('{@each data as item,index}');
		tpl.push('<option value="!{item.id}">!{item.name}</option>');
		tpl.push('{@/each}');
		return tpl.join('');
	}

	function getSenderTpl() {
		var tpl = [];
		tpl.push('{@each data as item,index}');
		tpl.push('<option value="!{item.id}">!{item.name}</option>');
		tpl.push('{@/each}');
		return tpl.join('');
	}
	
	function getMsgColTpl() {
		var tpl = [];
		tpl.push('<option value="-1">请选择栏目</option>');
		tpl.push('{@each data as item,index}');
		tpl.push('<option value="!{item.id}">!{item.name}</option>');
		tpl.push('{@/each}');
		return tpl.join('');
	}

	new MsgSend();
});