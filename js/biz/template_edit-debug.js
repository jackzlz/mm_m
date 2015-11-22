/**
 * 产品模板管理-编辑界面
 */
define("biz/template_edit-debug", [ "../lib/jquery.form-debug", "../lib/jquery.validate.min-debug", "../lib/messages_zh.min-debug", "../common/tips-debug", "../common/ueditor-debug", "../common/ueditor_custom-debug", "../css/ui-dialog-debug.css", "../lib/dialog/dialog-debug", "../lib/dialog/popup-debug", "../lib/dialog/dialog-config-debug", "../common/imgdialog-debug", "../css/imgdialog-debug.css", "../css/webuploader-debug.css", "../tpl/dialog/img_layout-debug.html", "../tpl/dialog/img_list-debug.html", "../lib/webuploader.min-debug", "../common/pagebar-debug", "../tpl/pagebar-debug.html", "../tpl/template_form-debug.html" ], function(require, exports, module) {
    require("../lib/jquery.form-debug");
    require("../lib/jquery.validate.min-debug");
    require("../lib/messages_zh.min-debug");
    var tips = require("../common/tips-debug");
    var Ueditor = require("../common/ueditor-debug");
    var tpFormTpl = require("../tpl/template_form-debug.html"), tpFormTplCom = juicer(tpFormTpl);
    $.validator.setDefaults({
        // 对隐藏域也进行校验
        ignore: [],
        onsubmit: false,
        highlight: function(element) {
            $(element).closest(".form-group").addClass("has-error");
        },
        unhighlight: function(element) {
            $(element).closest(".form-group").removeClass("has-error");
        },
        errorElement: "span",
        errorClass: "help-block",
        errorPlacement: function(error, element) {
            if (element.parent(".input-group").length) {
                error.insertAfter(element.parent());
            } else {
                error.insertAfter(element);
            }
        }
    });
    var TemplateForm = function() {
        this.init();
    };
    TemplateForm.prototype = {
        constructor: TemplateForm,
        init: function() {
            this.initUI();
            this.initEditor();
            this.initEvents();
            this.initValidates();
            this.setEditorData();
            $("#vote").trigger("change");
        },
        initUI: function() {
            $("#templateForm").html(tpFormTplCom.render(item));
        },
        initEditor: function() {
            this.ueditor = new Ueditor({
                container: "js_editor",
                id: "appmsg_editor"
            });
        },
        initEvents: function() {
            var that = this;
            $("#saveBtn").click(function() {
                // 设置内容信息
                var data = that.getEditorData();
                $("input[name='content']").val(data);
                // 表单校验 OR $("#templateForm").valid()
                if (!that.validator.form()) {
                    tips.error(that.validator.errorList[0].message);
                    that.validator.focusInvalid();
                    return;
                }
                var $btn = $("#saveBtn").button("loading");
                $("#templateForm").ajaxForm({
                    type: "POST",
                    url: "proTemplate_save.action",
                    dataType: "json",
                    success: function(data, status) {
                        if (data.status === 1) {
                            tips.success("保存成功！", function() {
                                $("#templateForm").clearForm(true);
                                $btn.button("reset");
                                window.closeMe && window.closeMe();
                            });
                        } else {
                            tips.error("保存失败！", function() {
                                $btn.button("reset");
                            });
                        }
                    }
                });
                $("#templateForm").submit();
            });
            $("#previewBtn").click(function() {
                var data = that.getEditorData();
                $("input[name='content']").val(data);
                if (!that.validator.form()) {
                    tips.error(that.validator.errorList[0].message);
                    that.validator.focusInvalid();
                    return;
                }
                var win = window.open("proTemplate_toPreview.action");
                win.getPreviewData = function() {
                    var datas = $("#templateForm").serializeArray();
                    var proTemplate = {};
                    for (var i = 0; i < datas.length; i++) {
                        proTemplate[datas[i]["name"]] = datas[i]["value"];
                    }
                    return proTemplate;
                };
            });
        },
        initValidates: function() {
            var validator = $("#templateForm").validate({
                rules: {
                    title: {
                        required: true,
                        maxlength: 64
                    },
                    content: {
                        required: true,
                        maxlength: 1e7,
                        textlength: 2e4
                    }
                },
                messages: {
                    title: {
                        required: "标题不能为空",
                        maxlength: $.validator.format("标题长度不能超过{0}个字")
                    },
                    content: {
                        required: "正文不能为空",
                        maxlength: $.validator.format("正文总大小不得超过10M字节"),
                        textlength: "正文不能为空且长度不能超过20000字"
                    }
                }
            });
            $.validator.addMethod("textlength", function(value, element, params) {
                var length = $(value).text().length;
                return length <= params;
            }, "");
            this.validator = validator;
        },
        getEditorData: function() {
            return this.ueditor.getData();
        },
        setEditorData: function() {
            this.ueditor.setData(item.content);
        }
    };
    new TemplateForm();
});

define("lib/jquery.form-debug", [], function(require, exports, module) {
    (function($) {
        "use strict";
        /*
	    Usage Note:
	    -----------
	    Do not use both ajaxSubmit and ajaxForm on the same form.  These
	    functions are mutually exclusive.  Use ajaxSubmit if you want
	    to bind your own submit handler to the form.  For example,

	    $(document).ready(function() {
	        $('#myForm').on('submit', function(e) {
	            e.preventDefault(); // <-- important
	            $(this).ajaxSubmit({
	                target: '#output'
	            });
	        });
	    });

	    Use ajaxForm when you want the plugin to manage all the event binding
	    for you.  For example,

	    $(document).ready(function() {
	        $('#myForm').ajaxForm({
	            target: '#output'
	        });
	    });
	    
	    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
	    form does not have to exist when you invoke ajaxForm:

	    $('#myForm').ajaxForm({
	        delegation: true,
	        target: '#output'
	    });
	    
	    When using ajaxForm, the ajaxSubmit function will be invoked for you
	    at the appropriate time.
	*/
        /**
	 * Feature detection
	 */
        var feature = {};
        feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
        feature.formdata = window.FormData !== undefined;
        /**
	 * ajaxSubmit() provides a mechanism for immediately submitting
	 * an HTML form using AJAX.
	 */
        $.fn.ajaxSubmit = function(options) {
            /*jshint scripturl:true */
            // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
            if (!this.length) {
                log("ajaxSubmit: skipping submit process - no element selected");
                return this;
            }
            var method, action, url, $form = this;
            if (typeof options == "function") {
                options = {
                    success: options
                };
            }
            method = this.attr("method");
            action = this.attr("action");
            url = typeof action === "string" ? $.trim(action) : "";
            url = url || window.location.href || "";
            if (url) {
                // clean url (don't include hash vaue)
                url = (url.match(/^([^#]+)/) || [])[1];
            }
            options = $.extend(true, {
                url: url,
                success: $.ajaxSettings.success,
                type: method || "GET",
                iframeSrc: /^https/i.test(window.location.href || "") ? "javascript:false" : "about:blank"
            }, options);
            // hook for manipulating the form data before it is extracted;
            // convenient for use with rich editors like tinyMCE or FCKEditor
            var veto = {};
            this.trigger("form-pre-serialize", [ this, options, veto ]);
            if (veto.veto) {
                log("ajaxSubmit: submit vetoed via form-pre-serialize trigger");
                return this;
            }
            // provide opportunity to alter form data before it is serialized
            if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
                log("ajaxSubmit: submit aborted via beforeSerialize callback");
                return this;
            }
            var traditional = options.traditional;
            if (traditional === undefined) {
                traditional = $.ajaxSettings.traditional;
            }
            var elements = [];
            var qx, a = this.formToArray(options.semantic, elements);
            if (options.data) {
                options.extraData = options.data;
                qx = $.param(options.data, traditional);
            }
            // give pre-submit callback an opportunity to abort the submit
            if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
                log("ajaxSubmit: submit aborted via beforeSubmit callback");
                return this;
            }
            // fire vetoable 'validate' event
            this.trigger("form-submit-validate", [ a, this, options, veto ]);
            if (veto.veto) {
                log("ajaxSubmit: submit vetoed via form-submit-validate trigger");
                return this;
            }
            var q = $.param(a, traditional);
            if (qx) {
                q = q ? q + "&" + qx : qx;
            }
            if (options.type.toUpperCase() == "GET") {
                options.url += (options.url.indexOf("?") >= 0 ? "&" : "?") + q;
                options.data = null;
            } else {
                options.data = q;
            }
            var callbacks = [];
            if (options.resetForm) {
                callbacks.push(function() {
                    $form.resetForm();
                });
            }
            if (options.clearForm) {
                callbacks.push(function() {
                    $form.clearForm(options.includeHidden);
                });
            }
            // perform a load on the target only if dataType is not provided
            if (!options.dataType && options.target) {
                var oldSuccess = options.success || function() {};
                callbacks.push(function(data) {
                    var fn = options.replaceTarget ? "replaceWith" : "html";
                    $(options.target)[fn](data).each(oldSuccess, arguments);
                });
            } else if (options.success) {
                callbacks.push(options.success);
            }
            options.success = function(data, status, xhr) {
                // jQuery 1.4+ passes xhr as 3rd arg
                var context = options.context || options;
                // jQuery 1.4+ supports scope context 
                for (var i = 0, max = callbacks.length; i < max; i++) {
                    callbacks[i].apply(context, [ data, status, xhr || $form, $form ]);
                }
            };
            // are there files to upload?
            var fileInputs = $("input:file:enabled[value]", this);
            // [value] (issue #113)
            var hasFileInputs = fileInputs.length > 0;
            var mp = "multipart/form-data";
            var multipart = $form.attr("enctype") == mp || $form.attr("encoding") == mp;
            var fileAPI = feature.fileapi && feature.formdata;
            log("fileAPI :" + fileAPI);
            var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;
            // options.iframe allows user to force iframe mode
            // 06-NOV-09: now defaulting to iframe mode if file input is detected
            if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
                // hack to fix Safari hang (thanks to Tim Molendijk for this)
                // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
                if (options.closeKeepAlive) {
                    $.get(options.closeKeepAlive, function() {
                        fileUploadIframe(a);
                    });
                } else {
                    fileUploadIframe(a);
                }
            } else if ((hasFileInputs || multipart) && fileAPI) {
                fileUploadXhr(a);
            } else {
                $.ajax(options);
            }
            // clear element array
            for (var k = 0; k < elements.length; k++) elements[k] = null;
            // fire 'notify' event
            this.trigger("form-submit-notify", [ this, options ]);
            return this;
            // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
            function fileUploadXhr(a) {
                var formdata = new FormData();
                for (var i = 0; i < a.length; i++) {
                    formdata.append(a[i].name, a[i].value);
                }
                if (options.extraData) {
                    for (var p in options.extraData) if (options.extraData.hasOwnProperty(p)) formdata.append(p, options.extraData[p]);
                }
                options.data = null;
                var s = $.extend(true, {}, $.ajaxSettings, options, {
                    contentType: false,
                    processData: false,
                    cache: false,
                    type: "POST"
                });
                if (options.uploadProgress) {
                    // workaround because jqXHR does not expose upload property
                    s.xhr = function() {
                        var xhr = jQuery.ajaxSettings.xhr();
                        if (xhr.upload) {
                            xhr.upload.onprogress = function(event) {
                                var percent = 0;
                                var position = event.loaded || event.position;
                                /*event.position is deprecated*/
                                var total = event.total;
                                if (event.lengthComputable) {
                                    percent = Math.ceil(position / total * 100);
                                }
                                options.uploadProgress(event, position, total, percent);
                            };
                        }
                        return xhr;
                    };
                }
                s.data = null;
                var beforeSend = s.beforeSend;
                s.beforeSend = function(xhr, o) {
                    o.data = formdata;
                    if (beforeSend) beforeSend.call(o, xhr, options);
                };
                $.ajax(s);
            }
            // private function for handling file uploads (hat tip to YAHOO!)
            function fileUploadIframe(a) {
                var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
                var useProp = !!$.fn.prop;
                if ($(":input[name=submit],:input[id=submit]", form).length) {
                    // if there is an input with a name or id of 'submit' then we won't be
                    // able to invoke the submit fn on the form (at least not x-browser)
                    alert('Error: Form elements must not have name or id of "submit".');
                    return;
                }
                if (a) {
                    // ensure that every serialized input is still enabled
                    for (i = 0; i < elements.length; i++) {
                        el = $(elements[i]);
                        if (useProp) el.prop("disabled", false); else el.removeAttr("disabled");
                    }
                }
                s = $.extend(true, {}, $.ajaxSettings, options);
                s.context = s.context || s;
                id = "jqFormIO" + new Date().getTime();
                if (s.iframeTarget) {
                    $io = $(s.iframeTarget);
                    n = $io.attr("name");
                    if (!n) $io.attr("name", id); else id = n;
                } else {
                    $io = $('<iframe name="' + id + '" src="' + s.iframeSrc + '" />');
                    $io.css({
                        position: "absolute",
                        top: "-1000px",
                        left: "-1000px"
                    });
                }
                io = $io[0];
                xhr = {
                    // mock object
                    aborted: 0,
                    responseText: null,
                    responseXML: null,
                    status: 0,
                    statusText: "n/a",
                    getAllResponseHeaders: function() {},
                    getResponseHeader: function() {},
                    setRequestHeader: function() {},
                    abort: function(status) {
                        var e = status === "timeout" ? "timeout" : "aborted";
                        log("aborting upload... " + e);
                        this.aborted = 1;
                        $io.attr("src", s.iframeSrc);
                        // abort op in progress
                        xhr.error = e;
                        if (s.error) s.error.call(s.context, xhr, e, status);
                        if (g) $.event.trigger("ajaxError", [ xhr, s, e ]);
                        if (s.complete) s.complete.call(s.context, xhr, e);
                    }
                };
                g = s.global;
                // trigger ajax global events so that activity/block indicators work like normal
                if (g && 0 === $.active++) {
                    $.event.trigger("ajaxStart");
                }
                if (g) {
                    $.event.trigger("ajaxSend", [ xhr, s ]);
                }
                if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
                    if (s.global) {
                        $.active--;
                    }
                    return;
                }
                if (xhr.aborted) {
                    return;
                }
                // add submitting element to data if we know it
                sub = form.clk;
                if (sub) {
                    n = sub.name;
                    if (n && !sub.disabled) {
                        s.extraData = s.extraData || {};
                        s.extraData[n] = sub.value;
                        if (sub.type == "image") {
                            s.extraData[n + ".x"] = form.clk_x;
                            s.extraData[n + ".y"] = form.clk_y;
                        }
                    }
                }
                var CLIENT_TIMEOUT_ABORT = 1;
                var SERVER_ABORT = 2;
                function getDoc(frame) {
                    var doc = frame.contentWindow ? frame.contentWindow.document : frame.contentDocument ? frame.contentDocument : frame.document;
                    return doc;
                }
                // Rails CSRF hack (thanks to Yvan Barthelemy)
                var csrf_token = $("meta[name=csrf-token]").attr("content");
                var csrf_param = $("meta[name=csrf-param]").attr("content");
                if (csrf_param && csrf_token) {
                    s.extraData = s.extraData || {};
                    s.extraData[csrf_param] = csrf_token;
                }
                // take a breath so that pending repaints get some cpu time before the upload starts
                function doSubmit() {
                    // make sure form attrs are set
                    var t = $form.attr("target"), a = $form.attr("action");
                    // update form attrs in IE friendly way
                    form.setAttribute("target", id);
                    if (!method) {
                        form.setAttribute("method", "POST");
                    }
                    if (a != s.url) {
                        form.setAttribute("action", s.url);
                    }
                    // ie borks in some cases when setting encoding
                    if (!s.skipEncodingOverride && (!method || /post/i.test(method))) {
                        $form.attr({
                            encoding: "multipart/form-data",
                            enctype: "multipart/form-data"
                        });
                    }
                    // support timout
                    if (s.timeout) {
                        timeoutHandle = setTimeout(function() {
                            timedOut = true;
                            cb(CLIENT_TIMEOUT_ABORT);
                        }, s.timeout);
                    }
                    // look for server aborts
                    function checkState() {
                        try {
                            var state = getDoc(io).readyState;
                            log("state = " + state);
                            if (state && state.toLowerCase() == "uninitialized") setTimeout(checkState, 50);
                        } catch (e) {
                            log("Server abort: ", e, " (", e.name, ")");
                            cb(SERVER_ABORT);
                            if (timeoutHandle) clearTimeout(timeoutHandle);
                            timeoutHandle = undefined;
                        }
                    }
                    // add "extra" data to form if provided in options
                    var extraInputs = [];
                    try {
                        if (s.extraData) {
                            for (var n in s.extraData) {
                                if (s.extraData.hasOwnProperty(n)) {
                                    extraInputs.push($('<input type="hidden" name="' + n + '">').attr("value", s.extraData[n]).appendTo(form)[0]);
                                }
                            }
                        }
                        if (!s.iframeTarget) {
                            // add iframe to doc and submit the form
                            $io.appendTo("body");
                            if (io.attachEvent) io.attachEvent("onload", cb); else io.addEventListener("load", cb, false);
                        }
                        setTimeout(checkState, 15);
                        form.submit();
                    } finally {
                        // reset attrs and remove "extra" input elements
                        form.setAttribute("action", a);
                        if (t) {
                            form.setAttribute("target", t);
                        } else {
                            $form.removeAttr("target");
                        }
                        $(extraInputs).remove();
                    }
                }
                if (s.forceSync) {
                    doSubmit();
                } else {
                    setTimeout(doSubmit, 10);
                }
                var data, doc, domCheckCount = 50, callbackProcessed;
                function cb(e) {
                    if (xhr.aborted || callbackProcessed) {
                        return;
                    }
                    try {
                        doc = getDoc(io);
                    } catch (ex) {
                        log("cannot access response document: ", ex);
                        e = SERVER_ABORT;
                    }
                    if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                        xhr.abort("timeout");
                        return;
                    } else if (e == SERVER_ABORT && xhr) {
                        xhr.abort("server abort");
                        return;
                    }
                    if (!doc || doc.location.href == s.iframeSrc) {
                        // response not received yet
                        if (!timedOut) return;
                    }
                    if (io.detachEvent) io.detachEvent("onload", cb); else io.removeEventListener("load", cb, false);
                    var status = "success", errMsg;
                    try {
                        if (timedOut) {
                            throw "timeout";
                        }
                        var isXml = s.dataType == "xml" || doc.XMLDocument || $.isXMLDoc(doc);
                        log("isXml=" + isXml);
                        if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                            if (--domCheckCount) {
                                // in some browsers (Opera) the iframe DOM is not always traversable when
                                // the onload callback fires, so we loop a bit to accommodate
                                log("requeing onLoad callback, DOM not available");
                                setTimeout(cb, 250);
                                return;
                            }
                        }
                        //log('response detected');
                        var docRoot = doc.body ? doc.body : doc.documentElement;
                        xhr.responseText = docRoot ? docRoot.innerHTML : null;
                        xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                        if (isXml) s.dataType = "xml";
                        xhr.getResponseHeader = function(header) {
                            var headers = {
                                "content-type": s.dataType
                            };
                            return headers[header];
                        };
                        // support for XHR 'status' & 'statusText' emulation :
                        if (docRoot) {
                            xhr.status = Number(docRoot.getAttribute("status")) || xhr.status;
                            xhr.statusText = docRoot.getAttribute("statusText") || xhr.statusText;
                        }
                        var dt = (s.dataType || "").toLowerCase();
                        var scr = /(json|script|text)/.test(dt);
                        if (scr || s.textarea) {
                            // see if user embedded response in textarea
                            var ta = doc.getElementsByTagName("textarea")[0];
                            if (ta) {
                                xhr.responseText = ta.value;
                                // support for XHR 'status' & 'statusText' emulation :
                                xhr.status = Number(ta.getAttribute("status")) || xhr.status;
                                xhr.statusText = ta.getAttribute("statusText") || xhr.statusText;
                            } else if (scr) {
                                // account for browsers injecting pre around json response
                                var pre = doc.getElementsByTagName("pre")[0];
                                var b = doc.getElementsByTagName("body")[0];
                                if (pre) {
                                    xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                                } else if (b) {
                                    xhr.responseText = b.textContent ? b.textContent : b.innerText;
                                }
                            }
                        } else if (dt == "xml" && !xhr.responseXML && xhr.responseText) {
                            xhr.responseXML = toXml(xhr.responseText);
                        }
                        try {
                            data = httpData(xhr, dt, s);
                        } catch (e) {
                            status = "parsererror";
                            xhr.error = errMsg = e || status;
                        }
                    } catch (e) {
                        log("error caught: ", e);
                        status = "error";
                        xhr.error = errMsg = e || status;
                    }
                    if (xhr.aborted) {
                        log("upload aborted");
                        status = null;
                    }
                    if (xhr.status) {
                        // we've set xhr.status
                        status = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ? "success" : "error";
                    }
                    // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
                    if (status === "success") {
                        if (s.success) s.success.call(s.context, data, "success", xhr);
                        if (g) $.event.trigger("ajaxSuccess", [ xhr, s ]);
                    } else if (status) {
                        if (errMsg === undefined) errMsg = xhr.statusText;
                        if (s.error) s.error.call(s.context, xhr, status, errMsg);
                        if (g) $.event.trigger("ajaxError", [ xhr, s, errMsg ]);
                    }
                    if (g) $.event.trigger("ajaxComplete", [ xhr, s ]);
                    if (g && !--$.active) {
                        $.event.trigger("ajaxStop");
                    }
                    if (s.complete) s.complete.call(s.context, xhr, status);
                    callbackProcessed = true;
                    if (s.timeout) clearTimeout(timeoutHandle);
                    // clean up
                    setTimeout(function() {
                        if (!s.iframeTarget) $io.remove();
                        xhr.responseXML = null;
                    }, 100);
                }
                var toXml = $.parseXML || function(s, doc) {
                    // use parseXML if available (jQuery 1.5+)
                    if (window.ActiveXObject) {
                        doc = new ActiveXObject("Microsoft.XMLDOM");
                        doc.async = "false";
                        doc.loadXML(s);
                    } else {
                        doc = new DOMParser().parseFromString(s, "text/xml");
                    }
                    return doc && doc.documentElement && doc.documentElement.nodeName != "parsererror" ? doc : null;
                };
                var parseJSON = $.parseJSON || function(s) {
                    /*jslint evil:true */
                    return window["eval"]("(" + s + ")");
                };
                var httpData = function(xhr, type, s) {
                    // mostly lifted from jq1.4.4
                    var ct = xhr.getResponseHeader("content-type") || "", xml = type === "xml" || !type && ct.indexOf("xml") >= 0, data = xml ? xhr.responseXML : xhr.responseText;
                    if (xml && data.documentElement.nodeName === "parsererror") {
                        if ($.error) $.error("parsererror");
                    }
                    if (s && s.dataFilter) {
                        data = s.dataFilter(data, type);
                    }
                    if (typeof data === "string") {
                        if (type === "json" || !type && ct.indexOf("json") >= 0) {
                            data = parseJSON(data);
                        } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                            $.globalEval(data);
                        }
                    }
                    return data;
                };
            }
        };
        /**
	 * ajaxForm() provides a mechanism for fully automating form submission.
	 *
	 * The advantages of using this method instead of ajaxSubmit() are:
	 *
	 * 1: This method will include coordinates for <input type="image" /> elements (if the element
	 *    is used to submit the form).
	 * 2. This method will include the submit element's name/value data (for the element that was
	 *    used to submit the form).
	 * 3. This method binds the submit() method to the form for you.
	 *
	 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
	 * passes the options argument along after properly binding events for submit elements and
	 * the form itself.
	 */
        $.fn.ajaxForm = function(options) {
            options = options || {};
            options.delegation = options.delegation && $.isFunction($.fn.on);
            // in jQuery 1.3+ we can fix mistakes with the ready state
            if (!options.delegation && this.length === 0) {
                var o = {
                    s: this.selector,
                    c: this.context
                };
                if (!$.isReady && o.s) {
                    log("DOM not ready, queuing ajaxForm");
                    $(function() {
                        $(o.s, o.c).ajaxForm(options);
                    });
                    return this;
                }
                // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
                log("terminating; zero elements found by selector" + ($.isReady ? "" : " (DOM not ready)"));
                return this;
            }
            if (options.delegation) {
                $(document).off("submit.form-plugin", this.selector, doAjaxSubmit).off("click.form-plugin", this.selector, captureSubmittingElement).on("submit.form-plugin", this.selector, options, doAjaxSubmit).on("click.form-plugin", this.selector, options, captureSubmittingElement);
                return this;
            }
            return this.ajaxFormUnbind().bind("submit.form-plugin", options, doAjaxSubmit).bind("click.form-plugin", options, captureSubmittingElement);
        };
        // private event handlers    
        function doAjaxSubmit(e) {
            /*jshint validthis:true */
            var options = e.data;
            if (!e.isDefaultPrevented()) {
                // if event has been canceled, don't proceed
                e.preventDefault();
                $(this).ajaxSubmit(options);
            }
        }
        function captureSubmittingElement(e) {
            /*jshint validthis:true */
            var target = e.target;
            var $el = $(target);
            if (!$el.is(":submit,input:image")) {
                // is this a child element of the submit el?  (ex: a span within a button)
                var t = $el.closest(":submit");
                if (t.length === 0) {
                    return;
                }
                target = t[0];
            }
            var form = this;
            form.clk = target;
            if (target.type == "image") {
                if (e.offsetX !== undefined) {
                    form.clk_x = e.offsetX;
                    form.clk_y = e.offsetY;
                } else if (typeof $.fn.offset == "function") {
                    var offset = $el.offset();
                    form.clk_x = e.pageX - offset.left;
                    form.clk_y = e.pageY - offset.top;
                } else {
                    form.clk_x = e.pageX - target.offsetLeft;
                    form.clk_y = e.pageY - target.offsetTop;
                }
            }
            // clear form vars
            setTimeout(function() {
                form.clk = form.clk_x = form.clk_y = null;
            }, 100);
        }
        // ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
        $.fn.ajaxFormUnbind = function() {
            return this.unbind("submit.form-plugin click.form-plugin");
        };
        /**
	 * formToArray() gathers form element data into an array of objects that can
	 * be passed to any of the following ajax functions: $.get, $.post, or load.
	 * Each object in the array has both a 'name' and 'value' property.  An example of
	 * an array for a simple login form might be:
	 *
	 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
	 *
	 * It is this array that is passed to pre-submit callback functions provided to the
	 * ajaxSubmit() and ajaxForm() methods.
	 */
        $.fn.formToArray = function(semantic, elements) {
            var a = [];
            if (this.length === 0) {
                return a;
            }
            var form = this[0];
            var els = semantic ? form.getElementsByTagName("*") : form.elements;
            if (!els) {
                return a;
            }
            var i, j, n, v, el, max, jmax;
            for (i = 0, max = els.length; i < max; i++) {
                el = els[i];
                n = el.name;
                if (!n) {
                    continue;
                }
                if (semantic && form.clk && el.type == "image") {
                    // handle image inputs on the fly when semantic == true
                    if (!el.disabled && form.clk == el) {
                        a.push({
                            name: n,
                            value: $(el).val(),
                            type: el.type
                        });
                        a.push({
                            name: n + ".x",
                            value: form.clk_x
                        }, {
                            name: n + ".y",
                            value: form.clk_y
                        });
                    }
                    continue;
                }
                v = $.fieldValue(el, true);
                if (v && v.constructor == Array) {
                    if (elements) elements.push(el);
                    for (j = 0, jmax = v.length; j < jmax; j++) {
                        a.push({
                            name: n,
                            value: v[j]
                        });
                    }
                } else if (feature.fileapi && el.type == "file" && !el.disabled) {
                    if (elements) elements.push(el);
                    var files = el.files;
                    if (files.length) {
                        for (j = 0; j < files.length; j++) {
                            a.push({
                                name: n,
                                value: files[j],
                                type: el.type
                            });
                        }
                    } else {
                        // #180
                        a.push({
                            name: n,
                            value: "",
                            type: el.type
                        });
                    }
                } else if (v !== null && typeof v != "undefined") {
                    if (elements) elements.push(el);
                    a.push({
                        name: n,
                        value: v,
                        type: el.type,
                        required: el.required
                    });
                }
            }
            if (!semantic && form.clk) {
                // input type=='image' are not found in elements array! handle it here
                var $input = $(form.clk), input = $input[0];
                n = input.name;
                if (n && !input.disabled && input.type == "image") {
                    a.push({
                        name: n,
                        value: $input.val()
                    });
                    a.push({
                        name: n + ".x",
                        value: form.clk_x
                    }, {
                        name: n + ".y",
                        value: form.clk_y
                    });
                }
            }
            return a;
        };
        /**
	 * Serializes form data into a 'submittable' string. This method will return a string
	 * in the format: name1=value1&amp;name2=value2
	 */
        $.fn.formSerialize = function(semantic) {
            //hand off to jQuery.param for proper encoding
            return $.param(this.formToArray(semantic));
        };
        /**
	 * Serializes all field elements in the jQuery object into a query string.
	 * This method will return a string in the format: name1=value1&amp;name2=value2
	 */
        $.fn.fieldSerialize = function(successful) {
            var a = [];
            this.each(function() {
                var n = this.name;
                if (!n) {
                    return;
                }
                var v = $.fieldValue(this, successful);
                if (v && v.constructor == Array) {
                    for (var i = 0, max = v.length; i < max; i++) {
                        a.push({
                            name: n,
                            value: v[i]
                        });
                    }
                } else if (v !== null && typeof v != "undefined") {
                    a.push({
                        name: this.name,
                        value: v
                    });
                }
            });
            //hand off to jQuery.param for proper encoding
            return $.param(a);
        };
        /**
	 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
	 *
	 *  <form><fieldset>
	 *      <input name="A" type="text" />
	 *      <input name="A" type="text" />
	 *      <input name="B" type="checkbox" value="B1" />
	 *      <input name="B" type="checkbox" value="B2"/>
	 *      <input name="C" type="radio" value="C1" />
	 *      <input name="C" type="radio" value="C2" />
	 *  </fieldset></form>
	 *
	 *  var v = $(':text').fieldValue();
	 *  // if no values are entered into the text inputs
	 *  v == ['','']
	 *  // if values entered into the text inputs are 'foo' and 'bar'
	 *  v == ['foo','bar']
	 *
	 *  var v = $(':checkbox').fieldValue();
	 *  // if neither checkbox is checked
	 *  v === undefined
	 *  // if both checkboxes are checked
	 *  v == ['B1', 'B2']
	 *
	 *  var v = $(':radio').fieldValue();
	 *  // if neither radio is checked
	 *  v === undefined
	 *  // if first radio is checked
	 *  v == ['C1']
	 *
	 * The successful argument controls whether or not the field element must be 'successful'
	 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
	 * The default value of the successful argument is true.  If this value is false the value(s)
	 * for each element is returned.
	 *
	 * Note: This method *always* returns an array.  If no valid value can be determined the
	 *    array will be empty, otherwise it will contain one or more values.
	 */
        $.fn.fieldValue = function(successful) {
            for (var val = [], i = 0, max = this.length; i < max; i++) {
                var el = this[i];
                var v = $.fieldValue(el, successful);
                if (v === null || typeof v == "undefined" || v.constructor == Array && !v.length) {
                    continue;
                }
                if (v.constructor == Array) $.merge(val, v); else val.push(v);
            }
            return val;
        };
        /**
	 * Returns the value of the field element.
	 */
        $.fieldValue = function(el, successful) {
            var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
            if (successful === undefined) {
                successful = true;
            }
            if (successful && (!n || el.disabled || t == "reset" || t == "button" || (t == "checkbox" || t == "radio") && !el.checked || (t == "submit" || t == "image") && el.form && el.form.clk != el || tag == "select" && el.selectedIndex == -1)) {
                return null;
            }
            if (tag == "select") {
                var index = el.selectedIndex;
                if (index < 0) {
                    return null;
                }
                var a = [], ops = el.options;
                var one = t == "select-one";
                var max = one ? index + 1 : ops.length;
                for (var i = one ? index : 0; i < max; i++) {
                    var op = ops[i];
                    if (op.selected) {
                        var v = op.value;
                        if (!v) {
                            // extra pain for IE...
                            v = op.attributes && op.attributes["value"] && !op.attributes["value"].specified ? op.text : op.value;
                        }
                        if (one) {
                            return v;
                        }
                        a.push(v);
                    }
                }
                return a;
            }
            return $(el).val();
        };
        /**
	 * Clears the form data.  Takes the following actions on the form's input fields:
	 *  - input text fields will have their 'value' property set to the empty string
	 *  - select elements will have their 'selectedIndex' property set to -1
	 *  - checkbox and radio inputs will have their 'checked' property set to false
	 *  - inputs of type submit, button, reset, and hidden will *not* be effected
	 *  - button elements will *not* be effected
	 */
        $.fn.clearForm = function(includeHidden) {
            return this.each(function() {
                $("input,select,textarea", this).clearFields(includeHidden);
            });
        };
        /**
	 * Clears the selected form elements.
	 */
        $.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
            var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;
            // 'hidden' is not in this list
            return this.each(function() {
                var t = this.type, tag = this.tagName.toLowerCase();
                if (re.test(t) || tag == "textarea") {
                    this.value = "";
                } else if (t == "checkbox" || t == "radio") {
                    this.checked = false;
                } else if (tag == "select") {
                    this.selectedIndex = -1;
                } else if (includeHidden) {
                    // includeHidden can be the valud true, or it can be a selector string
                    // indicating a special test; for example:
                    //  $('#myForm').clearForm('.special:hidden')
                    // the above would clean hidden inputs that have the class of 'special'
                    if (includeHidden === true && /hidden/.test(t) || typeof includeHidden == "string" && $(this).is(includeHidden)) this.value = "";
                }
            });
        };
        /**
	 * Resets the form data.  Causes all form elements to be reset to their original value.
	 */
        $.fn.resetForm = function() {
            return this.each(function() {
                // guard against an input with the name of 'reset'
                // note that IE reports the reset function as an 'object'
                if (typeof this.reset == "function" || typeof this.reset == "object" && !this.reset.nodeType) {
                    this.reset();
                }
            });
        };
        /**
	 * Enables or disables any matching elements.
	 */
        $.fn.enable = function(b) {
            if (b === undefined) {
                b = true;
            }
            return this.each(function() {
                this.disabled = !b;
            });
        };
        /**
	 * Checks/unchecks any matching checkboxes or radio buttons and
	 * selects/deselects and matching option elements.
	 */
        $.fn.selected = function(select) {
            if (select === undefined) {
                select = true;
            }
            return this.each(function() {
                var t = this.type;
                if (t == "checkbox" || t == "radio") {
                    this.checked = select;
                } else if (this.tagName.toLowerCase() == "option") {
                    var $sel = $(this).parent("select");
                    if (select && $sel[0] && $sel[0].type == "select-one") {
                        // deselect all other options
                        $sel.find("option").selected(false);
                    }
                    this.selected = select;
                }
            });
        };
        // expose debug var
        $.fn.ajaxSubmit.debug = false;
        // helper fn for console logging
        function log() {
            if (!$.fn.ajaxSubmit.debug) return;
            var msg = "[jquery.form] " + Array.prototype.join.call(arguments, "");
            if (window.console && window.console.log) {
                window.console.log(msg);
            } else if (window.opera && window.opera.postError) {
                window.opera.postError(msg);
            }
        }
    })(jQuery);
});

define("lib/jquery.validate.min-debug", [], function(require, exports, module) {
    /*! jQuery Validation Plugin - v1.13.1 - 10/14/2014
	 * http://jqueryvalidation.org/
	 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
    !function(a) {
        "function" == typeof define && define.amd ? define([ "jquery" ], a) : a(jQuery);
    }(function(a) {
        a.extend(a.fn, {
            validate: function(b) {
                if (!this.length) return void (b && b.debug && window.console && console.warn("Nothing selected, can't validate, returning nothing."));
                var c = a.data(this[0], "validator");
                return c ? c : (this.attr("novalidate", "novalidate"), c = new a.validator(b, this[0]), 
                a.data(this[0], "validator", c), c.settings.onsubmit && (this.validateDelegate(":submit", "click", function(b) {
                    c.settings.submitHandler && (c.submitButton = b.target), a(b.target).hasClass("cancel") && (c.cancelSubmit = !0), 
                    void 0 !== a(b.target).attr("formnovalidate") && (c.cancelSubmit = !0);
                }), this.submit(function(b) {
                    function d() {
                        var d, e;
                        return c.settings.submitHandler ? (c.submitButton && (d = a("<input type='hidden'/>").attr("name", c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)), 
                        e = c.settings.submitHandler.call(c, c.currentForm, b), c.submitButton && d.remove(), 
                        void 0 !== e ? e : !1) : !0;
                    }
                    return c.settings.debug && b.preventDefault(), c.cancelSubmit ? (c.cancelSubmit = !1, 
                    d()) : c.form() ? c.pendingRequest ? (c.formSubmitted = !0, !1) : d() : (c.focusInvalid(), 
                    !1);
                })), c);
            },
            valid: function() {
                var b, c;
                return a(this[0]).is("form") ? b = this.validate().form() : (b = !0, c = a(this[0].form).validate(), 
                this.each(function() {
                    b = c.element(this) && b;
                })), b;
            },
            removeAttrs: function(b) {
                var c = {}, d = this;
                return a.each(b.split(/\s/), function(a, b) {
                    c[b] = d.attr(b), d.removeAttr(b);
                }), c;
            },
            rules: function(b, c) {
                var d, e, f, g, h, i, j = this[0];
                if (b) switch (d = a.data(j.form, "validator").settings, e = d.rules, f = a.validator.staticRules(j), 
                b) {
                  case "add":
                    a.extend(f, a.validator.normalizeRule(c)), delete f.messages, e[j.name] = f, c.messages && (d.messages[j.name] = a.extend(d.messages[j.name], c.messages));
                    break;

                  case "remove":
                    return c ? (i = {}, a.each(c.split(/\s/), function(b, c) {
                        i[c] = f[c], delete f[c], "required" === c && a(j).removeAttr("aria-required");
                    }), i) : (delete e[j.name], f);
                }
                return g = a.validator.normalizeRules(a.extend({}, a.validator.classRules(j), a.validator.attributeRules(j), a.validator.dataRules(j), a.validator.staticRules(j)), j), 
                g.required && (h = g.required, delete g.required, g = a.extend({
                    required: h
                }, g), a(j).attr("aria-required", "true")), g.remote && (h = g.remote, delete g.remote, 
                g = a.extend(g, {
                    remote: h
                })), g;
            }
        }), a.extend(a.expr[":"], {
            blank: function(b) {
                return !a.trim("" + a(b).val());
            },
            filled: function(b) {
                return !!a.trim("" + a(b).val());
            },
            unchecked: function(b) {
                return !a(b).prop("checked");
            }
        }), a.validator = function(b, c) {
            this.settings = a.extend(!0, {}, a.validator.defaults, b), this.currentForm = c, 
            this.init();
        }, a.validator.format = function(b, c) {
            return 1 === arguments.length ? function() {
                var c = a.makeArray(arguments);
                return c.unshift(b), a.validator.format.apply(this, c);
            } : (arguments.length > 2 && c.constructor !== Array && (c = a.makeArray(arguments).slice(1)), 
            c.constructor !== Array && (c = [ c ]), a.each(c, function(a, c) {
                b = b.replace(new RegExp("\\{" + a + "\\}", "g"), function() {
                    return c;
                });
            }), b);
        }, a.extend(a.validator, {
            defaults: {
                messages: {},
                groups: {},
                rules: {},
                errorClass: "error",
                validClass: "valid",
                errorElement: "label",
                focusCleanup: !1,
                focusInvalid: !0,
                errorContainer: a([]),
                errorLabelContainer: a([]),
                onsubmit: !0,
                ignore: ":hidden",
                ignoreTitle: !1,
                onfocusin: function(a) {
                    this.lastActive = a, this.settings.focusCleanup && (this.settings.unhighlight && this.settings.unhighlight.call(this, a, this.settings.errorClass, this.settings.validClass), 
                    this.hideThese(this.errorsFor(a)));
                },
                onfocusout: function(a) {
                    this.checkable(a) || !(a.name in this.submitted) && this.optional(a) || this.element(a);
                },
                onkeyup: function(a, b) {
                    (9 !== b.which || "" !== this.elementValue(a)) && (a.name in this.submitted || a === this.lastElement) && this.element(a);
                },
                onclick: function(a) {
                    a.name in this.submitted ? this.element(a) : a.parentNode.name in this.submitted && this.element(a.parentNode);
                },
                highlight: function(b, c, d) {
                    "radio" === b.type ? this.findByName(b.name).addClass(c).removeClass(d) : a(b).addClass(c).removeClass(d);
                },
                unhighlight: function(b, c, d) {
                    "radio" === b.type ? this.findByName(b.name).removeClass(c).addClass(d) : a(b).removeClass(c).addClass(d);
                }
            },
            setDefaults: function(b) {
                a.extend(a.validator.defaults, b);
            },
            messages: {
                required: "This field is required.",
                remote: "Please fix this field.",
                email: "Please enter a valid email address.",
                url: "Please enter a valid URL.",
                date: "Please enter a valid date.",
                dateISO: "Please enter a valid date ( ISO ).",
                number: "Please enter a valid number.",
                digits: "Please enter only digits.",
                creditcard: "Please enter a valid credit card number.",
                equalTo: "Please enter the same value again.",
                maxlength: a.validator.format("Please enter no more than {0} characters."),
                minlength: a.validator.format("Please enter at least {0} characters."),
                rangelength: a.validator.format("Please enter a value between {0} and {1} characters long."),
                range: a.validator.format("Please enter a value between {0} and {1}."),
                max: a.validator.format("Please enter a value less than or equal to {0}."),
                min: a.validator.format("Please enter a value greater than or equal to {0}.")
            },
            autoCreateRanges: !1,
            prototype: {
                init: function() {
                    function b(b) {
                        var c = a.data(this[0].form, "validator"), d = "on" + b.type.replace(/^validate/, ""), e = c.settings;
                        e[d] && !this.is(e.ignore) && e[d].call(c, this[0], b);
                    }
                    this.labelContainer = a(this.settings.errorLabelContainer), this.errorContext = this.labelContainer.length && this.labelContainer || a(this.currentForm), 
                    this.containers = a(this.settings.errorContainer).add(this.settings.errorLabelContainer), 
                    this.submitted = {}, this.valueCache = {}, this.pendingRequest = 0, this.pending = {}, 
                    this.invalid = {}, this.reset();
                    var c, d = this.groups = {};
                    a.each(this.settings.groups, function(b, c) {
                        "string" == typeof c && (c = c.split(/\s/)), a.each(c, function(a, c) {
                            d[c] = b;
                        });
                    }), c = this.settings.rules, a.each(c, function(b, d) {
                        c[b] = a.validator.normalizeRule(d);
                    }), a(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'] ,[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], [type='radio'], [type='checkbox']", "focusin focusout keyup", b).validateDelegate("select, option, [type='radio'], [type='checkbox']", "click", b), 
                    this.settings.invalidHandler && a(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler), 
                    a(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required", "true");
                },
                form: function() {
                    return this.checkForm(), a.extend(this.submitted, this.errorMap), this.invalid = a.extend({}, this.errorMap), 
                    this.valid() || a(this.currentForm).triggerHandler("invalid-form", [ this ]), this.showErrors(), 
                    this.valid();
                },
                checkForm: function() {
                    this.prepareForm();
                    for (var a = 0, b = this.currentElements = this.elements(); b[a]; a++) this.check(b[a]);
                    return this.valid();
                },
                element: function(b) {
                    var c = this.clean(b), d = this.validationTargetFor(c), e = !0;
                    return this.lastElement = d, void 0 === d ? delete this.invalid[c.name] : (this.prepareElement(d), 
                    this.currentElements = a(d), e = this.check(d) !== !1, e ? delete this.invalid[d.name] : this.invalid[d.name] = !0), 
                    a(b).attr("aria-invalid", !e), this.numberOfInvalids() || (this.toHide = this.toHide.add(this.containers)), 
                    this.showErrors(), e;
                },
                showErrors: function(b) {
                    if (b) {
                        a.extend(this.errorMap, b), this.errorList = [];
                        for (var c in b) this.errorList.push({
                            message: b[c],
                            element: this.findByName(c)[0]
                        });
                        this.successList = a.grep(this.successList, function(a) {
                            return !(a.name in b);
                        });
                    }
                    this.settings.showErrors ? this.settings.showErrors.call(this, this.errorMap, this.errorList) : this.defaultShowErrors();
                },
                resetForm: function() {
                    a.fn.resetForm && a(this.currentForm).resetForm(), this.submitted = {}, this.lastElement = null, 
                    this.prepareForm(), this.hideErrors(), this.elements().removeClass(this.settings.errorClass).removeData("previousValue").removeAttr("aria-invalid");
                },
                numberOfInvalids: function() {
                    return this.objectLength(this.invalid);
                },
                objectLength: function(a) {
                    var b, c = 0;
                    for (b in a) c++;
                    return c;
                },
                hideErrors: function() {
                    this.hideThese(this.toHide);
                },
                hideThese: function(a) {
                    a.not(this.containers).text(""), this.addWrapper(a).hide();
                },
                valid: function() {
                    return 0 === this.size();
                },
                size: function() {
                    return this.errorList.length;
                },
                focusInvalid: function() {
                    if (this.settings.focusInvalid) try {
                        a(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").focus().trigger("focusin");
                    } catch (b) {}
                },
                findLastActive: function() {
                    var b = this.lastActive;
                    return b && 1 === a.grep(this.errorList, function(a) {
                        return a.element.name === b.name;
                    }).length && b;
                },
                elements: function() {
                    var b = this, c = {};
                    return a(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled], [readonly]").not(this.settings.ignore).filter(function() {
                        return !this.name && b.settings.debug && window.console && console.error("%o has no name assigned", this), 
                        this.name in c || !b.objectLength(a(this).rules()) ? !1 : (c[this.name] = !0, !0);
                    });
                },
                clean: function(b) {
                    return a(b)[0];
                },
                errors: function() {
                    var b = this.settings.errorClass.split(" ").join(".");
                    return a(this.settings.errorElement + "." + b, this.errorContext);
                },
                reset: function() {
                    this.successList = [], this.errorList = [], this.errorMap = {}, this.toShow = a([]), 
                    this.toHide = a([]), this.currentElements = a([]);
                },
                prepareForm: function() {
                    this.reset(), this.toHide = this.errors().add(this.containers);
                },
                prepareElement: function(a) {
                    this.reset(), this.toHide = this.errorsFor(a);
                },
                elementValue: function(b) {
                    var c, d = a(b), e = b.type;
                    return "radio" === e || "checkbox" === e ? a("input[name='" + b.name + "']:checked").val() : "number" === e && "undefined" != typeof b.validity ? b.validity.badInput ? !1 : d.val() : (c = d.val(), 
                    "string" == typeof c ? c.replace(/\r/g, "") : c);
                },
                check: function(b) {
                    b = this.validationTargetFor(this.clean(b));
                    var c, d, e, f = a(b).rules(), g = a.map(f, function(a, b) {
                        return b;
                    }).length, h = !1, i = this.elementValue(b);
                    for (d in f) {
                        e = {
                            method: d,
                            parameters: f[d]
                        };
                        try {
                            if (c = a.validator.methods[d].call(this, i, b, e.parameters), "dependency-mismatch" === c && 1 === g) {
                                h = !0;
                                continue;
                            }
                            if (h = !1, "pending" === c) return void (this.toHide = this.toHide.not(this.errorsFor(b)));
                            if (!c) return this.formatAndAdd(b, e), !1;
                        } catch (j) {
                            throw this.settings.debug && window.console && console.log("Exception occurred when checking element " + b.id + ", check the '" + e.method + "' method.", j), 
                            j;
                        }
                    }
                    if (!h) return this.objectLength(f) && this.successList.push(b), !0;
                },
                customDataMessage: function(b, c) {
                    return a(b).data("msg" + c.charAt(0).toUpperCase() + c.substring(1).toLowerCase()) || a(b).data("msg");
                },
                customMessage: function(a, b) {
                    var c = this.settings.messages[a];
                    return c && (c.constructor === String ? c : c[b]);
                },
                findDefined: function() {
                    for (var a = 0; a < arguments.length; a++) if (void 0 !== arguments[a]) return arguments[a];
                    return void 0;
                },
                defaultMessage: function(b, c) {
                    return this.findDefined(this.customMessage(b.name, c), this.customDataMessage(b, c), !this.settings.ignoreTitle && b.title || void 0, a.validator.messages[c], "<strong>Warning: No message defined for " + b.name + "</strong>");
                },
                formatAndAdd: function(b, c) {
                    var d = this.defaultMessage(b, c.method), e = /\$?\{(\d+)\}/g;
                    "function" == typeof d ? d = d.call(this, c.parameters, b) : e.test(d) && (d = a.validator.format(d.replace(e, "{$1}"), c.parameters)), 
                    this.errorList.push({
                        message: d,
                        element: b,
                        method: c.method
                    }), this.errorMap[b.name] = d, this.submitted[b.name] = d;
                },
                addWrapper: function(a) {
                    return this.settings.wrapper && (a = a.add(a.parent(this.settings.wrapper))), a;
                },
                defaultShowErrors: function() {
                    var a, b, c;
                    for (a = 0; this.errorList[a]; a++) c = this.errorList[a], this.settings.highlight && this.settings.highlight.call(this, c.element, this.settings.errorClass, this.settings.validClass), 
                    this.showLabel(c.element, c.message);
                    if (this.errorList.length && (this.toShow = this.toShow.add(this.containers)), this.settings.success) for (a = 0; this.successList[a]; a++) this.showLabel(this.successList[a]);
                    if (this.settings.unhighlight) for (a = 0, b = this.validElements(); b[a]; a++) this.settings.unhighlight.call(this, b[a], this.settings.errorClass, this.settings.validClass);
                    this.toHide = this.toHide.not(this.toShow), this.hideErrors(), this.addWrapper(this.toShow).show();
                },
                validElements: function() {
                    return this.currentElements.not(this.invalidElements());
                },
                invalidElements: function() {
                    return a(this.errorList).map(function() {
                        return this.element;
                    });
                },
                showLabel: function(b, c) {
                    var d, e, f, g = this.errorsFor(b), h = this.idOrName(b), i = a(b).attr("aria-describedby");
                    g.length ? (g.removeClass(this.settings.validClass).addClass(this.settings.errorClass), 
                    g.html(c)) : (g = a("<" + this.settings.errorElement + ">").attr("id", h + "-error").addClass(this.settings.errorClass).html(c || ""), 
                    d = g, this.settings.wrapper && (d = g.hide().show().wrap("<" + this.settings.wrapper + "/>").parent()), 
                    this.labelContainer.length ? this.labelContainer.append(d) : this.settings.errorPlacement ? this.settings.errorPlacement(d, a(b)) : d.insertAfter(b), 
                    g.is("label") ? g.attr("for", h) : 0 === g.parents("label[for='" + h + "']").length && (f = g.attr("id").replace(/(:|\.|\[|\])/g, "\\$1"), 
                    i ? i.match(new RegExp("\\b" + f + "\\b")) || (i += " " + f) : i = f, a(b).attr("aria-describedby", i), 
                    e = this.groups[b.name], e && a.each(this.groups, function(b, c) {
                        c === e && a("[name='" + b + "']", this.currentForm).attr("aria-describedby", g.attr("id"));
                    }))), !c && this.settings.success && (g.text(""), "string" == typeof this.settings.success ? g.addClass(this.settings.success) : this.settings.success(g, b)), 
                    this.toShow = this.toShow.add(g);
                },
                errorsFor: function(b) {
                    var c = this.idOrName(b), d = a(b).attr("aria-describedby"), e = "label[for='" + c + "'], label[for='" + c + "'] *";
                    return d && (e = e + ", #" + d.replace(/\s+/g, ", #")), this.errors().filter(e);
                },
                idOrName: function(a) {
                    return this.groups[a.name] || (this.checkable(a) ? a.name : a.id || a.name);
                },
                validationTargetFor: function(b) {
                    return this.checkable(b) && (b = this.findByName(b.name)), a(b).not(this.settings.ignore)[0];
                },
                checkable: function(a) {
                    return /radio|checkbox/i.test(a.type);
                },
                findByName: function(b) {
                    return a(this.currentForm).find("[name='" + b + "']");
                },
                getLength: function(b, c) {
                    switch (c.nodeName.toLowerCase()) {
                      case "select":
                        return a("option:selected", c).length;

                      case "input":
                        if (this.checkable(c)) return this.findByName(c.name).filter(":checked").length;
                    }
                    return b.length;
                },
                depend: function(a, b) {
                    return this.dependTypes[typeof a] ? this.dependTypes[typeof a](a, b) : !0;
                },
                dependTypes: {
                    "boolean": function(a) {
                        return a;
                    },
                    string: function(b, c) {
                        return !!a(b, c.form).length;
                    },
                    "function": function(a, b) {
                        return a(b);
                    }
                },
                optional: function(b) {
                    var c = this.elementValue(b);
                    return !a.validator.methods.required.call(this, c, b) && "dependency-mismatch";
                },
                startRequest: function(a) {
                    this.pending[a.name] || (this.pendingRequest++, this.pending[a.name] = !0);
                },
                stopRequest: function(b, c) {
                    this.pendingRequest--, this.pendingRequest < 0 && (this.pendingRequest = 0), delete this.pending[b.name], 
                    c && 0 === this.pendingRequest && this.formSubmitted && this.form() ? (a(this.currentForm).submit(), 
                    this.formSubmitted = !1) : !c && 0 === this.pendingRequest && this.formSubmitted && (a(this.currentForm).triggerHandler("invalid-form", [ this ]), 
                    this.formSubmitted = !1);
                },
                previousValue: function(b) {
                    return a.data(b, "previousValue") || a.data(b, "previousValue", {
                        old: null,
                        valid: !0,
                        message: this.defaultMessage(b, "remote")
                    });
                }
            },
            classRuleSettings: {
                required: {
                    required: !0
                },
                email: {
                    email: !0
                },
                url: {
                    url: !0
                },
                date: {
                    date: !0
                },
                dateISO: {
                    dateISO: !0
                },
                number: {
                    number: !0
                },
                digits: {
                    digits: !0
                },
                creditcard: {
                    creditcard: !0
                }
            },
            addClassRules: function(b, c) {
                b.constructor === String ? this.classRuleSettings[b] = c : a.extend(this.classRuleSettings, b);
            },
            classRules: function(b) {
                var c = {}, d = a(b).attr("class");
                return d && a.each(d.split(" "), function() {
                    this in a.validator.classRuleSettings && a.extend(c, a.validator.classRuleSettings[this]);
                }), c;
            },
            attributeRules: function(b) {
                var c, d, e = {}, f = a(b), g = b.getAttribute("type");
                for (c in a.validator.methods) "required" === c ? (d = b.getAttribute(c), "" === d && (d = !0), 
                d = !!d) : d = f.attr(c), /min|max/.test(c) && (null === g || /number|range|text/.test(g)) && (d = Number(d)), 
                d || 0 === d ? e[c] = d : g === c && "range" !== g && (e[c] = !0);
                return e.maxlength && /-1|2147483647|524288/.test(e.maxlength) && delete e.maxlength, 
                e;
            },
            dataRules: function(b) {
                var c, d, e = {}, f = a(b);
                for (c in a.validator.methods) d = f.data("rule" + c.charAt(0).toUpperCase() + c.substring(1).toLowerCase()), 
                void 0 !== d && (e[c] = d);
                return e;
            },
            staticRules: function(b) {
                var c = {}, d = a.data(b.form, "validator");
                return d.settings.rules && (c = a.validator.normalizeRule(d.settings.rules[b.name]) || {}), 
                c;
            },
            normalizeRules: function(b, c) {
                return a.each(b, function(d, e) {
                    if (e === !1) return void delete b[d];
                    if (e.param || e.depends) {
                        var f = !0;
                        switch (typeof e.depends) {
                          case "string":
                            f = !!a(e.depends, c.form).length;
                            break;

                          case "function":
                            f = e.depends.call(c, c);
                        }
                        f ? b[d] = void 0 !== e.param ? e.param : !0 : delete b[d];
                    }
                }), a.each(b, function(d, e) {
                    b[d] = a.isFunction(e) ? e(c) : e;
                }), a.each([ "minlength", "maxlength" ], function() {
                    b[this] && (b[this] = Number(b[this]));
                }), a.each([ "rangelength", "range" ], function() {
                    var c;
                    b[this] && (a.isArray(b[this]) ? b[this] = [ Number(b[this][0]), Number(b[this][1]) ] : "string" == typeof b[this] && (c = b[this].replace(/[\[\]]/g, "").split(/[\s,]+/), 
                    b[this] = [ Number(c[0]), Number(c[1]) ]));
                }), a.validator.autoCreateRanges && (null != b.min && null != b.max && (b.range = [ b.min, b.max ], 
                delete b.min, delete b.max), null != b.minlength && null != b.maxlength && (b.rangelength = [ b.minlength, b.maxlength ], 
                delete b.minlength, delete b.maxlength)), b;
            },
            normalizeRule: function(b) {
                if ("string" == typeof b) {
                    var c = {};
                    a.each(b.split(/\s/), function() {
                        c[this] = !0;
                    }), b = c;
                }
                return b;
            },
            addMethod: function(b, c, d) {
                a.validator.methods[b] = c, a.validator.messages[b] = void 0 !== d ? d : a.validator.messages[b], 
                c.length < 3 && a.validator.addClassRules(b, a.validator.normalizeRule(b));
            },
            methods: {
                required: function(b, c, d) {
                    if (!this.depend(d, c)) return "dependency-mismatch";
                    if ("select" === c.nodeName.toLowerCase()) {
                        var e = a(c).val();
                        return e && e.length > 0;
                    }
                    return this.checkable(c) ? this.getLength(b, c) > 0 : a.trim(b).length > 0;
                },
                email: function(a, b) {
                    return this.optional(b) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a);
                },
                url: function(a, b) {
                    return this.optional(b) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(a);
                },
                date: function(a, b) {
                    return this.optional(b) || !/Invalid|NaN/.test(new Date(a).toString());
                },
                dateISO: function(a, b) {
                    return this.optional(b) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(a);
                },
                number: function(a, b) {
                    return this.optional(b) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a);
                },
                digits: function(a, b) {
                    return this.optional(b) || /^\d+$/.test(a);
                },
                creditcard: function(a, b) {
                    if (this.optional(b)) return "dependency-mismatch";
                    if (/[^0-9 \-]+/.test(a)) return !1;
                    var c, d, e = 0, f = 0, g = !1;
                    if (a = a.replace(/\D/g, ""), a.length < 13 || a.length > 19) return !1;
                    for (c = a.length - 1; c >= 0; c--) d = a.charAt(c), f = parseInt(d, 10), g && (f *= 2) > 9 && (f -= 9), 
                    e += f, g = !g;
                    return e % 10 === 0;
                },
                minlength: function(b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(b, c);
                    return this.optional(c) || e >= d;
                },
                maxlength: function(b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(b, c);
                    return this.optional(c) || d >= e;
                },
                rangelength: function(b, c, d) {
                    var e = a.isArray(b) ? b.length : this.getLength(b, c);
                    return this.optional(c) || e >= d[0] && e <= d[1];
                },
                min: function(a, b, c) {
                    return this.optional(b) || a >= c;
                },
                max: function(a, b, c) {
                    return this.optional(b) || c >= a;
                },
                range: function(a, b, c) {
                    return this.optional(b) || a >= c[0] && a <= c[1];
                },
                equalTo: function(b, c, d) {
                    var e = a(d);
                    return this.settings.onfocusout && e.unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
                        a(c).valid();
                    }), b === e.val();
                },
                remote: function(b, c, d) {
                    if (this.optional(c)) return "dependency-mismatch";
                    var e, f, g = this.previousValue(c);
                    return this.settings.messages[c.name] || (this.settings.messages[c.name] = {}), 
                    g.originalMessage = this.settings.messages[c.name].remote, this.settings.messages[c.name].remote = g.message, 
                    d = "string" == typeof d && {
                        url: d
                    } || d, g.old === b ? g.valid : (g.old = b, e = this, this.startRequest(c), f = {}, 
                    f[c.name] = b, a.ajax(a.extend(!0, {
                        url: d,
                        mode: "abort",
                        port: "validate" + c.name,
                        dataType: "json",
                        data: f,
                        context: e.currentForm,
                        success: function(d) {
                            var f, h, i, j = d === !0 || "true" === d;
                            e.settings.messages[c.name].remote = g.originalMessage, j ? (i = e.formSubmitted, 
                            e.prepareElement(c), e.formSubmitted = i, e.successList.push(c), delete e.invalid[c.name], 
                            e.showErrors()) : (f = {}, h = d || e.defaultMessage(c, "remote"), f[c.name] = g.message = a.isFunction(h) ? h(b) : h, 
                            e.invalid[c.name] = !0, e.showErrors(f)), g.valid = j, e.stopRequest(c, j);
                        }
                    }, d)), "pending");
                }
            }
        }), a.format = function() {
            throw "$.format has been deprecated. Please use $.validator.format instead.";
        };
        var b, c = {};
        a.ajaxPrefilter ? a.ajaxPrefilter(function(a, b, d) {
            var e = a.port;
            "abort" === a.mode && (c[e] && c[e].abort(), c[e] = d);
        }) : (b = a.ajax, a.ajax = function(d) {
            var e = ("mode" in d ? d : a.ajaxSettings).mode, f = ("port" in d ? d : a.ajaxSettings).port;
            return "abort" === e ? (c[f] && c[f].abort(), c[f] = b.apply(this, arguments), c[f]) : b.apply(this, arguments);
        }), a.extend(a.fn, {
            validateDelegate: function(b, c, d) {
                return this.bind(c, function(c) {
                    var e = a(c.target);
                    return e.is(b) ? d.apply(e, arguments) : void 0;
                });
            }
        });
    });
});

define("lib/messages_zh.min-debug", [], function(require, exports, module) {
    /*! jQuery Validation Plugin - v1.13.1 - 10/14/2014
	 * http://jqueryvalidation.org/
	 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
    !function(a) {
        "function" == typeof define && define.amd ? define([ "jquery", "../jquery.validate.min" ], a) : a(jQuery);
    }(function(a) {
        a.extend(a.validator.messages, {
            required: "必须填写",
            remote: "请修正此栏位",
            email: "请输入有效的电子邮件",
            url: "请输入有效的网址",
            date: "请输入有效的日期",
            dateISO: "请输入有效的日期 (YYYY-MM-DD)",
            number: "请输入正确的数字",
            digits: "只可输入数字",
            creditcard: "请输入有效的信用卡号码",
            equalTo: "你的输入不相同",
            extension: "请输入有效的后缀",
            maxlength: a.validator.format("最多 {0} 个字"),
            minlength: a.validator.format("最少 {0} 个字"),
            rangelength: a.validator.format("请输入长度为 {0} 至 {1} 之間的字串"),
            range: a.validator.format("请输入 {0} 至 {1} 之间的数值"),
            max: a.validator.format("请输入不大于 {0} 的数值"),
            min: a.validator.format("请输入不小于 {0} 的数值")
        });
    });
});

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
 * 富文本编辑器
 */
define("common/ueditor-debug", [ "common/ueditor_custom-debug", "lib/dialog/dialog-debug", "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug", "common/imgdialog-debug", "lib/webuploader.min-debug", "common/pagebar-debug", "common/tips-debug" ], function(require, exports, module) {
    require("common/ueditor_custom-debug");
    var tips = require("common/tips-debug");
    var defaultOptions = {
        wordCount: false,
        elementPathEnabled: false
    };
    var Ueditor = function(options) {
        this.options = $.extend(true, {}, defaultOptions, options);
        this.init();
    };
    Ueditor.prototype = {
        constructor: Ueditor,
        init: function() {
            var that = this, opts = that.options;
            that.editor = UE.getEditor(opts.container, opts);
            that.initEvents();
        },
        initEvents: function() {
            var that = this, opts = that.options, editor = that.editor;
            editor.addListener("catchremotesuccess", function() {
                tips.success("内容已上传完成");
            });
            editor.addListener("catchremoteerror", function() {
                tips.error("远程图片抓取失败");
            });
            editor.ready(function() {
                var toolbars = editor.ui.toolbars;
                $("#" + editor.ui.toolbars[0].id).addClass("edui-toolbar-primary");
                $("#" + editor.ui.toolbars[1].id).addClass("edui-toobar-secondary");
                $("#" + opts.id + "_toolbarbox").addClass("show-edui-more");
                for (var i = 0; i < toolbars.length; i++) {
                    var toolbar = toolbars[i];
                    var items = toolbar.items;
                    for (var j = 0; j < items.length; j++) {
                        if (items[j] instanceof UE.ui.Combox || items[j] instanceof UE.ui.SplitButton) {
                            $("#" + items[j].id + "_state").tooltip({
                                container: "body"
                            });
                        } else if (items[j] instanceof UE.ui.Button || items[j] instanceof UE.ui.MenuButton) {
                            $("#" + items[j].id + "_body").tooltip({
                                container: "body"
                            });
                        }
                    }
                }
            });
        },
        getData: function() {
            var data = this.editor.getContent();
            if (data.length) {
                data = data.replace(/<p><iframe(.*?)class=\"embed-responsive-item\"(.*?)<\/iframe><\/p>/g, '<div class="embed-responsive embed-responsive-16by9"><iframe$1class="embed-responsive-item"$2</iframe></div>');
                data = data.replace(/<img(.*?)\s+src="/g, '<img$1 class="img-responsive" src="');
                data = data.replace(/webApps\/datastore\/openSource.ds/g, "webApps/public/datastore/openSource.ds");
            }
            return data;
        },
        setData: function(content) {
            var that = this;
            that.editor.ready(function() {
                if (content) {
                    var patt = /<div(.*?)class=\"embed-responsive embed-responsive-16by9\"(.*?)(<iframe(.*?)\/iframe>)(.*?)\/div>/g;
                    content = content.replace(patt, "$3");
                    content = content.replace(/<img(.*?)class=\"img-responsive\"/g, "<img$1");
                    content = content.replace(/webApps\/public\/datastore\/openSource.ds/g, "webApps/datastore/openSource.ds");
                    that.editor.setContent(content);
                }
            });
        }
    };
    module.exports = Ueditor;
});

define("common/ueditor_custom-debug", [ "lib/dialog/dialog-debug", "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug", "common/imgdialog-debug", "lib/webuploader.min-debug", "common/pagebar-debug", "common/tips-debug" ], function(require, exports, module) {
    require("css/ui-dialog-debug.css");
    var artDialog = require("lib/dialog/dialog-debug"), ImgDialog = require("common/imgdialog-debug"), tips = require("common/tips-debug");
    var videoTplCom = juicer(getVideoTpl());
    function moreBtnOnClick(editor) {
        var e = editor.ui.getDom("toolbarbox");
        if (UE.dom.domUtils.hasClass(e, "show-edui-more")) {
            UE.dom.domUtils.removeClasses(e, "show-edui-more");
        } else {
            UE.dom.domUtils.addClass(e, "show-edui-more");
        }
    }
    function insertVideo2BtnOnClick(editor) {
        var d = artDialog({
            title: "请输入视频地址",
            width: 500,
            content: '<input type="text" class="form-control" id="videourl" autofocus placeholder="请输入视频地址" />',
            okValue: "确定",
            ok: function() {
                var url = $("#videourl").val();
                if (!url) {
                    tips.error("请输入地址");
                    return false;
                }
                // 匹配iframe标签必须有src属性
                var patt = /<iframe.*src="{1}\w+:\/\/[^/:]+(:\d*)?[^#]*.*<\/iframe>/;
                if (!patt.test(url)) {
                    tips.error("请复制视频网站的通用代码（包含iframe）");
                    return false;
                }
                // 匹配iframe中的src
                var urlpatt = /\w+:\/\/[^/:]+(:\d*)?[^#"]*/;
                var srcs = url.match(urlpatt);
                if (!srcs || srcs.length === 0) {
                    tips.error("请输入正确的视频地址");
                    return false;
                }
                editor.execCommand("inserthtml", videoTplCom.render({
                    content: srcs[0]
                }).trim());
            },
            cancelValue: "取消",
            cancel: function() {}
        });
        d.showModal();
    }
    function getVideoTpl() {
        return '<iframe class="embed-responsive-item" src="!{content}"></iframe>';
    }
    function insertImage2BtnOnClick(editor) {
        document.body.style.overflow = "hidden";
        new ImgDialog({
            maxSelect: 100,
            onOK: function(imgArr) {
                editor.execCommand("insertimage", $.map(imgArr, function(n) {
                    return n.src = n._src = n.imgurl.replace("thumb", "openSource"), n;
                }));
                document.body.style.overflow = "auto";
            },
            onCancel: function() {
                document.body.style.overflow = "auto";
            }
        });
    }
    // 更多
    UE.registerUI("more", function(editor, uiName) {
        // 注册按钮执行时的command命令，使用命令默认就会带有回退操作
        editor.registerCommand(uiName, {
            execCommand: function() {
                moreBtnOnClick(editor);
            }
        });
        var btn = new UE.ui.Button({
            name: uiName,
            title: "更多",
            cssRules: "",
            onclick: function() {
                editor.execCommand(uiName);
            }
        });
        return btn;
    });
    // 插入视频
    UE.registerUI("insertvideo2", function(editor, uiName) {
        editor.registerCommand(uiName, {
            execCommand: function() {
                insertVideo2BtnOnClick(editor);
            }
        });
        var btn = new UE.ui.Button({
            name: uiName,
            title: "视频",
            cssRules: "",
            onclick: function() {
                editor.execCommand(uiName);
            }
        });
        return btn;
    });
    // 插入图片
    UE.registerUI("insertimage2", function(editor, uiName) {
        editor.registerCommand(uiName, {
            execCommand: function() {
                insertImage2BtnOnClick(editor);
            }
        });
        var btn = new UE.ui.Button({
            name: uiName,
            title: "图片",
            cssRules: "",
            onclick: function() {
                editor.execCommand(uiName);
            }
        });
        return btn;
    });
});

define("css/ui-dialog-debug.css", [], function() {
    seajs.importStyle(".ui-dialog{*zoom:1;_float:left;position:relative;background-color:#FFF;border:1px solid #999;border-radius:6px;outline:0;background-clip:padding-box;font-family:Helvetica,arial,sans-serif;font-size:14px;line-height:1.428571429;color:#333;opacity:0;-webkit-transform:scale(0);transform:scale(0);-webkit-transition:-webkit-transform .15s ease-in-out,opacity .15s ease-in-out;transition:transform .15s ease-in-out,opacity .15s ease-in-out}.ui-popup-show .ui-dialog{opacity:1;-webkit-transform:scale(1);transform:scale(1)}.ui-popup-focus .ui-dialog{box-shadow:0 0 8px rgba(0,0,0,.1)}.ui-popup-modal .ui-dialog{box-shadow:0 0 8px rgba(0,0,0,.1),0 0 256px rgba(255,255,255,.3)}.ui-dialog-grid{width:auto;margin:0;border:0 none;border-collapse:collapse;border-spacing:0;background:transparent}.ui-dialog-header,.ui-dialog-body,.ui-dialog-footer{padding:0;border:0 none;text-align:left;background:transparent}.ui-dialog-header{white-space:nowrap;border-bottom:1px solid #E5E5E5}.ui-dialog-close{position:relative;_position:absolute;float:right;top:13px;right:13px;_height:26px;padding:0 4px;font-size:21px;font-weight:700;line-height:1;color:#000;text-shadow:0 1px 0 #FFF;opacity:.2;filter:alpha(opacity=20);cursor:pointer;background:transparent;_background:#FFF;border:0;-webkit-appearance:none}.ui-dialog-close:hover,.ui-dialog-close:focus{color:#000;text-decoration:none;cursor:pointer;outline:0;opacity:.5;filter:alpha(opacity=50)}.ui-dialog-title{margin:0;line-height:1.428571429;min-height:16.428571429px;padding:10px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:700;cursor:default}.ui-dialog-body{padding:20px;text-align:center}.ui-dialog-content{display:inline-block;position:relative;vertical-align:middle;*zoom:1;*display:inline;text-align:left}.ui-dialog-footer{padding:10px 20px}.ui-dialog-statusbar{float:left;margin-right:20px;padding:6px 0;line-height:1.428571429;font-size:14px;color:#888;white-space:nowrap}.ui-dialog-statusbar label:hover{color:#333}.ui-dialog-statusbar input,.ui-dialog-statusbar .label{vertical-align:middle}.ui-dialog-button{float:right;white-space:nowrap}.ui-dialog-footer button+button{margin-bottom:0;margin-left:5px}.ui-dialog-footer button{width:auto;overflow:visible;display:inline-block;padding:6px 12px;_margin-left:5px;margin-bottom:0;font-size:14px;font-weight:400;line-height:1.428571429;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;background-image:none;border:1px solid transparent;border-radius:4px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-o-user-select:none;user-select:none}.ui-dialog-footer button:focus{outline:thin dotted #333;outline:5px auto -webkit-focus-ring-color;outline-offset:-2px}.ui-dialog-footer button:hover,.ui-dialog-footer button:focus{color:#333;text-decoration:none}.ui-dialog-footer button:active{background-image:none;outline:0;-webkit-box-shadow:inset 0 3px 5px rgba(0,0,0,.125);box-shadow:inset 0 3px 5px rgba(0,0,0,.125)}.ui-dialog-footer button[disabled]{pointer-events:none;cursor:not-allowed;opacity:.65;filter:alpha(opacity=65);-webkit-box-shadow:none;box-shadow:none}.ui-dialog-footer button{color:#333;background-color:#fff;border-color:#ccc}.ui-dialog-footer button:hover,.ui-dialog-footer button:focus,.ui-dialog-footer button:active{color:#333;background-color:#ebebeb;border-color:#adadad}.ui-dialog-footer button:active{background-image:none}.ui-dialog-footer button[disabled],.ui-dialog-footer button[disabled]:hover,.ui-dialog-footer button[disabled]:focus,.ui-dialog-footer button[disabled]:active{background-color:#fff;border-color:#ccc}.ui-dialog-footer button.ui-dialog-autofocus{color:#fff;background-color:#428bca;border-color:#357ebd}.ui-dialog-footer button.ui-dialog-autofocus:hover,.ui-dialog-footer button.ui-dialog-autofocus:focus,.ui-dialog-footer button.ui-dialog-autofocus:active{color:#fff;background-color:#3276b1;border-color:#285e8e}.ui-dialog-footer button.ui-dialog-autofocus:active{background-image:none}.ui-popup-top-left .ui-dialog,.ui-popup-top .ui-dialog,.ui-popup-top-right .ui-dialog{top:-8px}.ui-popup-bottom-left .ui-dialog,.ui-popup-bottom .ui-dialog,.ui-popup-bottom-right .ui-dialog{top:8px}.ui-popup-left-top .ui-dialog,.ui-popup-left .ui-dialog,.ui-popup-left-bottom .ui-dialog{left:-8px}.ui-popup-right-top .ui-dialog,.ui-popup-right .ui-dialog,.ui-popup-right-bottom .ui-dialog{left:8px}.ui-dialog-arrow-a,.ui-dialog-arrow-b{position:absolute;display:none;width:0;height:0;overflow:hidden;_color:#FF3FFF;_filter:chroma(color=#FF3FFF);border:8px dashed transparent}.ui-popup-follow .ui-dialog-arrow-a,.ui-popup-follow .ui-dialog-arrow-b{display:block}.ui-popup-top-left .ui-dialog-arrow-a,.ui-popup-top .ui-dialog-arrow-a,.ui-popup-top-right .ui-dialog-arrow-a{bottom:-16px;border-top:8px solid #7C7C7C}.ui-popup-top-left .ui-dialog-arrow-b,.ui-popup-top .ui-dialog-arrow-b,.ui-popup-top-right .ui-dialog-arrow-b{bottom:-15px;border-top:8px solid #fff}.ui-popup-top-left .ui-dialog-arrow-a,.ui-popup-top-left .ui-dialog-arrow-b{left:15px}.ui-popup-top .ui-dialog-arrow-a,.ui-popup-top .ui-dialog-arrow-b{left:50%;margin-left:-8px}.ui-popup-top-right .ui-dialog-arrow-a,.ui-popup-top-right .ui-dialog-arrow-b{right:15px}.ui-popup-bottom-left .ui-dialog-arrow-a,.ui-popup-bottom .ui-dialog-arrow-a,.ui-popup-bottom-right .ui-dialog-arrow-a{top:-16px;border-bottom:8px solid #7C7C7C}.ui-popup-bottom-left .ui-dialog-arrow-b,.ui-popup-bottom .ui-dialog-arrow-b,.ui-popup-bottom-right .ui-dialog-arrow-b{top:-15px;border-bottom:8px solid #fff}.ui-popup-bottom-left .ui-dialog-arrow-a,.ui-popup-bottom-left .ui-dialog-arrow-b{left:15px}.ui-popup-bottom .ui-dialog-arrow-a,.ui-popup-bottom .ui-dialog-arrow-b{margin-left:-8px;left:50%}.ui-popup-bottom-right .ui-dialog-arrow-a,.ui-popup-bottom-right .ui-dialog-arrow-b{right:15px}.ui-popup-left-top .ui-dialog-arrow-a,.ui-popup-left .ui-dialog-arrow-a,.ui-popup-left-bottom .ui-dialog-arrow-a{right:-16px;border-left:8px solid #7C7C7C}.ui-popup-left-top .ui-dialog-arrow-b,.ui-popup-left .ui-dialog-arrow-b,.ui-popup-left-bottom .ui-dialog-arrow-b{right:-15px;border-left:8px solid #fff}.ui-popup-left-top .ui-dialog-arrow-a,.ui-popup-left-top .ui-dialog-arrow-b{top:15px}.ui-popup-left .ui-dialog-arrow-a,.ui-popup-left .ui-dialog-arrow-b{margin-top:-8px;top:50%}.ui-popup-left-bottom .ui-dialog-arrow-a,.ui-popup-left-bottom .ui-dialog-arrow-b{bottom:15px}.ui-popup-right-top .ui-dialog-arrow-a,.ui-popup-right .ui-dialog-arrow-a,.ui-popup-right-bottom .ui-dialog-arrow-a{left:-16px;border-right:8px solid #7C7C7C}.ui-popup-right-top .ui-dialog-arrow-b,.ui-popup-right .ui-dialog-arrow-b,.ui-popup-right-bottom .ui-dialog-arrow-b{left:-15px;border-right:8px solid #fff}.ui-popup-right-top .ui-dialog-arrow-a,.ui-popup-right-top .ui-dialog-arrow-b{top:15px}.ui-popup-right .ui-dialog-arrow-a,.ui-popup-right .ui-dialog-arrow-b{margin-top:-8px;top:50%}.ui-popup-right-bottom .ui-dialog-arrow-a,.ui-popup-right-bottom .ui-dialog-arrow-b{bottom:15px}@-webkit-keyframes ui-dialog-loading{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes ui-dialog-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.ui-dialog-loading{vertical-align:middle;position:relative;display:block;*zoom:1;*display:inline;overflow:hidden;width:32px;height:32px;top:50%;margin:-16px auto 0 auto;font-size:0;text-indent:-999em;color:#666}.ui-dialog-loading{width:100%\\9;text-indent:0\\9;line-height:32px\\9;text-align:center\\9;font-size:12px\\9}.ui-dialog-loading::after{position:absolute;content:'';width:3px;height:3px;margin:14.5px 0 0 14.5px;border-radius:100%;box-shadow:0 -10px 0 1px #ccc,10px 0 #ccc,0 10px #ccc,-10px 0 #ccc,-7px -7px 0 .5px #ccc,7px -7px 0 1.5px #ccc,7px 7px #ccc,-7px 7px #ccc;-webkit-transform:rotate(360deg);-webkit-animation:ui-dialog-loading 1.5s infinite linear;transform:rotate(360deg);animation:ui-dialog-loading 1.5s infinite linear;display:none\\9}");
});

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
 * 图片选择对话框
 */
define("common/imgdialog-debug", [ "lib/webuploader.min-debug", "lib/dialog/dialog-debug", "lib/dialog/popup-debug", "lib/dialog/dialog-config-debug", "common/pagebar-debug", "common/tips-debug" ], function(require, exports, module) {
    require("css/ui-dialog-debug.css");
    require("css/imgdialog-debug.css");
    require("css/webuploader-debug.css");
    var imglayoutTpl = require("tpl/dialog/img_layout-debug.html"), imglayoutTplCom = juicer(imglayoutTpl);
    var imglistTpl = require("tpl/dialog/img_list-debug.html"), imglistTplCom = juicer(imglistTpl);
    var WebUploader = require("lib/webuploader.min-debug");
    var artDialog = require("lib/dialog/dialog-debug");
    var PageBar = require("common/pagebar-debug");
    var tips = require("common/tips-debug");
    var defaultOpts = {
        pageSize: 12,
        maxSelect: 1
    };
    var ImageDialog = function(options) {
        this.imgArr = [];
        this.options = options = $.extend(true, {}, defaultOpts, options);
        this.init();
    };
    ImageDialog.prototype = {
        constructor: ImageDialog,
        init: function() {
            var $this = this;
            var opts = $this.options;
            $this.dialog = artDialog({
                id: "selectImg",
                title: "选择图片",
                fixed: true,
                content: imglayoutTplCom.render(),
                padding: 0,
                okValue: "确定",
                ok: function() {
                    if (!$this.imgArr || $this.imgArr.length === 0) {
                        return false;
                    }
                    opts.onOK && opts.onOK($this.imgArr);
                },
                cancelValue: "取消",
                cancel: function() {
                    opts.onCancel && opts.onCancel();
                }
            }).showModal();
            $($this.dialog.node).find(".js_loading").show();
            $this.getImageList({
                count: opts.pageSize
            }, function(data) {
                var images = data.images;
                $this.renderImageList(images, $this.imgArr);
                $this.initEvents();
                $this.initPageBar(data.total);
                $($this.dialog.node).find(".js_loading").hide();
            });
            $this.initUpload();
        },
        initEvents: function() {
            var $this = this, options = $this.options, dialog = $($this.dialog.node), delimgdialog = null;
            dialog.on("click", ".thumbnail", function(event) {
                var image = $(this);
                var colDom = image.parent();
                var imgDom = image.find("img");
                var id = imgDom.data("id");
                var name = imgDom.data("name");
                var url = imgDom.attr("src");
                if (colDom.hasClass("selected")) {
                    colDom.removeClass("selected");
                    var i = indexOf($this.imgArr, id);
                    if (i >= 0) {
                        $this.imgArr.splice(i, 1);
                    }
                } else {
                    if (options.maxSelect === 1) {
                        colDom.addClass("selected");
                        colDom.siblings(".selected").removeClass("selected");
                        $this.imgArr = [ {
                            imgid: id,
                            imgname: name,
                            imgurl: url
                        } ];
                    } else {
                        if (options.maxSelect > $this.imgArr.length) {
                            colDom.addClass("selected");
                            $this.imgArr.push({
                                imgid: id,
                                imgname: name,
                                imgurl: url
                            });
                        } else {
                            tips.error("最多可选" + options.maxSelect + "张");
                        }
                    }
                }
            });
            dialog.on("click", ".delete", function(event) {
                event.stopPropagation();
                if (delimgdialog) {
                    delimgdialog.close().remove();
                }
                var image = $(this);
                delimgdialog = artDialog({
                    content: "确定删除此图片？",
                    okValue: "确定",
                    ok: function() {
                        var filename = image.data("filename"), id = image.data("id");
                        $.post("image_delete.action", {
                            filename: filename
                        }, function(data) {
                            if (!data || data.status === 0) {
                                tips.error("删除失败");
                                return;
                            }
                            var i = indexOf($this.imgArr, id);
                            if (i >= 0) {
                                $this.imgArr.splice(i, 1);
                            }
                            dialog.find(".js_loading").show();
                            $this.getImageList({
                                count: options.pageSize
                            }, function(data) {
                                var images = data.images;
                                $this.renderImageList(images, $this.imgArr);
                                $this.initPageBar(data.total);
                                dialog.find(".js_loading").hide();
                                tips.success("删除成功");
                            });
                        }, "json");
                    },
                    cancelValue: "取消",
                    cancel: function() {},
                    align: "bottom",
                    skin: "dialog-delete"
                });
                delimgdialog.show(this);
            });
            $(document).on("click", function(event) {
                0 === $(event.target).closest(".dialog-delete").length && delimgdialog && delimgdialog.close().remove();
            });
        },
        initPageBar: function(imgcount) {
            var that = this;
            var imgdg = $(that.dialog.node);
            var opts = that.options;
            that.pagebar && that.pagebar.destroy();
            if (opts.pageSize >= imgcount) {
                $("#img-pagebar").empty();
                $("#img-pagebar").hide();
            } else {
                that.pagebar = new PageBar({
                    container: "#img-pagebar",
                    totalCount: imgcount,
                    pageSize: opts.pageSize,
                    onCallback: function(index) {
                        imgdg.find("#img-pagebar").hide();
                        imgdg.find(".js_loading").show();
                        that.getImageList({
                            begin: (index - 1) * opts.pageSize,
                            count: opts.pageSize
                        }, function(data) {
                            var images = data.images;
                            that.renderImageList(images, that.imgArr);
                            imgdg.find("#img-pagebar").show();
                            imgdg.find(".js_loading").hide();
                        });
                        imgdg.find(".imgdg-main").scrollTop(0);
                    }
                });
            }
        },
        initUpload: function() {
            var $this = this, opts = $this.options;
            var uploader = WebUploader.create({
                // 自动上传。
                auto: true,
                // swf文件路径
                swf: "/js/Uploader.swf",
                // 文件接收服务端。
                server: "/liontech/webApps/datastore/upload.ds",
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: "#filePicker",
                // 只允许选择文件，可选。
                accept: {
                    title: "Images",
                    extensions: "gif,jpg,jpeg,bmp,png",
                    mimeTypes: "image/*"
                },
                compress: false
            });
            // 上传成功
            uploader.on("uploadSuccess", function(file, response) {
                $.post("image_add.action", {
                    uuid: response.uuid,
                    filename: file.name
                }, function(data) {
                    if (!data || data.status === 0) {
                        tips.error("上传失败！");
                        return;
                    }
                    $($this.dialog.node).find(".js_loading").show();
                    $this.getImageList({
                        count: opts.pageSize
                    }, function(data) {
                        var images = data.images;
                        $this.imgArr = [ getImageJsonData(images[0]) ];
                        $this.renderImageList(images, $this.imgArr);
                        $this.initPageBar(data.total);
                        $($this.dialog.node).find(".js_loading").hide();
                    });
                    tips.success("上传成功！");
                }, "json");
            });
            // 上传失败
            uploader.on("uploadError", function(file) {
                tips.error("上传失败！");
            });
            // 上传完成
            uploader.on("uploadComplete", function(file) {
                $(".progress-box").fadeOut();
            });
            // 图片加入上传队列
            uploader.on("fileQueued", function(e) {
                $(".progress .progress-bar").css("width", "0%");
                $(".progress-box").fadeIn();
            });
            // 上传进度条
            uploader.on("uploadProgress", function(file, percentage) {
                $(".progress .progress-bar").css("width", percentage * 100 + "%");
            });
            uploader.on("uploadFinished", function() {
                this.reset();
            });
        },
        getImageList: function(options, onCallback) {
            options = $.extend({
                begin: 0,
                count: 12
            }, options);
            $.getJSON("image_list.action", options, function(data) {
                data.status !== 1 ? tips.error("图片列表加载失败！") : onCallback(data);
            });
        },
        renderImageList: function(images, imgArr) {
            var imgs = [];
            images = images ? images : [];
            $.each(images, function(i, n) {
                var image = getImageJsonData(n);
                if (indexOf(imgArr, image.imgid) != -1) {
                    image.selected = 1;
                }
                imgs.push(image);
            });
            $("#img-content").html(imglistTplCom.render({
                data: imgs
            }));
        }
    };
    function indexOf(imgArr, imgid) {
        for (var i = 0; i < imgArr.length; i++) if (imgArr[i].imgid === imgid) {
            return i;
        }
        return -1;
    }
    function getImageJsonData(image) {
        var id = image.substring(0, image.indexOf("_")), name, url;
        name = image.substring(image.indexOf("_") + 1);
        url = "/liontech/webApps/datastore/thumb.ds?uuid=" + id + "&accesspointtype=standardweb";
        return {
            imgid: id,
            imgname: name,
            imgurl: url
        };
    }
    module.exports = ImageDialog;
});

define("css/imgdialog-debug.css", [], function() {
    seajs.importStyle(".imgdg-bd{border:0;border-bottom:1px solid #ddd;margin-bottom:0;border-radius:0}.imgdg-hd .progress-box{background-color:#fff;display:none;width:248px;height:42px;position:absolute;top:43px;right:15px;border:1px solid #e7e7eb;z-index:1;padding:15px 20px}.imgdg-hd .progress-box .progress{width:200px;height:10px}.imgdg-hd .filepicker{display:inline-block;line-height:1.428571429;vertical-align:middle}.imgdg-main{width:762px;height:349px;overflow:auto;padding:15px 15px 0}.img-list .img-item{padding-right:4px;padding-left:4px}.img-item .img-item-bd{cursor:pointer;padding:0;border-radius:0;margin-bottom:15px}.img-item .img-item-bd .pic{border-bottom:1px solid #e7e7eb;width:117px;height:118px}.img-item .img-item-bd .imgname{display:block;overflow:hidden;line-height:32px;height:32px;padding:0 14px;text-align:left;white-space:nowrap;text-overflow:ellipsis}.img-item.selected .selected-mask{position:absolute;top:1px;left:5px;width:117px;height:118px;cursor:pointer}.img-item.selected .selected-mask-inner{width:100%;height:100%;-moz-opacity:.6;-khtml-opacity:.6;opacity:.6;background-color:#000;filter:alpha(opacity=60)}.img-item.selected .selected-mask-icon{position:absolute;top:0;left:0;background:transparent url(/liontech/webApps/manager/img/icon_card_selected.png) no-repeat 0 0;width:100%;height:100%;vertical-align:middle;background-position:50% 50%}.img-item .img-item-bd .delete{background:transparent url(/liontech/webApps/manager/img/close.png) no-repeat 0 0;position:absolute;top:1px;right:5px;width:16px;height:16px}.imgdg-ft{padding-top:6px;padding-bottom:6px}");
});

define("css/webuploader-debug.css", [], function() {
    seajs.importStyle(".webuploader-container{position:relative}.webuploader-element-invisible{position:absolute!important;clip:rect(1px,1px,1px,1px);clip:rect(1px,1px,1px,1px)}.webuploader-pick{display:inline-block;padding:6px 12px;margin-bottom:0;font-size:14px;font-weight:400;line-height:1.42857143;text-align:center;white-space:nowrap;vertical-align:middle;touch-action:manipulation;cursor:pointer;-webkit-user-select:none;user-select:none;background-image:none;border:1px solid transparent;border-radius:4px;color:#fff;background-color:#337ab7;border-color:#2e6da4;width:110px}.webuploader-pick-hover{background:#286090}.webuploader-pick-disable{opacity:.6;pointer-events:none}");
});

define("tpl/dialog/img_layout-debug.html", [], '<!-- 图片选择弹出层 -->\n<div class="panel panel-default imgdg-bd">\n	<div class="panel-heading text-right imgdg-hd">\n		<div id="uploader" style="display: block">\n			<div id="filePicker" class="filepicker">本地上传</div>\n			<div class="progress-box">\n				<div class="progress">\n					<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="0" aria-valuemin="0"\n						aria-valuemax="100" style="width: 0%;"></div>\n				</div>\n			</div>\n		</div>\n	</div>\n	<div class="panel-body imgdg-main">\n		<i class="icon_loading_small white js_loading" style="display: none;"></i>\n		<div id="img-content"></div>\n	</div>\n	<div class="panel-footer text-right imgdg-ft" id="img-pagebar"></div>\n</div>');

define("tpl/dialog/img_list-debug.html", [], '<!-- 图片选择弹出层-列表 -->\n<div class="row img-list">\n	{@each data as img,index}\n	<div class="col-xs-2{@if img.selected} selected{@/if} img-item">\n		<div class="thumbnail img-item-bd">\n			<img src="!{img.imgurl}" alt="..." data-id="!{img.imgid}" data-name="!{img.imgname}" class="pic"> <span\n				class="imgname">!{img.imgname}</span>\n			<div class="selected-mask">\n				<div class="selected-mask-inner"></div>\n				<div class="selected-mask-icon"></div>\n			</div>\n			<div class="delete" data-filename="!{img.imgid}_!{img.imgname}" data-id="!{img.imgid}"></div>\n		</div>\n	</div>\n	{@/each}\n</div>');

/* WebUploader 0.1.5 */
define("lib/webuploader.min-debug", [], function(require, exports, module) {
    !function(a, b) {
        var c, d = {}, e = function(a, b) {
            var c, d, e;
            if ("string" == typeof a) return h(a);
            for (c = [], d = a.length, e = 0; d > e; e++) c.push(h(a[e]));
            return b.apply(null, c);
        }, f = function(a, b, c) {
            2 === arguments.length && (c = b, b = null), e(b || [], function() {
                g(a, c, arguments);
            });
        }, g = function(a, b, c) {
            var f, g = {
                exports: b
            };
            "function" == typeof b && (c.length || (c = [ e, g.exports, g ]), f = b.apply(null, c), 
            void 0 !== f && (g.exports = f)), d[a] = g.exports;
        }, h = function(b) {
            var c = d[b] || a[b];
            if (!c) throw new Error("`" + b + "` is undefined");
            return c;
        }, i = function(a) {
            var b, c, e, f, g, h;
            h = function(a) {
                return a && a.charAt(0).toUpperCase() + a.substr(1);
            };
            for (b in d) if (c = a, d.hasOwnProperty(b)) {
                for (e = b.split("/"), g = h(e.pop()); f = h(e.shift()); ) c[f] = c[f] || {}, c = c[f];
                c[g] = d[b];
            }
            return a;
        }, j = function(c) {
            return a.__dollar = c, i(b(a, f, e));
        };
        "object" == typeof module && "object" == typeof module.exports ? module.exports = j() : "function" == typeof define && define.amd ? define([ "jquery" ], j) : (c = a.WebUploader, 
        a.WebUploader = j(), a.WebUploader.noConflict = function() {
            a.WebUploader = c;
        });
    }(window, function(a, b, c) {
        return b("dollar-third", [], function() {
            var b = a.__dollar || a.jQuery || a.Zepto;
            if (!b) throw new Error("jQuery or Zepto not found!");
            return b;
        }), b("dollar", [ "dollar-third" ], function(a) {
            return a;
        }), b("promise-third", [ "dollar" ], function(a) {
            return {
                Deferred: a.Deferred,
                when: a.when,
                isPromise: function(a) {
                    return a && "function" == typeof a.then;
                }
            };
        }), b("promise", [ "promise-third" ], function(a) {
            return a;
        }), b("base", [ "dollar", "promise" ], function(b, c) {
            function d(a) {
                return function() {
                    return h.apply(a, arguments);
                };
            }
            function e(a, b) {
                return function() {
                    return a.apply(b, arguments);
                };
            }
            function f(a) {
                var b;
                return Object.create ? Object.create(a) : (b = function() {}, b.prototype = a, new b());
            }
            var g = function() {}, h = Function.call;
            return {
                version: "0.1.5",
                $: b,
                Deferred: c.Deferred,
                isPromise: c.isPromise,
                when: c.when,
                browser: function(a) {
                    var b = {}, c = a.match(/WebKit\/([\d.]+)/), d = a.match(/Chrome\/([\d.]+)/) || a.match(/CriOS\/([\d.]+)/), e = a.match(/MSIE\s([\d\.]+)/) || a.match(/(?:trident)(?:.*rv:([\w.]+))?/i), f = a.match(/Firefox\/([\d.]+)/), g = a.match(/Safari\/([\d.]+)/), h = a.match(/OPR\/([\d.]+)/);
                    return c && (b.webkit = parseFloat(c[1])), d && (b.chrome = parseFloat(d[1])), e && (b.ie = parseFloat(e[1])), 
                    f && (b.firefox = parseFloat(f[1])), g && (b.safari = parseFloat(g[1])), h && (b.opera = parseFloat(h[1])), 
                    b;
                }(navigator.userAgent),
                os: function(a) {
                    var b = {}, c = a.match(/(?:Android);?[\s\/]+([\d.]+)?/), d = a.match(/(?:iPad|iPod|iPhone).*OS\s([\d_]+)/);
                    return c && (b.android = parseFloat(c[1])), d && (b.ios = parseFloat(d[1].replace(/_/g, "."))), 
                    b;
                }(navigator.userAgent),
                inherits: function(a, c, d) {
                    var e;
                    return "function" == typeof c ? (e = c, c = null) : e = c && c.hasOwnProperty("constructor") ? c.constructor : function() {
                        return a.apply(this, arguments);
                    }, b.extend(!0, e, a, d || {}), e.__super__ = a.prototype, e.prototype = f(a.prototype), 
                    c && b.extend(!0, e.prototype, c), e;
                },
                noop: g,
                bindFn: e,
                log: function() {
                    return a.console ? e(console.log, console) : g;
                }(),
                nextTick: function() {
                    return function(a) {
                        setTimeout(a, 1);
                    };
                }(),
                slice: d([].slice),
                guid: function() {
                    var a = 0;
                    return function(b) {
                        for (var c = (+new Date()).toString(32), d = 0; 5 > d; d++) c += Math.floor(65535 * Math.random()).toString(32);
                        return (b || "wu_") + c + (a++).toString(32);
                    };
                }(),
                formatSize: function(a, b, c) {
                    var d;
                    for (c = c || [ "B", "K", "M", "G", "TB" ]; (d = c.shift()) && a > 1024; ) a /= 1024;
                    return ("B" === d ? a : a.toFixed(b || 2)) + d;
                }
            };
        }), b("mediator", [ "base" ], function(a) {
            function b(a, b, c, d) {
                return f.grep(a, function(a) {
                    return !(!a || b && a.e !== b || c && a.cb !== c && a.cb._cb !== c || d && a.ctx !== d);
                });
            }
            function c(a, b, c) {
                f.each((a || "").split(h), function(a, d) {
                    c(d, b);
                });
            }
            function d(a, b) {
                for (var c, d = !1, e = -1, f = a.length; ++e < f; ) if (c = a[e], c.cb.apply(c.ctx2, b) === !1) {
                    d = !0;
                    break;
                }
                return !d;
            }
            var e, f = a.$, g = [].slice, h = /\s+/;
            return e = {
                on: function(a, b, d) {
                    var e, f = this;
                    return b ? (e = this._events || (this._events = []), c(a, b, function(a, b) {
                        var c = {
                            e: a
                        };
                        c.cb = b, c.ctx = d, c.ctx2 = d || f, c.id = e.length, e.push(c);
                    }), this) : this;
                },
                once: function(a, b, d) {
                    var e = this;
                    return b ? (c(a, b, function(a, b) {
                        var c = function() {
                            return e.off(a, c), b.apply(d || e, arguments);
                        };
                        c._cb = b, e.on(a, c, d);
                    }), e) : e;
                },
                off: function(a, d, e) {
                    var g = this._events;
                    return g ? a || d || e ? (c(a, d, function(a, c) {
                        f.each(b(g, a, c, e), function() {
                            delete g[this.id];
                        });
                    }), this) : (this._events = [], this) : this;
                },
                trigger: function(a) {
                    var c, e, f;
                    return this._events && a ? (c = g.call(arguments, 1), e = b(this._events, a), f = b(this._events, "all"), 
                    d(e, c) && d(f, arguments)) : this;
                }
            }, f.extend({
                installTo: function(a) {
                    return f.extend(a, e);
                }
            }, e);
        }), b("uploader", [ "base", "mediator" ], function(a, b) {
            function c(a) {
                this.options = d.extend(!0, {}, c.options, a), this._init(this.options);
            }
            var d = a.$;
            return c.options = {}, b.installTo(c.prototype), d.each({
                upload: "start-upload",
                stop: "stop-upload",
                getFile: "get-file",
                getFiles: "get-files",
                addFile: "add-file",
                addFiles: "add-file",
                sort: "sort-files",
                removeFile: "remove-file",
                cancelFile: "cancel-file",
                skipFile: "skip-file",
                retry: "retry",
                isInProgress: "is-in-progress",
                makeThumb: "make-thumb",
                md5File: "md5-file",
                getDimension: "get-dimension",
                addButton: "add-btn",
                predictRuntimeType: "predict-runtime-type",
                refresh: "refresh",
                disable: "disable",
                enable: "enable",
                reset: "reset"
            }, function(a, b) {
                c.prototype[a] = function() {
                    return this.request(b, arguments);
                };
            }), d.extend(c.prototype, {
                state: "pending",
                _init: function(a) {
                    var b = this;
                    b.request("init", a, function() {
                        b.state = "ready", b.trigger("ready");
                    });
                },
                option: function(a, b) {
                    var c = this.options;
                    return arguments.length > 1 ? void (d.isPlainObject(b) && d.isPlainObject(c[a]) ? d.extend(c[a], b) : c[a] = b) : a ? c[a] : c;
                },
                getStats: function() {
                    var a = this.request("get-stats");
                    return a ? {
                        successNum: a.numOfSuccess,
                        progressNum: a.numOfProgress,
                        cancelNum: a.numOfCancel,
                        invalidNum: a.numOfInvalid,
                        uploadFailNum: a.numOfUploadFailed,
                        queueNum: a.numOfQueue,
                        interruptNum: a.numofInterrupt
                    } : {};
                },
                trigger: function(a) {
                    var c = [].slice.call(arguments, 1), e = this.options, f = "on" + a.substring(0, 1).toUpperCase() + a.substring(1);
                    return b.trigger.apply(this, arguments) === !1 || d.isFunction(e[f]) && e[f].apply(this, c) === !1 || d.isFunction(this[f]) && this[f].apply(this, c) === !1 || b.trigger.apply(b, [ this, a ].concat(c)) === !1 ? !1 : !0;
                },
                destroy: function() {
                    this.request("destroy", arguments), this.off();
                },
                request: a.noop
            }), a.create = c.create = function(a) {
                return new c(a);
            }, a.Uploader = c, c;
        }), b("runtime/runtime", [ "base", "mediator" ], function(a, b) {
            function c(b) {
                this.options = d.extend({
                    container: document.body
                }, b), this.uid = a.guid("rt_");
            }
            var d = a.$, e = {}, f = function(a) {
                for (var b in a) if (a.hasOwnProperty(b)) return b;
                return null;
            };
            return d.extend(c.prototype, {
                getContainer: function() {
                    var a, b, c = this.options;
                    return this._container ? this._container : (a = d(c.container || document.body), 
                    b = d(document.createElement("div")), b.attr("id", "rt_" + this.uid), b.css({
                        position: "absolute",
                        top: "0px",
                        left: "0px",
                        width: "1px",
                        height: "1px",
                        overflow: "hidden"
                    }), a.append(b), a.addClass("webuploader-container"), this._container = b, this._parent = a, 
                    b);
                },
                init: a.noop,
                exec: a.noop,
                destroy: function() {
                    this._container && this._container.remove(), this._parent && this._parent.removeClass("webuploader-container"), 
                    this.off();
                }
            }), c.orders = "html5,flash", c.addRuntime = function(a, b) {
                e[a] = b;
            }, c.hasRuntime = function(a) {
                return !!(a ? e[a] : f(e));
            }, c.create = function(a, b) {
                var g, h;
                if (b = b || c.orders, d.each(b.split(/\s*,\s*/g), function() {
                    return e[this] ? (g = this, !1) : void 0;
                }), g = g || f(e), !g) throw new Error("Runtime Error");
                return h = new e[g](a);
            }, b.installTo(c.prototype), c;
        }), b("runtime/client", [ "base", "mediator", "runtime/runtime" ], function(a, b, c) {
            function d(b, d) {
                var f, g = a.Deferred();
                this.uid = a.guid("client_"), this.runtimeReady = function(a) {
                    return g.done(a);
                }, this.connectRuntime = function(b, h) {
                    if (f) throw new Error("already connected!");
                    return g.done(h), "string" == typeof b && e.get(b) && (f = e.get(b)), f = f || e.get(null, d), 
                    f ? (a.$.extend(f.options, b), f.__promise.then(g.resolve), f.__client++) : (f = c.create(b, b.runtimeOrder), 
                    f.__promise = g.promise(), f.once("ready", g.resolve), f.init(), e.add(f), f.__client = 1), 
                    d && (f.__standalone = d), f;
                }, this.getRuntime = function() {
                    return f;
                }, this.disconnectRuntime = function() {
                    f && (f.__client--, f.__client <= 0 && (e.remove(f), delete f.__promise, f.destroy()), 
                    f = null);
                }, this.exec = function() {
                    if (f) {
                        var c = a.slice(arguments);
                        return b && c.unshift(b), f.exec.apply(this, c);
                    }
                }, this.getRuid = function() {
                    return f && f.uid;
                }, this.destroy = function(a) {
                    return function() {
                        a && a.apply(this, arguments), this.trigger("destroy"), this.off(), this.exec("destroy"), 
                        this.disconnectRuntime();
                    };
                }(this.destroy);
            }
            var e;
            return e = function() {
                var a = {};
                return {
                    add: function(b) {
                        a[b.uid] = b;
                    },
                    get: function(b, c) {
                        var d;
                        if (b) return a[b];
                        for (d in a) if (!c || !a[d].__standalone) return a[d];
                        return null;
                    },
                    remove: function(b) {
                        delete a[b.uid];
                    }
                };
            }(), b.installTo(d.prototype), d;
        }), b("lib/dnd", [ "base", "mediator", "runtime/client" ], function(a, b, c) {
            function d(a) {
                a = this.options = e.extend({}, d.options, a), a.container = e(a.container), a.container.length && c.call(this, "DragAndDrop");
            }
            var e = a.$;
            return d.options = {
                accept: null,
                disableGlobalDnd: !1
            }, a.inherits(c, {
                constructor: d,
                init: function() {
                    var a = this;
                    a.connectRuntime(a.options, function() {
                        a.exec("init"), a.trigger("ready");
                    });
                }
            }), b.installTo(d.prototype), d;
        }), b("widgets/widget", [ "base", "uploader" ], function(a, b) {
            function c(a) {
                if (!a) return !1;
                var b = a.length, c = e.type(a);
                return 1 === a.nodeType && b ? !0 : "array" === c || "function" !== c && "string" !== c && (0 === b || "number" == typeof b && b > 0 && b - 1 in a);
            }
            function d(a) {
                this.owner = a, this.options = a.options;
            }
            var e = a.$, f = b.prototype._init, g = b.prototype.destroy, h = {}, i = [];
            return e.extend(d.prototype, {
                init: a.noop,
                invoke: function(a, b) {
                    var c = this.responseMap;
                    return c && a in c && c[a] in this && e.isFunction(this[c[a]]) ? this[c[a]].apply(this, b) : h;
                },
                request: function() {
                    return this.owner.request.apply(this.owner, arguments);
                }
            }), e.extend(b.prototype, {
                _init: function() {
                    var a = this, b = a._widgets = [], c = a.options.disableWidgets || "";
                    return e.each(i, function(d, e) {
                        (!c || !~c.indexOf(e._name)) && b.push(new e(a));
                    }), f.apply(a, arguments);
                },
                request: function(b, d, e) {
                    var f, g, i, j, k = 0, l = this._widgets, m = l && l.length, n = [], o = [];
                    for (d = c(d) ? d : [ d ]; m > k; k++) f = l[k], g = f.invoke(b, d), g !== h && (a.isPromise(g) ? o.push(g) : n.push(g));
                    return e || o.length ? (i = a.when.apply(a, o), j = i.pipe ? "pipe" : "then", i[j](function() {
                        var b = a.Deferred(), c = arguments;
                        return 1 === c.length && (c = c[0]), setTimeout(function() {
                            b.resolve(c);
                        }, 1), b.promise();
                    })[e ? j : "done"](e || a.noop)) : n[0];
                },
                destroy: function() {
                    g.apply(this, arguments), this._widgets = null;
                }
            }), b.register = d.register = function(b, c) {
                var f, g = {
                    init: "init",
                    destroy: "destroy",
                    name: "anonymous"
                };
                return 1 === arguments.length ? (c = b, e.each(c, function(a) {
                    return "_" === a[0] || "name" === a ? void ("name" === a && (g.name = c.name)) : void (g[a.replace(/[A-Z]/g, "-$&").toLowerCase()] = a);
                })) : g = e.extend(g, b), c.responseMap = g, f = a.inherits(d, c), f._name = g.name, 
                i.push(f), f;
            }, b.unRegister = d.unRegister = function(a) {
                if (a && "anonymous" !== a) for (var b = i.length; b--; ) i[b]._name === a && i.splice(b, 1);
            }, d;
        }), b("widgets/filednd", [ "base", "uploader", "lib/dnd", "widgets/widget" ], function(a, b, c) {
            var d = a.$;
            return b.options.dnd = "", b.register({
                name: "dnd",
                init: function(b) {
                    if (b.dnd && "html5" === this.request("predict-runtime-type")) {
                        var e, f = this, g = a.Deferred(), h = d.extend({}, {
                            disableGlobalDnd: b.disableGlobalDnd,
                            container: b.dnd,
                            accept: b.accept
                        });
                        return this.dnd = e = new c(h), e.once("ready", g.resolve), e.on("drop", function(a) {
                            f.request("add-file", [ a ]);
                        }), e.on("accept", function(a) {
                            return f.owner.trigger("dndAccept", a);
                        }), e.init(), g.promise();
                    }
                },
                destroy: function() {
                    this.dnd && this.dnd.destroy();
                }
            });
        }), b("lib/filepaste", [ "base", "mediator", "runtime/client" ], function(a, b, c) {
            function d(a) {
                a = this.options = e.extend({}, a), a.container = e(a.container || document.body), 
                c.call(this, "FilePaste");
            }
            var e = a.$;
            return a.inherits(c, {
                constructor: d,
                init: function() {
                    var a = this;
                    a.connectRuntime(a.options, function() {
                        a.exec("init"), a.trigger("ready");
                    });
                }
            }), b.installTo(d.prototype), d;
        }), b("widgets/filepaste", [ "base", "uploader", "lib/filepaste", "widgets/widget" ], function(a, b, c) {
            var d = a.$;
            return b.register({
                name: "paste",
                init: function(b) {
                    if (b.paste && "html5" === this.request("predict-runtime-type")) {
                        var e, f = this, g = a.Deferred(), h = d.extend({}, {
                            container: b.paste,
                            accept: b.accept
                        });
                        return this.paste = e = new c(h), e.once("ready", g.resolve), e.on("paste", function(a) {
                            f.owner.request("add-file", [ a ]);
                        }), e.init(), g.promise();
                    }
                },
                destroy: function() {
                    this.paste && this.paste.destroy();
                }
            });
        }), b("lib/blob", [ "base", "runtime/client" ], function(a, b) {
            function c(a, c) {
                var d = this;
                d.source = c, d.ruid = a, this.size = c.size || 0, this.type = !c.type && this.ext && ~"jpg,jpeg,png,gif,bmp".indexOf(this.ext) ? "image/" + ("jpg" === this.ext ? "jpeg" : this.ext) : c.type || "application/octet-stream", 
                b.call(d, "Blob"), this.uid = c.uid || this.uid, a && d.connectRuntime(a);
            }
            return a.inherits(b, {
                constructor: c,
                slice: function(a, b) {
                    return this.exec("slice", a, b);
                },
                getSource: function() {
                    return this.source;
                }
            }), c;
        }), b("lib/file", [ "base", "lib/blob" ], function(a, b) {
            function c(a, c) {
                var f;
                this.name = c.name || "untitled" + d++, f = e.exec(c.name) ? RegExp.$1.toLowerCase() : "", 
                !f && c.type && (f = /\/(jpg|jpeg|png|gif|bmp)$/i.exec(c.type) ? RegExp.$1.toLowerCase() : "", 
                this.name += "." + f), this.ext = f, this.lastModifiedDate = c.lastModifiedDate || new Date().toLocaleString(), 
                b.apply(this, arguments);
            }
            var d = 1, e = /\.([^.]+)$/;
            return a.inherits(b, c);
        }), b("lib/filepicker", [ "base", "runtime/client", "lib/file" ], function(b, c, d) {
            function e(a) {
                if (a = this.options = f.extend({}, e.options, a), a.container = f(a.id), !a.container.length) throw new Error("按钮指定错误");
                a.innerHTML = a.innerHTML || a.label || a.container.html() || "", a.button = f(a.button || document.createElement("div")), 
                a.button.html(a.innerHTML), a.container.html(a.button), c.call(this, "FilePicker", !0);
            }
            var f = b.$;
            return e.options = {
                button: null,
                container: null,
                label: null,
                innerHTML: null,
                multiple: !0,
                accept: null,
                name: "file"
            }, b.inherits(c, {
                constructor: e,
                init: function() {
                    var c = this, e = c.options, g = e.button;
                    g.addClass("webuploader-pick"), c.on("all", function(a) {
                        var b;
                        switch (a) {
                          case "mouseenter":
                            g.addClass("webuploader-pick-hover");
                            break;

                          case "mouseleave":
                            g.removeClass("webuploader-pick-hover");
                            break;

                          case "change":
                            b = c.exec("getFiles"), c.trigger("select", f.map(b, function(a) {
                                return a = new d(c.getRuid(), a), a._refer = e.container, a;
                            }), e.container);
                        }
                    }), c.connectRuntime(e, function() {
                        c.refresh(), c.exec("init", e), c.trigger("ready");
                    }), this._resizeHandler = b.bindFn(this.refresh, this), f(a).on("resize", this._resizeHandler);
                },
                refresh: function() {
                    var a = this.getRuntime().getContainer(), b = this.options.button, c = b.outerWidth ? b.outerWidth() : b.width(), d = b.outerHeight ? b.outerHeight() : b.height(), e = b.offset();
                    c && d && a.css({
                        bottom: "auto",
                        right: "auto",
                        width: c + "px",
                        height: d + "px"
                    }).offset(e);
                },
                enable: function() {
                    var a = this.options.button;
                    a.removeClass("webuploader-pick-disable"), this.refresh();
                },
                disable: function() {
                    var a = this.options.button;
                    this.getRuntime().getContainer().css({
                        top: "-99999px"
                    }), a.addClass("webuploader-pick-disable");
                },
                destroy: function() {
                    var b = this.options.button;
                    f(a).off("resize", this._resizeHandler), b.removeClass("webuploader-pick-disable webuploader-pick-hover webuploader-pick");
                }
            }), e;
        }), b("widgets/filepicker", [ "base", "uploader", "lib/filepicker", "widgets/widget" ], function(a, b, c) {
            var d = a.$;
            return d.extend(b.options, {
                pick: null,
                accept: null
            }), b.register({
                name: "picker",
                init: function(a) {
                    return this.pickers = [], a.pick && this.addBtn(a.pick);
                },
                refresh: function() {
                    d.each(this.pickers, function() {
                        this.refresh();
                    });
                },
                addBtn: function(b) {
                    var e = this, f = e.options, g = f.accept, h = [];
                    if (b) return d.isPlainObject(b) || (b = {
                        id: b
                    }), d(b.id).each(function() {
                        var i, j, k;
                        k = a.Deferred(), i = d.extend({}, b, {
                            accept: d.isPlainObject(g) ? [ g ] : g,
                            swf: f.swf,
                            runtimeOrder: f.runtimeOrder,
                            id: this
                        }), j = new c(i), j.once("ready", k.resolve), j.on("select", function(a) {
                            e.owner.request("add-file", [ a ]);
                        }), j.init(), e.pickers.push(j), h.push(k.promise());
                    }), a.when.apply(a, h);
                },
                disable: function() {
                    d.each(this.pickers, function() {
                        this.disable();
                    });
                },
                enable: function() {
                    d.each(this.pickers, function() {
                        this.enable();
                    });
                },
                destroy: function() {
                    d.each(this.pickers, function() {
                        this.destroy();
                    }), this.pickers = null;
                }
            });
        }), b("lib/image", [ "base", "runtime/client", "lib/blob" ], function(a, b, c) {
            function d(a) {
                this.options = e.extend({}, d.options, a), b.call(this, "Image"), this.on("load", function() {
                    this._info = this.exec("info"), this._meta = this.exec("meta");
                });
            }
            var e = a.$;
            return d.options = {
                quality: 90,
                crop: !1,
                preserveHeaders: !1,
                allowMagnify: !1
            }, a.inherits(b, {
                constructor: d,
                info: function(a) {
                    return a ? (this._info = a, this) : this._info;
                },
                meta: function(a) {
                    return a ? (this._meta = a, this) : this._meta;
                },
                loadFromBlob: function(a) {
                    var b = this, c = a.getRuid();
                    this.connectRuntime(c, function() {
                        b.exec("init", b.options), b.exec("loadFromBlob", a);
                    });
                },
                resize: function() {
                    var b = a.slice(arguments);
                    return this.exec.apply(this, [ "resize" ].concat(b));
                },
                crop: function() {
                    var b = a.slice(arguments);
                    return this.exec.apply(this, [ "crop" ].concat(b));
                },
                getAsDataUrl: function(a) {
                    return this.exec("getAsDataUrl", a);
                },
                getAsBlob: function(a) {
                    var b = this.exec("getAsBlob", a);
                    return new c(this.getRuid(), b);
                }
            }), d;
        }), b("widgets/image", [ "base", "uploader", "lib/image", "widgets/widget" ], function(a, b, c) {
            var d, e = a.$;
            return d = function(a) {
                var b = 0, c = [], d = function() {
                    for (var d; c.length && a > b; ) d = c.shift(), b += d[0], d[1]();
                };
                return function(a, e, f) {
                    c.push([ e, f ]), a.once("destroy", function() {
                        b -= e, setTimeout(d, 1);
                    }), setTimeout(d, 1);
                };
            }(5242880), e.extend(b.options, {
                thumb: {
                    width: 110,
                    height: 110,
                    quality: 70,
                    allowMagnify: !0,
                    crop: !0,
                    preserveHeaders: !1,
                    type: "image/jpeg"
                },
                compress: {
                    width: 1600,
                    height: 1600,
                    quality: 90,
                    allowMagnify: !1,
                    crop: !1,
                    preserveHeaders: !0
                }
            }), b.register({
                name: "image",
                makeThumb: function(a, b, f, g) {
                    var h, i;
                    return a = this.request("get-file", a), a.type.match(/^image/) ? (h = e.extend({}, this.options.thumb), 
                    e.isPlainObject(f) && (h = e.extend(h, f), f = null), f = f || h.width, g = g || h.height, 
                    i = new c(h), i.once("load", function() {
                        a._info = a._info || i.info(), a._meta = a._meta || i.meta(), 1 >= f && f > 0 && (f = a._info.width * f), 
                        1 >= g && g > 0 && (g = a._info.height * g), i.resize(f, g);
                    }), i.once("complete", function() {
                        b(!1, i.getAsDataUrl(h.type)), i.destroy();
                    }), i.once("error", function(a) {
                        b(a || !0), i.destroy();
                    }), void d(i, a.source.size, function() {
                        a._info && i.info(a._info), a._meta && i.meta(a._meta), i.loadFromBlob(a.source);
                    })) : void b(!0);
                },
                beforeSendFile: function(b) {
                    var d, f, g = this.options.compress || this.options.resize, h = g && g.compressSize || 0, i = g && g.noCompressIfLarger || !1;
                    return b = this.request("get-file", b), !g || !~"image/jpeg,image/jpg".indexOf(b.type) || b.size < h || b._compressed ? void 0 : (g = e.extend({}, g), 
                    f = a.Deferred(), d = new c(g), f.always(function() {
                        d.destroy(), d = null;
                    }), d.once("error", f.reject), d.once("load", function() {
                        var a = g.width, c = g.height;
                        b._info = b._info || d.info(), b._meta = b._meta || d.meta(), 1 >= a && a > 0 && (a = b._info.width * a), 
                        1 >= c && c > 0 && (c = b._info.height * c), d.resize(a, c);
                    }), d.once("complete", function() {
                        var a, c;
                        try {
                            a = d.getAsBlob(g.type), c = b.size, (!i || a.size < c) && (b.source = a, b.size = a.size, 
                            b.trigger("resize", a.size, c)), b._compressed = !0, f.resolve();
                        } catch (e) {
                            f.resolve();
                        }
                    }), b._info && d.info(b._info), b._meta && d.meta(b._meta), d.loadFromBlob(b.source), 
                    f.promise());
                }
            });
        }), b("file", [ "base", "mediator" ], function(a, b) {
            function c() {
                return f + g++;
            }
            function d(a) {
                this.name = a.name || "Untitled", this.size = a.size || 0, this.type = a.type || "application/octet-stream", 
                this.lastModifiedDate = a.lastModifiedDate || 1 * new Date(), this.id = c(), this.ext = h.exec(this.name) ? RegExp.$1 : "", 
                this.statusText = "", i[this.id] = d.Status.INITED, this.source = a, this.loaded = 0, 
                this.on("error", function(a) {
                    this.setStatus(d.Status.ERROR, a);
                });
            }
            var e = a.$, f = "WU_FILE_", g = 0, h = /\.([^.]+)$/, i = {};
            return e.extend(d.prototype, {
                setStatus: function(a, b) {
                    var c = i[this.id];
                    "undefined" != typeof b && (this.statusText = b), a !== c && (i[this.id] = a, this.trigger("statuschange", a, c));
                },
                getStatus: function() {
                    return i[this.id];
                },
                getSource: function() {
                    return this.source;
                },
                destroy: function() {
                    this.off(), delete i[this.id];
                }
            }), b.installTo(d.prototype), d.Status = {
                INITED: "inited",
                QUEUED: "queued",
                PROGRESS: "progress",
                ERROR: "error",
                COMPLETE: "complete",
                CANCELLED: "cancelled",
                INTERRUPT: "interrupt",
                INVALID: "invalid"
            }, d;
        }), b("queue", [ "base", "mediator", "file" ], function(a, b, c) {
            function d() {
                this.stats = {
                    numOfQueue: 0,
                    numOfSuccess: 0,
                    numOfCancel: 0,
                    numOfProgress: 0,
                    numOfUploadFailed: 0,
                    numOfInvalid: 0,
                    numofDeleted: 0,
                    numofInterrupt: 0
                }, this._queue = [], this._map = {};
            }
            var e = a.$, f = c.Status;
            return e.extend(d.prototype, {
                append: function(a) {
                    return this._queue.push(a), this._fileAdded(a), this;
                },
                prepend: function(a) {
                    return this._queue.unshift(a), this._fileAdded(a), this;
                },
                getFile: function(a) {
                    return "string" != typeof a ? a : this._map[a];
                },
                fetch: function(a) {
                    var b, c, d = this._queue.length;
                    for (a = a || f.QUEUED, b = 0; d > b; b++) if (c = this._queue[b], a === c.getStatus()) return c;
                    return null;
                },
                sort: function(a) {
                    "function" == typeof a && this._queue.sort(a);
                },
                getFiles: function() {
                    for (var a, b = [].slice.call(arguments, 0), c = [], d = 0, f = this._queue.length; f > d; d++) a = this._queue[d], 
                    (!b.length || ~e.inArray(a.getStatus(), b)) && c.push(a);
                    return c;
                },
                removeFile: function(a) {
                    var b = this._map[a.id];
                    b && (delete this._map[a.id], a.destroy(), this.stats.numofDeleted++);
                },
                _fileAdded: function(a) {
                    var b = this, c = this._map[a.id];
                    c || (this._map[a.id] = a, a.on("statuschange", function(a, c) {
                        b._onFileStatusChange(a, c);
                    }));
                },
                _onFileStatusChange: function(a, b) {
                    var c = this.stats;
                    switch (b) {
                      case f.PROGRESS:
                        c.numOfProgress--;
                        break;

                      case f.QUEUED:
                        c.numOfQueue--;
                        break;

                      case f.ERROR:
                        c.numOfUploadFailed--;
                        break;

                      case f.INVALID:
                        c.numOfInvalid--;
                        break;

                      case f.INTERRUPT:
                        c.numofInterrupt--;
                    }
                    switch (a) {
                      case f.QUEUED:
                        c.numOfQueue++;
                        break;

                      case f.PROGRESS:
                        c.numOfProgress++;
                        break;

                      case f.ERROR:
                        c.numOfUploadFailed++;
                        break;

                      case f.COMPLETE:
                        c.numOfSuccess++;
                        break;

                      case f.CANCELLED:
                        c.numOfCancel++;
                        break;

                      case f.INVALID:
                        c.numOfInvalid++;
                        break;

                      case f.INTERRUPT:
                        c.numofInterrupt++;
                    }
                }
            }), b.installTo(d.prototype), d;
        }), b("widgets/queue", [ "base", "uploader", "queue", "file", "lib/file", "runtime/client", "widgets/widget" ], function(a, b, c, d, e, f) {
            var g = a.$, h = /\.\w+$/, i = d.Status;
            return b.register({
                name: "queue",
                init: function(b) {
                    var d, e, h, i, j, k, l, m = this;
                    if (g.isPlainObject(b.accept) && (b.accept = [ b.accept ]), b.accept) {
                        for (j = [], h = 0, e = b.accept.length; e > h; h++) i = b.accept[h].extensions, 
                        i && j.push(i);
                        j.length && (k = "\\." + j.join(",").replace(/,/g, "$|\\.").replace(/\*/g, ".*") + "$"), 
                        m.accept = new RegExp(k, "i");
                    }
                    return m.queue = new c(), m.stats = m.queue.stats, "html5" === this.request("predict-runtime-type") ? (d = a.Deferred(), 
                    this.placeholder = l = new f("Placeholder"), l.connectRuntime({
                        runtimeOrder: "html5"
                    }, function() {
                        m._ruid = l.getRuid(), d.resolve();
                    }), d.promise()) : void 0;
                },
                _wrapFile: function(a) {
                    if (!(a instanceof d)) {
                        if (!(a instanceof e)) {
                            if (!this._ruid) throw new Error("Can't add external files.");
                            a = new e(this._ruid, a);
                        }
                        a = new d(a);
                    }
                    return a;
                },
                acceptFile: function(a) {
                    var b = !a || !a.size || this.accept && h.exec(a.name) && !this.accept.test(a.name);
                    return !b;
                },
                _addFile: function(a) {
                    var b = this;
                    return a = b._wrapFile(a), b.owner.trigger("beforeFileQueued", a) ? b.acceptFile(a) ? (b.queue.append(a), 
                    b.owner.trigger("fileQueued", a), a) : void b.owner.trigger("error", "Q_TYPE_DENIED", a) : void 0;
                },
                getFile: function(a) {
                    return this.queue.getFile(a);
                },
                addFile: function(a) {
                    var b = this;
                    a.length || (a = [ a ]), a = g.map(a, function(a) {
                        return b._addFile(a);
                    }), b.owner.trigger("filesQueued", a), b.options.auto && setTimeout(function() {
                        b.request("start-upload");
                    }, 20);
                },
                getStats: function() {
                    return this.stats;
                },
                removeFile: function(a, b) {
                    var c = this;
                    a = a.id ? a : c.queue.getFile(a), this.request("cancel-file", a), b && this.queue.removeFile(a);
                },
                getFiles: function() {
                    return this.queue.getFiles.apply(this.queue, arguments);
                },
                fetchFile: function() {
                    return this.queue.fetch.apply(this.queue, arguments);
                },
                retry: function(a, b) {
                    var c, d, e, f = this;
                    if (a) return a = a.id ? a : f.queue.getFile(a), a.setStatus(i.QUEUED), void (b || f.request("start-upload"));
                    for (c = f.queue.getFiles(i.ERROR), d = 0, e = c.length; e > d; d++) a = c[d], a.setStatus(i.QUEUED);
                    f.request("start-upload");
                },
                sortFiles: function() {
                    return this.queue.sort.apply(this.queue, arguments);
                },
                reset: function() {
                    this.owner.trigger("reset"), this.queue = new c(), this.stats = this.queue.stats;
                },
                destroy: function() {
                    this.reset(), this.placeholder && this.placeholder.destroy();
                }
            });
        }), b("widgets/runtime", [ "uploader", "runtime/runtime", "widgets/widget" ], function(a, b) {
            return a.support = function() {
                return b.hasRuntime.apply(b, arguments);
            }, a.register({
                name: "runtime",
                init: function() {
                    if (!this.predictRuntimeType()) throw Error("Runtime Error");
                },
                predictRuntimeType: function() {
                    var a, c, d = this.options.runtimeOrder || b.orders, e = this.type;
                    if (!e) for (d = d.split(/\s*,\s*/g), a = 0, c = d.length; c > a; a++) if (b.hasRuntime(d[a])) {
                        this.type = e = d[a];
                        break;
                    }
                    return e;
                }
            });
        }), b("lib/transport", [ "base", "runtime/client", "mediator" ], function(a, b, c) {
            function d(a) {
                var c = this;
                a = c.options = e.extend(!0, {}, d.options, a || {}), b.call(this, "Transport"), 
                this._blob = null, this._formData = a.formData || {}, this._headers = a.headers || {}, 
                this.on("progress", this._timeout), this.on("load error", function() {
                    c.trigger("progress", 1), clearTimeout(c._timer);
                });
            }
            var e = a.$;
            return d.options = {
                server: "",
                method: "POST",
                withCredentials: !1,
                fileVal: "file",
                timeout: 12e4,
                formData: {},
                headers: {},
                sendAsBinary: !1
            }, e.extend(d.prototype, {
                appendBlob: function(a, b, c) {
                    var d = this, e = d.options;
                    d.getRuid() && d.disconnectRuntime(), d.connectRuntime(b.ruid, function() {
                        d.exec("init");
                    }), d._blob = b, e.fileVal = a || e.fileVal, e.filename = c || e.filename;
                },
                append: function(a, b) {
                    "object" == typeof a ? e.extend(this._formData, a) : this._formData[a] = b;
                },
                setRequestHeader: function(a, b) {
                    "object" == typeof a ? e.extend(this._headers, a) : this._headers[a] = b;
                },
                send: function(a) {
                    this.exec("send", a), this._timeout();
                },
                abort: function() {
                    return clearTimeout(this._timer), this.exec("abort");
                },
                destroy: function() {
                    this.trigger("destroy"), this.off(), this.exec("destroy"), this.disconnectRuntime();
                },
                getResponse: function() {
                    return this.exec("getResponse");
                },
                getResponseAsJson: function() {
                    return this.exec("getResponseAsJson");
                },
                getStatus: function() {
                    return this.exec("getStatus");
                },
                _timeout: function() {
                    var a = this, b = a.options.timeout;
                    b && (clearTimeout(a._timer), a._timer = setTimeout(function() {
                        a.abort(), a.trigger("error", "timeout");
                    }, b));
                }
            }), c.installTo(d.prototype), d;
        }), b("widgets/upload", [ "base", "uploader", "file", "lib/transport", "widgets/widget" ], function(a, b, c, d) {
            function e(a, b) {
                var c, d, e = [], f = a.source, g = f.size, h = b ? Math.ceil(g / b) : 1, i = 0, j = 0;
                for (d = {
                    file: a,
                    has: function() {
                        return !!e.length;
                    },
                    shift: function() {
                        return e.shift();
                    },
                    unshift: function(a) {
                        e.unshift(a);
                    }
                }; h > j; ) c = Math.min(b, g - i), e.push({
                    file: a,
                    start: i,
                    end: b ? i + c : g,
                    total: g,
                    chunks: h,
                    chunk: j++,
                    cuted: d
                }), i += c;
                return a.blocks = e.concat(), a.remaning = e.length, d;
            }
            var f = a.$, g = a.isPromise, h = c.Status;
            f.extend(b.options, {
                prepareNextFile: !1,
                chunked: !1,
                chunkSize: 5242880,
                chunkRetry: 2,
                threads: 3,
                formData: {}
            }), b.register({
                name: "upload",
                init: function() {
                    var b = this.owner, c = this;
                    this.runing = !1, this.progress = !1, b.on("startUpload", function() {
                        c.progress = !0;
                    }).on("uploadFinished", function() {
                        c.progress = !1;
                    }), this.pool = [], this.stack = [], this.pending = [], this.remaning = 0, this.__tick = a.bindFn(this._tick, this), 
                    b.on("uploadComplete", function(a) {
                        a.blocks && f.each(a.blocks, function(a, b) {
                            b.transport && (b.transport.abort(), b.transport.destroy()), delete b.transport;
                        }), delete a.blocks, delete a.remaning;
                    });
                },
                reset: function() {
                    this.request("stop-upload", !0), this.runing = !1, this.pool = [], this.stack = [], 
                    this.pending = [], this.remaning = 0, this._trigged = !1, this._promise = null;
                },
                startUpload: function(b) {
                    var c = this;
                    if (f.each(c.request("get-files", h.INVALID), function() {
                        c.request("remove-file", this);
                    }), b) if (b = b.id ? b : c.request("get-file", b), b.getStatus() === h.INTERRUPT) f.each(c.pool, function(a, c) {
                        c.file === b && c.transport && c.transport.send();
                    }), b.setStatus(h.QUEUED); else {
                        if (b.getStatus() === h.PROGRESS) return;
                        b.setStatus(h.QUEUED);
                    } else f.each(c.request("get-files", [ h.INITED ]), function() {
                        this.setStatus(h.QUEUED);
                    });
                    c.runing || (c.runing = !0, f.each(c.pool, function(a, b) {
                        var d = b.file;
                        d.getStatus() === h.INTERRUPT && (d.setStatus(h.PROGRESS), c._trigged = !1, b.transport && b.transport.send());
                    }), b || f.each(c.request("get-files", h.INTERRUPT), function() {
                        this.setStatus(h.PROGRESS);
                    }), c._trigged = !1, a.nextTick(c.__tick), c.owner.trigger("startUpload"));
                },
                stopUpload: function(b, c) {
                    var d = this;
                    if (b === !0 && (c = b, b = null), d.runing !== !1) {
                        if (b) {
                            if (b = b.id ? b : d.request("get-file", b), b.getStatus() !== h.PROGRESS && b.getStatus() !== h.QUEUED) return;
                            return b.setStatus(h.INTERRUPT), f.each(d.pool, function(a, c) {
                                c.file === b && (c.transport && c.transport.abort(), d._putback(c), d._popBlock(c));
                            }), a.nextTick(d.__tick);
                        }
                        d.runing = !1, this._promise && this._promise.file && this._promise.file.setStatus(h.INTERRUPT), 
                        c && f.each(d.pool, function(a, b) {
                            b.transport && b.transport.abort(), b.file.setStatus(h.INTERRUPT);
                        }), d.owner.trigger("stopUpload");
                    }
                },
                cancelFile: function(a) {
                    a = a.id ? a : this.request("get-file", a), a.blocks && f.each(a.blocks, function(a, b) {
                        var c = b.transport;
                        c && (c.abort(), c.destroy(), delete b.transport);
                    }), a.setStatus(h.CANCELLED), this.owner.trigger("fileDequeued", a);
                },
                isInProgress: function() {
                    return !!this.progress;
                },
                _getStats: function() {
                    return this.request("get-stats");
                },
                skipFile: function(a, b) {
                    a = a.id ? a : this.request("get-file", a), a.setStatus(b || h.COMPLETE), a.skipped = !0, 
                    a.blocks && f.each(a.blocks, function(a, b) {
                        var c = b.transport;
                        c && (c.abort(), c.destroy(), delete b.transport);
                    }), this.owner.trigger("uploadSkip", a);
                },
                _tick: function() {
                    var b, c, d = this, e = d.options;
                    return d._promise ? d._promise.always(d.__tick) : void (d.pool.length < e.threads && (c = d._nextBlock()) ? (d._trigged = !1, 
                    b = function(b) {
                        d._promise = null, b && b.file && d._startSend(b), a.nextTick(d.__tick);
                    }, d._promise = g(c) ? c.always(b) : b(c)) : d.remaning || d._getStats().numOfQueue || d._getStats().numofInterrupt || (d.runing = !1, 
                    d._trigged || a.nextTick(function() {
                        d.owner.trigger("uploadFinished");
                    }), d._trigged = !0));
                },
                _putback: function(a) {
                    var b;
                    a.cuted.unshift(a), b = this.stack.indexOf(a.cuted), ~b || this.stack.unshift(a.cuted);
                },
                _getStack: function() {
                    for (var a, b = 0; a = this.stack[b++]; ) {
                        if (a.has() && a.file.getStatus() === h.PROGRESS) return a;
                        (!a.has() || a.file.getStatus() !== h.PROGRESS && a.file.getStatus() !== h.INTERRUPT) && this.stack.splice(--b, 1);
                    }
                    return null;
                },
                _nextBlock: function() {
                    var a, b, c, d, f = this, h = f.options;
                    return (a = this._getStack()) ? (h.prepareNextFile && !f.pending.length && f._prepareNextFile(), 
                    a.shift()) : f.runing ? (!f.pending.length && f._getStats().numOfQueue && f._prepareNextFile(), 
                    b = f.pending.shift(), c = function(b) {
                        return b ? (a = e(b, h.chunked ? h.chunkSize : 0), f.stack.push(a), a.shift()) : null;
                    }, g(b) ? (d = b.file, b = b[b.pipe ? "pipe" : "then"](c), b.file = d, b) : c(b)) : void 0;
                },
                _prepareNextFile: function() {
                    var a, b = this, c = b.request("fetch-file"), d = b.pending;
                    c && (a = b.request("before-send-file", c, function() {
                        return c.getStatus() === h.PROGRESS || c.getStatus() === h.INTERRUPT ? c : b._finishFile(c);
                    }), b.owner.trigger("uploadStart", c), c.setStatus(h.PROGRESS), a.file = c, a.done(function() {
                        var b = f.inArray(a, d);
                        ~b && d.splice(b, 1, c);
                    }), a.fail(function(a) {
                        c.setStatus(h.ERROR, a), b.owner.trigger("uploadError", c, a), b.owner.trigger("uploadComplete", c);
                    }), d.push(a));
                },
                _popBlock: function(a) {
                    var b = f.inArray(a, this.pool);
                    this.pool.splice(b, 1), a.file.remaning--, this.remaning--;
                },
                _startSend: function(b) {
                    var c, d = this, e = b.file;
                    return e.getStatus() !== h.PROGRESS ? void (e.getStatus() === h.INTERRUPT && d._putback(b)) : (d.pool.push(b), 
                    d.remaning++, b.blob = 1 === b.chunks ? e.source : e.source.slice(b.start, b.end), 
                    c = d.request("before-send", b, function() {
                        e.getStatus() === h.PROGRESS ? d._doSend(b) : (d._popBlock(b), a.nextTick(d.__tick));
                    }), void c.fail(function() {
                        1 === e.remaning ? d._finishFile(e).always(function() {
                            b.percentage = 1, d._popBlock(b), d.owner.trigger("uploadComplete", e), a.nextTick(d.__tick);
                        }) : (b.percentage = 1, d.updateFileProgress(e), d._popBlock(b), a.nextTick(d.__tick));
                    }));
                },
                _doSend: function(b) {
                    var c, e, g = this, i = g.owner, j = g.options, k = b.file, l = new d(j), m = f.extend({}, j.formData), n = f.extend({}, j.headers);
                    b.transport = l, l.on("destroy", function() {
                        delete b.transport, g._popBlock(b), a.nextTick(g.__tick);
                    }), l.on("progress", function(a) {
                        b.percentage = a, g.updateFileProgress(k);
                    }), c = function(a) {
                        var c;
                        return e = l.getResponseAsJson() || {}, e._raw = l.getResponse(), c = function(b) {
                            a = b;
                        }, i.trigger("uploadAccept", b, e, c) || (a = a || "server"), a;
                    }, l.on("error", function(a, d) {
                        b.retried = b.retried || 0, b.chunks > 1 && ~"http,abort".indexOf(a) && b.retried < j.chunkRetry ? (b.retried++, 
                        l.send()) : (d || "server" !== a || (a = c(a)), k.setStatus(h.ERROR, a), i.trigger("uploadError", k, a), 
                        i.trigger("uploadComplete", k));
                    }), l.on("load", function() {
                        var a;
                        return (a = c()) ? void l.trigger("error", a, !0) : void (1 === k.remaning ? g._finishFile(k, e) : l.destroy());
                    }), m = f.extend(m, {
                        id: k.id,
                        name: k.name,
                        type: k.type,
                        lastModifiedDate: k.lastModifiedDate,
                        size: k.size
                    }), b.chunks > 1 && f.extend(m, {
                        chunks: b.chunks,
                        chunk: b.chunk
                    }), i.trigger("uploadBeforeSend", b, m, n), l.appendBlob(j.fileVal, b.blob, k.name), 
                    l.append(m), l.setRequestHeader(n), l.send();
                },
                _finishFile: function(a, b, c) {
                    var d = this.owner;
                    return d.request("after-send-file", arguments, function() {
                        a.setStatus(h.COMPLETE), d.trigger("uploadSuccess", a, b, c);
                    }).fail(function(b) {
                        a.getStatus() === h.PROGRESS && a.setStatus(h.ERROR, b), d.trigger("uploadError", a, b);
                    }).always(function() {
                        d.trigger("uploadComplete", a);
                    });
                },
                updateFileProgress: function(a) {
                    var b = 0, c = 0;
                    a.blocks && (f.each(a.blocks, function(a, b) {
                        c += (b.percentage || 0) * (b.end - b.start);
                    }), b = c / a.size, this.owner.trigger("uploadProgress", a, b || 0));
                }
            });
        }), b("widgets/validator", [ "base", "uploader", "file", "widgets/widget" ], function(a, b, c) {
            var d, e = a.$, f = {};
            return d = {
                addValidator: function(a, b) {
                    f[a] = b;
                },
                removeValidator: function(a) {
                    delete f[a];
                }
            }, b.register({
                name: "validator",
                init: function() {
                    var b = this;
                    a.nextTick(function() {
                        e.each(f, function() {
                            this.call(b.owner);
                        });
                    });
                }
            }), d.addValidator("fileNumLimit", function() {
                var a = this, b = a.options, c = 0, d = parseInt(b.fileNumLimit, 10), e = !0;
                d && (a.on("beforeFileQueued", function(a) {
                    return c >= d && e && (e = !1, this.trigger("error", "Q_EXCEED_NUM_LIMIT", d, a), 
                    setTimeout(function() {
                        e = !0;
                    }, 1)), c >= d ? !1 : !0;
                }), a.on("fileQueued", function() {
                    c++;
                }), a.on("fileDequeued", function() {
                    c--;
                }), a.on("reset", function() {
                    c = 0;
                }));
            }), d.addValidator("fileSizeLimit", function() {
                var a = this, b = a.options, c = 0, d = parseInt(b.fileSizeLimit, 10), e = !0;
                d && (a.on("beforeFileQueued", function(a) {
                    var b = c + a.size > d;
                    return b && e && (e = !1, this.trigger("error", "Q_EXCEED_SIZE_LIMIT", d, a), setTimeout(function() {
                        e = !0;
                    }, 1)), b ? !1 : !0;
                }), a.on("fileQueued", function(a) {
                    c += a.size;
                }), a.on("fileDequeued", function(a) {
                    c -= a.size;
                }), a.on("reset", function() {
                    c = 0;
                }));
            }), d.addValidator("fileSingleSizeLimit", function() {
                var a = this, b = a.options, d = b.fileSingleSizeLimit;
                d && a.on("beforeFileQueued", function(a) {
                    return a.size > d ? (a.setStatus(c.Status.INVALID, "exceed_size"), this.trigger("error", "F_EXCEED_SIZE", d, a), 
                    !1) : void 0;
                });
            }), d.addValidator("duplicate", function() {
                function a(a) {
                    for (var b, c = 0, d = 0, e = a.length; e > d; d++) b = a.charCodeAt(d), c = b + (c << 6) + (c << 16) - c;
                    return c;
                }
                var b = this, c = b.options, d = {};
                c.duplicate || (b.on("beforeFileQueued", function(b) {
                    var c = b.__hash || (b.__hash = a(b.name + b.size + b.lastModifiedDate));
                    return d[c] ? (this.trigger("error", "F_DUPLICATE", b), !1) : void 0;
                }), b.on("fileQueued", function(a) {
                    var b = a.__hash;
                    b && (d[b] = !0);
                }), b.on("fileDequeued", function(a) {
                    var b = a.__hash;
                    b && delete d[b];
                }), b.on("reset", function() {
                    d = {};
                }));
            }), d;
        }), b("lib/md5", [ "runtime/client", "mediator" ], function(a, b) {
            function c() {
                a.call(this, "Md5");
            }
            return b.installTo(c.prototype), c.prototype.loadFromBlob = function(a) {
                var b = this;
                b.getRuid() && b.disconnectRuntime(), b.connectRuntime(a.ruid, function() {
                    b.exec("init"), b.exec("loadFromBlob", a);
                });
            }, c.prototype.getResult = function() {
                return this.exec("getResult");
            }, c;
        }), b("widgets/md5", [ "base", "uploader", "lib/md5", "lib/blob", "widgets/widget" ], function(a, b, c, d) {
            return b.register({
                name: "md5",
                md5File: function(b, e, f) {
                    var g = new c(), h = a.Deferred(), i = b instanceof d ? b : this.request("get-file", b).source;
                    return g.on("progress load", function(a) {
                        a = a || {}, h.notify(a.total ? a.loaded / a.total : 1);
                    }), g.on("complete", function() {
                        h.resolve(g.getResult());
                    }), g.on("error", function(a) {
                        h.reject(a);
                    }), arguments.length > 1 && (e = e || 0, f = f || 0, 0 > e && (e = i.size + e), 
                    0 > f && (f = i.size + f), f = Math.min(f, i.size), i = i.slice(e, f)), g.loadFromBlob(i), 
                    h.promise();
                }
            });
        }), b("runtime/compbase", [], function() {
            function a(a, b) {
                this.owner = a, this.options = a.options, this.getRuntime = function() {
                    return b;
                }, this.getRuid = function() {
                    return b.uid;
                }, this.trigger = function() {
                    return a.trigger.apply(a, arguments);
                };
            }
            return a;
        }), b("runtime/html5/runtime", [ "base", "runtime/runtime", "runtime/compbase" ], function(b, c, d) {
            function e() {
                var a = {}, d = this, e = this.destroy;
                c.apply(d, arguments), d.type = f, d.exec = function(c, e) {
                    var f, h = this, i = h.uid, j = b.slice(arguments, 2);
                    return g[c] && (f = a[i] = a[i] || new g[c](h, d), f[e]) ? f[e].apply(f, j) : void 0;
                }, d.destroy = function() {
                    return e && e.apply(this, arguments);
                };
            }
            var f = "html5", g = {};
            return b.inherits(c, {
                constructor: e,
                init: function() {
                    var a = this;
                    setTimeout(function() {
                        a.trigger("ready");
                    }, 1);
                }
            }), e.register = function(a, c) {
                var e = g[a] = b.inherits(d, c);
                return e;
            }, a.Blob && a.FileReader && a.DataView && c.addRuntime(f, e), e;
        }), b("runtime/html5/blob", [ "runtime/html5/runtime", "lib/blob" ], function(a, b) {
            return a.register("Blob", {
                slice: function(a, c) {
                    var d = this.owner.source, e = d.slice || d.webkitSlice || d.mozSlice;
                    return d = e.call(d, a, c), new b(this.getRuid(), d);
                }
            });
        }), b("runtime/html5/dnd", [ "base", "runtime/html5/runtime", "lib/file" ], function(a, b, c) {
            var d = a.$, e = "webuploader-dnd-";
            return b.register("DragAndDrop", {
                init: function() {
                    var b = this.elem = this.options.container;
                    this.dragEnterHandler = a.bindFn(this._dragEnterHandler, this), this.dragOverHandler = a.bindFn(this._dragOverHandler, this), 
                    this.dragLeaveHandler = a.bindFn(this._dragLeaveHandler, this), this.dropHandler = a.bindFn(this._dropHandler, this), 
                    this.dndOver = !1, b.on("dragenter", this.dragEnterHandler), b.on("dragover", this.dragOverHandler), 
                    b.on("dragleave", this.dragLeaveHandler), b.on("drop", this.dropHandler), this.options.disableGlobalDnd && (d(document).on("dragover", this.dragOverHandler), 
                    d(document).on("drop", this.dropHandler));
                },
                _dragEnterHandler: function(a) {
                    var b, c = this, d = c._denied || !1;
                    return a = a.originalEvent || a, c.dndOver || (c.dndOver = !0, b = a.dataTransfer.items, 
                    b && b.length && (c._denied = d = !c.trigger("accept", b)), c.elem.addClass(e + "over"), 
                    c.elem[d ? "addClass" : "removeClass"](e + "denied")), a.dataTransfer.dropEffect = d ? "none" : "copy", 
                    !1;
                },
                _dragOverHandler: function(a) {
                    var b = this.elem.parent().get(0);
                    return b && !d.contains(b, a.currentTarget) ? !1 : (clearTimeout(this._leaveTimer), 
                    this._dragEnterHandler.call(this, a), !1);
                },
                _dragLeaveHandler: function() {
                    var a, b = this;
                    return a = function() {
                        b.dndOver = !1, b.elem.removeClass(e + "over " + e + "denied");
                    }, clearTimeout(b._leaveTimer), b._leaveTimer = setTimeout(a, 100), !1;
                },
                _dropHandler: function(a) {
                    var b, f, g = this, h = g.getRuid(), i = g.elem.parent().get(0);
                    if (i && !d.contains(i, a.currentTarget)) return !1;
                    a = a.originalEvent || a, b = a.dataTransfer;
                    try {
                        f = b.getData("text/html");
                    } catch (j) {}
                    return f ? void 0 : (g._getTansferFiles(b, function(a) {
                        g.trigger("drop", d.map(a, function(a) {
                            return new c(h, a);
                        }));
                    }), g.dndOver = !1, g.elem.removeClass(e + "over"), !1);
                },
                _getTansferFiles: function(b, c) {
                    var d, e, f, g, h, i, j, k = [], l = [];
                    for (d = b.items, e = b.files, j = !(!d || !d[0].webkitGetAsEntry), h = 0, i = e.length; i > h; h++) f = e[h], 
                    g = d && d[h], j && g.webkitGetAsEntry().isDirectory ? l.push(this._traverseDirectoryTree(g.webkitGetAsEntry(), k)) : k.push(f);
                    a.when.apply(a, l).done(function() {
                        k.length && c(k);
                    });
                },
                _traverseDirectoryTree: function(b, c) {
                    var d = a.Deferred(), e = this;
                    return b.isFile ? b.file(function(a) {
                        c.push(a), d.resolve();
                    }) : b.isDirectory && b.createReader().readEntries(function(b) {
                        var f, g = b.length, h = [], i = [];
                        for (f = 0; g > f; f++) h.push(e._traverseDirectoryTree(b[f], i));
                        a.when.apply(a, h).then(function() {
                            c.push.apply(c, i), d.resolve();
                        }, d.reject);
                    }), d.promise();
                },
                destroy: function() {
                    var a = this.elem;
                    a && (a.off("dragenter", this.dragEnterHandler), a.off("dragover", this.dragOverHandler), 
                    a.off("dragleave", this.dragLeaveHandler), a.off("drop", this.dropHandler), this.options.disableGlobalDnd && (d(document).off("dragover", this.dragOverHandler), 
                    d(document).off("drop", this.dropHandler)));
                }
            });
        }), b("runtime/html5/filepaste", [ "base", "runtime/html5/runtime", "lib/file" ], function(a, b, c) {
            return b.register("FilePaste", {
                init: function() {
                    var b, c, d, e, f = this.options, g = this.elem = f.container, h = ".*";
                    if (f.accept) {
                        for (b = [], c = 0, d = f.accept.length; d > c; c++) e = f.accept[c].mimeTypes, 
                        e && b.push(e);
                        b.length && (h = b.join(","), h = h.replace(/,/g, "|").replace(/\*/g, ".*"));
                    }
                    this.accept = h = new RegExp(h, "i"), this.hander = a.bindFn(this._pasteHander, this), 
                    g.on("paste", this.hander);
                },
                _pasteHander: function(a) {
                    var b, d, e, f, g, h = [], i = this.getRuid();
                    for (a = a.originalEvent || a, b = a.clipboardData.items, f = 0, g = b.length; g > f; f++) d = b[f], 
                    "file" === d.kind && (e = d.getAsFile()) && h.push(new c(i, e));
                    h.length && (a.preventDefault(), a.stopPropagation(), this.trigger("paste", h));
                },
                destroy: function() {
                    this.elem.off("paste", this.hander);
                }
            });
        }), b("runtime/html5/filepicker", [ "base", "runtime/html5/runtime" ], function(a, b) {
            var c = a.$;
            return b.register("FilePicker", {
                init: function() {
                    var a, b, d, e, f = this.getRuntime().getContainer(), g = this, h = g.owner, i = g.options, j = this.label = c(document.createElement("label")), k = this.input = c(document.createElement("input"));
                    if (k.attr("type", "file"), k.attr("name", i.name), k.addClass("webuploader-element-invisible"), 
                    j.on("click", function() {
                        k.trigger("click");
                    }), j.css({
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        cursor: "pointer",
                        background: "#ffffff"
                    }), i.multiple && k.attr("multiple", "multiple"), i.accept && i.accept.length > 0) {
                        for (a = [], b = 0, d = i.accept.length; d > b; b++) a.push(i.accept[b].mimeTypes);
                        k.attr("accept", a.join(","));
                    }
                    f.append(k), f.append(j), e = function(a) {
                        h.trigger(a.type);
                    }, k.on("change", function(a) {
                        var b, d = arguments.callee;
                        g.files = a.target.files, b = this.cloneNode(!0), b.value = null, this.parentNode.replaceChild(b, this), 
                        k.off(), k = c(b).on("change", d).on("mouseenter mouseleave", e), h.trigger("change");
                    }), j.on("mouseenter mouseleave", e);
                },
                getFiles: function() {
                    return this.files;
                },
                destroy: function() {
                    this.input.off(), this.label.off();
                }
            });
        }), b("runtime/html5/util", [ "base" ], function(b) {
            var c = a.createObjectURL && a || a.URL && URL.revokeObjectURL && URL || a.webkitURL, d = b.noop, e = d;
            return c && (d = function() {
                return c.createObjectURL.apply(c, arguments);
            }, e = function() {
                return c.revokeObjectURL.apply(c, arguments);
            }), {
                createObjectURL: d,
                revokeObjectURL: e,
                dataURL2Blob: function(a) {
                    var b, c, d, e, f, g;
                    for (g = a.split(","), b = ~g[0].indexOf("base64") ? atob(g[1]) : decodeURIComponent(g[1]), 
                    d = new ArrayBuffer(b.length), c = new Uint8Array(d), e = 0; e < b.length; e++) c[e] = b.charCodeAt(e);
                    return f = g[0].split(":")[1].split(";")[0], this.arrayBufferToBlob(d, f);
                },
                dataURL2ArrayBuffer: function(a) {
                    var b, c, d, e;
                    for (e = a.split(","), b = ~e[0].indexOf("base64") ? atob(e[1]) : decodeURIComponent(e[1]), 
                    c = new Uint8Array(b.length), d = 0; d < b.length; d++) c[d] = b.charCodeAt(d);
                    return c.buffer;
                },
                arrayBufferToBlob: function(b, c) {
                    var d, e = a.BlobBuilder || a.WebKitBlobBuilder;
                    return e ? (d = new e(), d.append(b), d.getBlob(c)) : new Blob([ b ], c ? {
                        type: c
                    } : {});
                },
                canvasToDataUrl: function(a, b, c) {
                    return a.toDataURL(b, c / 100);
                },
                parseMeta: function(a, b) {
                    b(!1, {});
                },
                updateImageHead: function(a) {
                    return a;
                }
            };
        }), b("runtime/html5/imagemeta", [ "runtime/html5/util" ], function(a) {
            var b;
            return b = {
                parsers: {
                    65505: []
                },
                maxMetaDataSize: 262144,
                parse: function(a, b) {
                    var c = this, d = new FileReader();
                    d.onload = function() {
                        b(!1, c._parse(this.result)), d = d.onload = d.onerror = null;
                    }, d.onerror = function(a) {
                        b(a.message), d = d.onload = d.onerror = null;
                    }, a = a.slice(0, c.maxMetaDataSize), d.readAsArrayBuffer(a.getSource());
                },
                _parse: function(a, c) {
                    if (!(a.byteLength < 6)) {
                        var d, e, f, g, h = new DataView(a), i = 2, j = h.byteLength - 4, k = i, l = {};
                        if (65496 === h.getUint16(0)) {
                            for (;j > i && (d = h.getUint16(i), d >= 65504 && 65519 >= d || 65534 === d) && (e = h.getUint16(i + 2) + 2, 
                            !(i + e > h.byteLength)); ) {
                                if (f = b.parsers[d], !c && f) for (g = 0; g < f.length; g += 1) f[g].call(b, h, i, e, l);
                                i += e, k = i;
                            }
                            k > 6 && (l.imageHead = a.slice ? a.slice(2, k) : new Uint8Array(a).subarray(2, k));
                        }
                        return l;
                    }
                },
                updateImageHead: function(a, b) {
                    var c, d, e, f = this._parse(a, !0);
                    return e = 2, f.imageHead && (e = 2 + f.imageHead.byteLength), d = a.slice ? a.slice(e) : new Uint8Array(a).subarray(e), 
                    c = new Uint8Array(b.byteLength + 2 + d.byteLength), c[0] = 255, c[1] = 216, c.set(new Uint8Array(b), 2), 
                    c.set(new Uint8Array(d), b.byteLength + 2), c.buffer;
                }
            }, a.parseMeta = function() {
                return b.parse.apply(b, arguments);
            }, a.updateImageHead = function() {
                return b.updateImageHead.apply(b, arguments);
            }, b;
        }), b("runtime/html5/imagemeta/exif", [ "base", "runtime/html5/imagemeta" ], function(a, b) {
            var c = {};
            return c.ExifMap = function() {
                return this;
            }, c.ExifMap.prototype.map = {
                Orientation: 274
            }, c.ExifMap.prototype.get = function(a) {
                return this[a] || this[this.map[a]];
            }, c.exifTagTypes = {
                1: {
                    getValue: function(a, b) {
                        return a.getUint8(b);
                    },
                    size: 1
                },
                2: {
                    getValue: function(a, b) {
                        return String.fromCharCode(a.getUint8(b));
                    },
                    size: 1,
                    ascii: !0
                },
                3: {
                    getValue: function(a, b, c) {
                        return a.getUint16(b, c);
                    },
                    size: 2
                },
                4: {
                    getValue: function(a, b, c) {
                        return a.getUint32(b, c);
                    },
                    size: 4
                },
                5: {
                    getValue: function(a, b, c) {
                        return a.getUint32(b, c) / a.getUint32(b + 4, c);
                    },
                    size: 8
                },
                9: {
                    getValue: function(a, b, c) {
                        return a.getInt32(b, c);
                    },
                    size: 4
                },
                10: {
                    getValue: function(a, b, c) {
                        return a.getInt32(b, c) / a.getInt32(b + 4, c);
                    },
                    size: 8
                }
            }, c.exifTagTypes[7] = c.exifTagTypes[1], c.getExifValue = function(b, d, e, f, g, h) {
                var i, j, k, l, m, n, o = c.exifTagTypes[f];
                if (!o) return void a.log("Invalid Exif data: Invalid tag type.");
                if (i = o.size * g, j = i > 4 ? d + b.getUint32(e + 8, h) : e + 8, j + i > b.byteLength) return void a.log("Invalid Exif data: Invalid data offset.");
                if (1 === g) return o.getValue(b, j, h);
                for (k = [], l = 0; g > l; l += 1) k[l] = o.getValue(b, j + l * o.size, h);
                if (o.ascii) {
                    for (m = "", l = 0; l < k.length && (n = k[l], "\0" !== n); l += 1) m += n;
                    return m;
                }
                return k;
            }, c.parseExifTag = function(a, b, d, e, f) {
                var g = a.getUint16(d, e);
                f.exif[g] = c.getExifValue(a, b, d, a.getUint16(d + 2, e), a.getUint32(d + 4, e), e);
            }, c.parseExifTags = function(b, c, d, e, f) {
                var g, h, i;
                if (d + 6 > b.byteLength) return void a.log("Invalid Exif data: Invalid directory offset.");
                if (g = b.getUint16(d, e), h = d + 2 + 12 * g, h + 4 > b.byteLength) return void a.log("Invalid Exif data: Invalid directory size.");
                for (i = 0; g > i; i += 1) this.parseExifTag(b, c, d + 2 + 12 * i, e, f);
                return b.getUint32(h, e);
            }, c.parseExifData = function(b, d, e, f) {
                var g, h, i = d + 10;
                if (1165519206 === b.getUint32(d + 4)) {
                    if (i + 8 > b.byteLength) return void a.log("Invalid Exif data: Invalid segment size.");
                    if (0 !== b.getUint16(d + 8)) return void a.log("Invalid Exif data: Missing byte alignment offset.");
                    switch (b.getUint16(i)) {
                      case 18761:
                        g = !0;
                        break;

                      case 19789:
                        g = !1;
                        break;

                      default:
                        return void a.log("Invalid Exif data: Invalid byte alignment marker.");
                    }
                    if (42 !== b.getUint16(i + 2, g)) return void a.log("Invalid Exif data: Missing TIFF marker.");
                    h = b.getUint32(i + 4, g), f.exif = new c.ExifMap(), h = c.parseExifTags(b, i, i + h, g, f);
                }
            }, b.parsers[65505].push(c.parseExifData), c;
        }), b("runtime/html5/jpegencoder", [], function() {
            function a(a) {
                function b(a) {
                    for (var b = [ 16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99 ], c = 0; 64 > c; c++) {
                        var d = y((b[c] * a + 50) / 100);
                        1 > d ? d = 1 : d > 255 && (d = 255), z[P[c]] = d;
                    }
                    for (var e = [ 17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99 ], f = 0; 64 > f; f++) {
                        var g = y((e[f] * a + 50) / 100);
                        1 > g ? g = 1 : g > 255 && (g = 255), A[P[f]] = g;
                    }
                    for (var h = [ 1, 1.387039845, 1.306562965, 1.175875602, 1, .785694958, .5411961, .275899379 ], i = 0, j = 0; 8 > j; j++) for (var k = 0; 8 > k; k++) B[i] = 1 / (z[P[i]] * h[j] * h[k] * 8), 
                    C[i] = 1 / (A[P[i]] * h[j] * h[k] * 8), i++;
                }
                function c(a, b) {
                    for (var c = 0, d = 0, e = new Array(), f = 1; 16 >= f; f++) {
                        for (var g = 1; g <= a[f]; g++) e[b[d]] = [], e[b[d]][0] = c, e[b[d]][1] = f, d++, 
                        c++;
                        c *= 2;
                    }
                    return e;
                }
                function d() {
                    t = c(Q, R), u = c(U, V), v = c(S, T), w = c(W, X);
                }
                function e() {
                    for (var a = 1, b = 2, c = 1; 15 >= c; c++) {
                        for (var d = a; b > d; d++) E[32767 + d] = c, D[32767 + d] = [], D[32767 + d][1] = c, 
                        D[32767 + d][0] = d;
                        for (var e = -(b - 1); -a >= e; e++) E[32767 + e] = c, D[32767 + e] = [], D[32767 + e][1] = c, 
                        D[32767 + e][0] = b - 1 + e;
                        a <<= 1, b <<= 1;
                    }
                }
                function f() {
                    for (var a = 0; 256 > a; a++) O[a] = 19595 * a, O[a + 256 >> 0] = 38470 * a, O[a + 512 >> 0] = 7471 * a + 32768, 
                    O[a + 768 >> 0] = -11059 * a, O[a + 1024 >> 0] = -21709 * a, O[a + 1280 >> 0] = 32768 * a + 8421375, 
                    O[a + 1536 >> 0] = -27439 * a, O[a + 1792 >> 0] = -5329 * a;
                }
                function g(a) {
                    for (var b = a[0], c = a[1] - 1; c >= 0; ) b & 1 << c && (I |= 1 << J), c--, J--, 
                    0 > J && (255 == I ? (h(255), h(0)) : h(I), J = 7, I = 0);
                }
                function h(a) {
                    H.push(N[a]);
                }
                function i(a) {
                    h(a >> 8 & 255), h(255 & a);
                }
                function j(a, b) {
                    var c, d, e, f, g, h, i, j, k, l = 0, m = 8, n = 64;
                    for (k = 0; m > k; ++k) {
                        c = a[l], d = a[l + 1], e = a[l + 2], f = a[l + 3], g = a[l + 4], h = a[l + 5], 
                        i = a[l + 6], j = a[l + 7];
                        var o = c + j, p = c - j, q = d + i, r = d - i, s = e + h, t = e - h, u = f + g, v = f - g, w = o + u, x = o - u, y = q + s, z = q - s;
                        a[l] = w + y, a[l + 4] = w - y;
                        var A = .707106781 * (z + x);
                        a[l + 2] = x + A, a[l + 6] = x - A, w = v + t, y = t + r, z = r + p;
                        var B = .382683433 * (w - z), C = .5411961 * w + B, D = 1.306562965 * z + B, E = .707106781 * y, G = p + E, H = p - E;
                        a[l + 5] = H + C, a[l + 3] = H - C, a[l + 1] = G + D, a[l + 7] = G - D, l += 8;
                    }
                    for (l = 0, k = 0; m > k; ++k) {
                        c = a[l], d = a[l + 8], e = a[l + 16], f = a[l + 24], g = a[l + 32], h = a[l + 40], 
                        i = a[l + 48], j = a[l + 56];
                        var I = c + j, J = c - j, K = d + i, L = d - i, M = e + h, N = e - h, O = f + g, P = f - g, Q = I + O, R = I - O, S = K + M, T = K - M;
                        a[l] = Q + S, a[l + 32] = Q - S;
                        var U = .707106781 * (T + R);
                        a[l + 16] = R + U, a[l + 48] = R - U, Q = P + N, S = N + L, T = L + J;
                        var V = .382683433 * (Q - T), W = .5411961 * Q + V, X = 1.306562965 * T + V, Y = .707106781 * S, Z = J + Y, $ = J - Y;
                        a[l + 40] = $ + W, a[l + 24] = $ - W, a[l + 8] = Z + X, a[l + 56] = Z - X, l++;
                    }
                    var _;
                    for (k = 0; n > k; ++k) _ = a[k] * b[k], F[k] = _ > 0 ? _ + .5 | 0 : _ - .5 | 0;
                    return F;
                }
                function k() {
                    i(65504), i(16), h(74), h(70), h(73), h(70), h(0), h(1), h(1), h(0), i(1), i(1), 
                    h(0), h(0);
                }
                function l(a, b) {
                    i(65472), i(17), h(8), i(b), i(a), h(3), h(1), h(17), h(0), h(2), h(17), h(1), h(3), 
                    h(17), h(1);
                }
                function m() {
                    i(65499), i(132), h(0);
                    for (var a = 0; 64 > a; a++) h(z[a]);
                    h(1);
                    for (var b = 0; 64 > b; b++) h(A[b]);
                }
                function n() {
                    i(65476), i(418), h(0);
                    for (var a = 0; 16 > a; a++) h(Q[a + 1]);
                    for (var b = 0; 11 >= b; b++) h(R[b]);
                    h(16);
                    for (var c = 0; 16 > c; c++) h(S[c + 1]);
                    for (var d = 0; 161 >= d; d++) h(T[d]);
                    h(1);
                    for (var e = 0; 16 > e; e++) h(U[e + 1]);
                    for (var f = 0; 11 >= f; f++) h(V[f]);
                    h(17);
                    for (var g = 0; 16 > g; g++) h(W[g + 1]);
                    for (var j = 0; 161 >= j; j++) h(X[j]);
                }
                function o() {
                    i(65498), i(12), h(3), h(1), h(0), h(2), h(17), h(3), h(17), h(0), h(63), h(0);
                }
                function p(a, b, c, d, e) {
                    for (var f, h = e[0], i = e[240], k = 16, l = 63, m = 64, n = j(a, b), o = 0; m > o; ++o) G[P[o]] = n[o];
                    var p = G[0] - c;
                    c = G[0], 0 == p ? g(d[0]) : (f = 32767 + p, g(d[E[f]]), g(D[f]));
                    for (var q = 63; q > 0 && 0 == G[q]; q--) ;
                    if (0 == q) return g(h), c;
                    for (var r, s = 1; q >= s; ) {
                        for (var t = s; 0 == G[s] && q >= s; ++s) ;
                        var u = s - t;
                        if (u >= k) {
                            r = u >> 4;
                            for (var v = 1; r >= v; ++v) g(i);
                            u = 15 & u;
                        }
                        f = 32767 + G[s], g(e[(u << 4) + E[f]]), g(D[f]), s++;
                    }
                    return q != l && g(h), c;
                }
                function q() {
                    for (var a = String.fromCharCode, b = 0; 256 > b; b++) N[b] = a(b);
                }
                function r(a) {
                    if (0 >= a && (a = 1), a > 100 && (a = 100), x != a) {
                        var c = 0;
                        c = Math.floor(50 > a ? 5e3 / a : 200 - 2 * a), b(c), x = a;
                    }
                }
                function s() {
                    a || (a = 50), q(), d(), e(), f(), r(a);
                }
                var t, u, v, w, x, y = (Math.round, Math.floor), z = new Array(64), A = new Array(64), B = new Array(64), C = new Array(64), D = new Array(65535), E = new Array(65535), F = new Array(64), G = new Array(64), H = [], I = 0, J = 7, K = new Array(64), L = new Array(64), M = new Array(64), N = new Array(256), O = new Array(2048), P = [ 0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53, 10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63 ], Q = [ 0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0 ], R = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ], S = [ 0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125 ], T = [ 1, 2, 3, 0, 4, 17, 5, 18, 33, 49, 65, 6, 19, 81, 97, 7, 34, 113, 20, 50, 129, 145, 161, 8, 35, 66, 177, 193, 21, 82, 209, 240, 36, 51, 98, 114, 130, 9, 10, 22, 23, 24, 25, 26, 37, 38, 39, 40, 41, 42, 52, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 131, 132, 133, 134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250 ], U = [ 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ], V = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ], W = [ 0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119 ], X = [ 0, 1, 2, 3, 17, 4, 5, 33, 49, 6, 18, 65, 81, 7, 97, 113, 19, 34, 50, 129, 8, 20, 66, 145, 161, 177, 193, 9, 35, 51, 82, 240, 21, 98, 114, 209, 10, 22, 36, 52, 225, 37, 241, 23, 24, 25, 26, 38, 39, 40, 41, 42, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 130, 131, 132, 133, 134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 226, 227, 228, 229, 230, 231, 232, 233, 234, 242, 243, 244, 245, 246, 247, 248, 249, 250 ];
                this.encode = function(a, b) {
                    b && r(b), H = new Array(), I = 0, J = 7, i(65496), k(), m(), l(a.width, a.height), 
                    n(), o();
                    var c = 0, d = 0, e = 0;
                    I = 0, J = 7, this.encode.displayName = "_encode_";
                    for (var f, h, j, q, s, x, y, z, A, D = a.data, E = a.width, F = a.height, G = 4 * E, N = 0; F > N; ) {
                        for (f = 0; G > f; ) {
                            for (s = G * N + f, x = s, y = -1, z = 0, A = 0; 64 > A; A++) z = A >> 3, y = 4 * (7 & A), 
                            x = s + z * G + y, N + z >= F && (x -= G * (N + 1 + z - F)), f + y >= G && (x -= f + y - G + 4), 
                            h = D[x++], j = D[x++], q = D[x++], K[A] = (O[h] + O[j + 256 >> 0] + O[q + 512 >> 0] >> 16) - 128, 
                            L[A] = (O[h + 768 >> 0] + O[j + 1024 >> 0] + O[q + 1280 >> 0] >> 16) - 128, M[A] = (O[h + 1280 >> 0] + O[j + 1536 >> 0] + O[q + 1792 >> 0] >> 16) - 128;
                            c = p(K, B, c, t, v), d = p(L, C, d, u, w), e = p(M, C, e, u, w), f += 32;
                        }
                        N += 8;
                    }
                    if (J >= 0) {
                        var P = [];
                        P[1] = J + 1, P[0] = (1 << J + 1) - 1, g(P);
                    }
                    i(65497);
                    var Q = "data:image/jpeg;base64," + btoa(H.join(""));
                    return H = [], Q;
                }, s();
            }
            return a.encode = function(b, c) {
                var d = new a(c);
                return d.encode(b);
            }, a;
        }), b("runtime/html5/androidpatch", [ "runtime/html5/util", "runtime/html5/jpegencoder", "base" ], function(a, b, c) {
            var d, e = a.canvasToDataUrl;
            a.canvasToDataUrl = function(a, f, g) {
                var h, i, j, k, l;
                return c.os.android ? ("image/jpeg" === f && "undefined" == typeof d && (k = e.apply(null, arguments), 
                l = k.split(","), k = ~l[0].indexOf("base64") ? atob(l[1]) : decodeURIComponent(l[1]), 
                k = k.substring(0, 2), d = 255 === k.charCodeAt(0) && 216 === k.charCodeAt(1)), 
                "image/jpeg" !== f || d ? e.apply(null, arguments) : (i = a.width, j = a.height, 
                h = a.getContext("2d"), b.encode(h.getImageData(0, 0, i, j), g))) : e.apply(null, arguments);
            };
        }), b("runtime/html5/image", [ "base", "runtime/html5/runtime", "runtime/html5/util" ], function(a, b, c) {
            var d = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
            return b.register("Image", {
                modified: !1,
                init: function() {
                    var a = this, b = new Image();
                    b.onload = function() {
                        a._info = {
                            type: a.type,
                            width: this.width,
                            height: this.height
                        }, a._metas || "image/jpeg" !== a.type ? a.owner.trigger("load") : c.parseMeta(a._blob, function(b, c) {
                            a._metas = c, a.owner.trigger("load");
                        });
                    }, b.onerror = function() {
                        a.owner.trigger("error");
                    }, a._img = b;
                },
                loadFromBlob: function(a) {
                    var b = this, d = b._img;
                    b._blob = a, b.type = a.type, d.src = c.createObjectURL(a.getSource()), b.owner.once("load", function() {
                        c.revokeObjectURL(d.src);
                    });
                },
                resize: function(a, b) {
                    var c = this._canvas || (this._canvas = document.createElement("canvas"));
                    this._resize(this._img, c, a, b), this._blob = null, this.modified = !0, this.owner.trigger("complete", "resize");
                },
                crop: function(a, b, c, d, e) {
                    var f = this._canvas || (this._canvas = document.createElement("canvas")), g = this.options, h = this._img, i = h.naturalWidth, j = h.naturalHeight, k = this.getOrientation();
                    e = e || 1, f.width = c, f.height = d, g.preserveHeaders || this._rotate2Orientaion(f, k), 
                    this._renderImageToCanvas(f, h, -a, -b, i * e, j * e), this._blob = null, this.modified = !0, 
                    this.owner.trigger("complete", "crop");
                },
                getAsBlob: function(a) {
                    var b, d = this._blob, e = this.options;
                    if (a = a || this.type, this.modified || this.type !== a) {
                        if (b = this._canvas, "image/jpeg" === a) {
                            if (d = c.canvasToDataUrl(b, a, e.quality), e.preserveHeaders && this._metas && this._metas.imageHead) return d = c.dataURL2ArrayBuffer(d), 
                            d = c.updateImageHead(d, this._metas.imageHead), d = c.arrayBufferToBlob(d, a);
                        } else d = c.canvasToDataUrl(b, a);
                        d = c.dataURL2Blob(d);
                    }
                    return d;
                },
                getAsDataUrl: function(a) {
                    var b = this.options;
                    return a = a || this.type, "image/jpeg" === a ? c.canvasToDataUrl(this._canvas, a, b.quality) : this._canvas.toDataURL(a);
                },
                getOrientation: function() {
                    return this._metas && this._metas.exif && this._metas.exif.get("Orientation") || 1;
                },
                info: function(a) {
                    return a ? (this._info = a, this) : this._info;
                },
                meta: function(a) {
                    return a ? (this._meta = a, this) : this._meta;
                },
                destroy: function() {
                    var a = this._canvas;
                    this._img.onload = null, a && (a.getContext("2d").clearRect(0, 0, a.width, a.height), 
                    a.width = a.height = 0, this._canvas = null), this._img.src = d, this._img = this._blob = null;
                },
                _resize: function(a, b, c, d) {
                    var e, f, g, h, i, j = this.options, k = a.width, l = a.height, m = this.getOrientation();
                    ~[ 5, 6, 7, 8 ].indexOf(m) && (c ^= d, d ^= c, c ^= d), e = Math[j.crop ? "max" : "min"](c / k, d / l), 
                    j.allowMagnify || (e = Math.min(1, e)), f = k * e, g = l * e, j.crop ? (b.width = c, 
                    b.height = d) : (b.width = f, b.height = g), h = (b.width - f) / 2, i = (b.height - g) / 2, 
                    j.preserveHeaders || this._rotate2Orientaion(b, m), this._renderImageToCanvas(b, a, h, i, f, g);
                },
                _rotate2Orientaion: function(a, b) {
                    var c = a.width, d = a.height, e = a.getContext("2d");
                    switch (b) {
                      case 5:
                      case 6:
                      case 7:
                      case 8:
                        a.width = d, a.height = c;
                    }
                    switch (b) {
                      case 2:
                        e.translate(c, 0), e.scale(-1, 1);
                        break;

                      case 3:
                        e.translate(c, d), e.rotate(Math.PI);
                        break;

                      case 4:
                        e.translate(0, d), e.scale(1, -1);
                        break;

                      case 5:
                        e.rotate(.5 * Math.PI), e.scale(1, -1);
                        break;

                      case 6:
                        e.rotate(.5 * Math.PI), e.translate(0, -d);
                        break;

                      case 7:
                        e.rotate(.5 * Math.PI), e.translate(c, -d), e.scale(-1, 1);
                        break;

                      case 8:
                        e.rotate(-.5 * Math.PI), e.translate(-c, 0);
                    }
                },
                _renderImageToCanvas: function() {
                    function b(a, b, c) {
                        var d, e, f, g = document.createElement("canvas"), h = g.getContext("2d"), i = 0, j = c, k = c;
                        for (g.width = 1, g.height = c, h.drawImage(a, 0, 0), d = h.getImageData(0, 0, 1, c).data; k > i; ) e = d[4 * (k - 1) + 3], 
                        0 === e ? j = k : i = k, k = j + i >> 1;
                        return f = k / c, 0 === f ? 1 : f;
                    }
                    function c(a) {
                        var b, c, d = a.naturalWidth, e = a.naturalHeight;
                        return d * e > 1048576 ? (b = document.createElement("canvas"), b.width = b.height = 1, 
                        c = b.getContext("2d"), c.drawImage(a, -d + 1, 0), 0 === c.getImageData(0, 0, 1, 1).data[3]) : !1;
                    }
                    return a.os.ios ? a.os.ios >= 7 ? function(a, c, d, e, f, g) {
                        var h = c.naturalWidth, i = c.naturalHeight, j = b(c, h, i);
                        return a.getContext("2d").drawImage(c, 0, 0, h * j, i * j, d, e, f, g);
                    } : function(a, d, e, f, g, h) {
                        var i, j, k, l, m, n, o, p = d.naturalWidth, q = d.naturalHeight, r = a.getContext("2d"), s = c(d), t = "image/jpeg" === this.type, u = 1024, v = 0, w = 0;
                        for (s && (p /= 2, q /= 2), r.save(), i = document.createElement("canvas"), i.width = i.height = u, 
                        j = i.getContext("2d"), k = t ? b(d, p, q) : 1, l = Math.ceil(u * g / p), m = Math.ceil(u * h / q / k); q > v; ) {
                            for (n = 0, o = 0; p > n; ) j.clearRect(0, 0, u, u), j.drawImage(d, -n, -v), r.drawImage(i, 0, 0, u, u, e + o, f + w, l, m), 
                            n += u, o += l;
                            v += u, w += m;
                        }
                        r.restore(), i = j = null;
                    } : function(b) {
                        var c = a.slice(arguments, 1), d = b.getContext("2d");
                        d.drawImage.apply(d, c);
                    };
                }()
            });
        }), b("runtime/html5/transport", [ "base", "runtime/html5/runtime" ], function(a, b) {
            var c = a.noop, d = a.$;
            return b.register("Transport", {
                init: function() {
                    this._status = 0, this._response = null;
                },
                send: function() {
                    var b, c, e, f = this.owner, g = this.options, h = this._initAjax(), i = f._blob, j = g.server;
                    g.sendAsBinary ? (j += (/\?/.test(j) ? "&" : "?") + d.param(f._formData), c = i.getSource()) : (b = new FormData(), 
                    d.each(f._formData, function(a, c) {
                        b.append(a, c);
                    }), b.append(g.fileVal, i.getSource(), g.filename || f._formData.name || "")), g.withCredentials && "withCredentials" in h ? (h.open(g.method, j, !0), 
                    h.withCredentials = !0) : h.open(g.method, j), this._setRequestHeader(h, g.headers), 
                    c ? (h.overrideMimeType && h.overrideMimeType("application/octet-stream"), a.os.android ? (e = new FileReader(), 
                    e.onload = function() {
                        h.send(this.result), e = e.onload = null;
                    }, e.readAsArrayBuffer(c)) : h.send(c)) : h.send(b);
                },
                getResponse: function() {
                    return this._response;
                },
                getResponseAsJson: function() {
                    return this._parseJson(this._response);
                },
                getStatus: function() {
                    return this._status;
                },
                abort: function() {
                    var a = this._xhr;
                    a && (a.upload.onprogress = c, a.onreadystatechange = c, a.abort(), this._xhr = a = null);
                },
                destroy: function() {
                    this.abort();
                },
                _initAjax: function() {
                    var a = this, b = new XMLHttpRequest(), d = this.options;
                    return !d.withCredentials || "withCredentials" in b || "undefined" == typeof XDomainRequest || (b = new XDomainRequest()), 
                    b.upload.onprogress = function(b) {
                        var c = 0;
                        return b.lengthComputable && (c = b.loaded / b.total), a.trigger("progress", c);
                    }, b.onreadystatechange = function() {
                        return 4 === b.readyState ? (b.upload.onprogress = c, b.onreadystatechange = c, 
                        a._xhr = null, a._status = b.status, b.status >= 200 && b.status < 300 ? (a._response = b.responseText, 
                        a.trigger("load")) : b.status >= 500 && b.status < 600 ? (a._response = b.responseText, 
                        a.trigger("error", "server")) : a.trigger("error", a._status ? "http" : "abort")) : void 0;
                    }, a._xhr = b, b;
                },
                _setRequestHeader: function(a, b) {
                    d.each(b, function(b, c) {
                        a.setRequestHeader(b, c);
                    });
                },
                _parseJson: function(a) {
                    var b;
                    try {
                        b = JSON.parse(a);
                    } catch (c) {
                        b = {};
                    }
                    return b;
                }
            });
        }), b("runtime/html5/md5", [ "runtime/html5/runtime" ], function(a) {
            var b = function(a, b) {
                return a + b & 4294967295;
            }, c = function(a, c, d, e, f, g) {
                return c = b(b(c, a), b(e, g)), b(c << f | c >>> 32 - f, d);
            }, d = function(a, b, d, e, f, g, h) {
                return c(b & d | ~b & e, a, b, f, g, h);
            }, e = function(a, b, d, e, f, g, h) {
                return c(b & e | d & ~e, a, b, f, g, h);
            }, f = function(a, b, d, e, f, g, h) {
                return c(b ^ d ^ e, a, b, f, g, h);
            }, g = function(a, b, d, e, f, g, h) {
                return c(d ^ (b | ~e), a, b, f, g, h);
            }, h = function(a, c) {
                var h = a[0], i = a[1], j = a[2], k = a[3];
                h = d(h, i, j, k, c[0], 7, -680876936), k = d(k, h, i, j, c[1], 12, -389564586), 
                j = d(j, k, h, i, c[2], 17, 606105819), i = d(i, j, k, h, c[3], 22, -1044525330), 
                h = d(h, i, j, k, c[4], 7, -176418897), k = d(k, h, i, j, c[5], 12, 1200080426), 
                j = d(j, k, h, i, c[6], 17, -1473231341), i = d(i, j, k, h, c[7], 22, -45705983), 
                h = d(h, i, j, k, c[8], 7, 1770035416), k = d(k, h, i, j, c[9], 12, -1958414417), 
                j = d(j, k, h, i, c[10], 17, -42063), i = d(i, j, k, h, c[11], 22, -1990404162), 
                h = d(h, i, j, k, c[12], 7, 1804603682), k = d(k, h, i, j, c[13], 12, -40341101), 
                j = d(j, k, h, i, c[14], 17, -1502002290), i = d(i, j, k, h, c[15], 22, 1236535329), 
                h = e(h, i, j, k, c[1], 5, -165796510), k = e(k, h, i, j, c[6], 9, -1069501632), 
                j = e(j, k, h, i, c[11], 14, 643717713), i = e(i, j, k, h, c[0], 20, -373897302), 
                h = e(h, i, j, k, c[5], 5, -701558691), k = e(k, h, i, j, c[10], 9, 38016083), j = e(j, k, h, i, c[15], 14, -660478335), 
                i = e(i, j, k, h, c[4], 20, -405537848), h = e(h, i, j, k, c[9], 5, 568446438), 
                k = e(k, h, i, j, c[14], 9, -1019803690), j = e(j, k, h, i, c[3], 14, -187363961), 
                i = e(i, j, k, h, c[8], 20, 1163531501), h = e(h, i, j, k, c[13], 5, -1444681467), 
                k = e(k, h, i, j, c[2], 9, -51403784), j = e(j, k, h, i, c[7], 14, 1735328473), 
                i = e(i, j, k, h, c[12], 20, -1926607734), h = f(h, i, j, k, c[5], 4, -378558), 
                k = f(k, h, i, j, c[8], 11, -2022574463), j = f(j, k, h, i, c[11], 16, 1839030562), 
                i = f(i, j, k, h, c[14], 23, -35309556), h = f(h, i, j, k, c[1], 4, -1530992060), 
                k = f(k, h, i, j, c[4], 11, 1272893353), j = f(j, k, h, i, c[7], 16, -155497632), 
                i = f(i, j, k, h, c[10], 23, -1094730640), h = f(h, i, j, k, c[13], 4, 681279174), 
                k = f(k, h, i, j, c[0], 11, -358537222), j = f(j, k, h, i, c[3], 16, -722521979), 
                i = f(i, j, k, h, c[6], 23, 76029189), h = f(h, i, j, k, c[9], 4, -640364487), k = f(k, h, i, j, c[12], 11, -421815835), 
                j = f(j, k, h, i, c[15], 16, 530742520), i = f(i, j, k, h, c[2], 23, -995338651), 
                h = g(h, i, j, k, c[0], 6, -198630844), k = g(k, h, i, j, c[7], 10, 1126891415), 
                j = g(j, k, h, i, c[14], 15, -1416354905), i = g(i, j, k, h, c[5], 21, -57434055), 
                h = g(h, i, j, k, c[12], 6, 1700485571), k = g(k, h, i, j, c[3], 10, -1894986606), 
                j = g(j, k, h, i, c[10], 15, -1051523), i = g(i, j, k, h, c[1], 21, -2054922799), 
                h = g(h, i, j, k, c[8], 6, 1873313359), k = g(k, h, i, j, c[15], 10, -30611744), 
                j = g(j, k, h, i, c[6], 15, -1560198380), i = g(i, j, k, h, c[13], 21, 1309151649), 
                h = g(h, i, j, k, c[4], 6, -145523070), k = g(k, h, i, j, c[11], 10, -1120210379), 
                j = g(j, k, h, i, c[2], 15, 718787259), i = g(i, j, k, h, c[9], 21, -343485551), 
                a[0] = b(h, a[0]), a[1] = b(i, a[1]), a[2] = b(j, a[2]), a[3] = b(k, a[3]);
            }, i = function(a) {
                var b, c = [];
                for (b = 0; 64 > b; b += 4) c[b >> 2] = a.charCodeAt(b) + (a.charCodeAt(b + 1) << 8) + (a.charCodeAt(b + 2) << 16) + (a.charCodeAt(b + 3) << 24);
                return c;
            }, j = function(a) {
                var b, c = [];
                for (b = 0; 64 > b; b += 4) c[b >> 2] = a[b] + (a[b + 1] << 8) + (a[b + 2] << 16) + (a[b + 3] << 24);
                return c;
            }, k = function(a) {
                var b, c, d, e, f, g, j = a.length, k = [ 1732584193, -271733879, -1732584194, 271733878 ];
                for (b = 64; j >= b; b += 64) h(k, i(a.substring(b - 64, b)));
                for (a = a.substring(b - 64), c = a.length, d = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                b = 0; c > b; b += 1) d[b >> 2] |= a.charCodeAt(b) << (b % 4 << 3);
                if (d[b >> 2] |= 128 << (b % 4 << 3), b > 55) for (h(k, d), b = 0; 16 > b; b += 1) d[b] = 0;
                return e = 8 * j, e = e.toString(16).match(/(.*?)(.{0,8})$/), f = parseInt(e[2], 16), 
                g = parseInt(e[1], 16) || 0, d[14] = f, d[15] = g, h(k, d), k;
            }, l = function(a) {
                var b, c, d, e, f, g, i = a.length, k = [ 1732584193, -271733879, -1732584194, 271733878 ];
                for (b = 64; i >= b; b += 64) h(k, j(a.subarray(b - 64, b)));
                for (a = i > b - 64 ? a.subarray(b - 64) : new Uint8Array(0), c = a.length, d = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                b = 0; c > b; b += 1) d[b >> 2] |= a[b] << (b % 4 << 3);
                if (d[b >> 2] |= 128 << (b % 4 << 3), b > 55) for (h(k, d), b = 0; 16 > b; b += 1) d[b] = 0;
                return e = 8 * i, e = e.toString(16).match(/(.*?)(.{0,8})$/), f = parseInt(e[2], 16), 
                g = parseInt(e[1], 16) || 0, d[14] = f, d[15] = g, h(k, d), k;
            }, m = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f" ], n = function(a) {
                var b, c = "";
                for (b = 0; 4 > b; b += 1) c += m[a >> 8 * b + 4 & 15] + m[a >> 8 * b & 15];
                return c;
            }, o = function(a) {
                var b;
                for (b = 0; b < a.length; b += 1) a[b] = n(a[b]);
                return a.join("");
            }, p = function(a) {
                return o(k(a));
            }, q = function() {
                this.reset();
            };
            return "5d41402abc4b2a76b9719d911017c592" !== p("hello") && (b = function(a, b) {
                var c = (65535 & a) + (65535 & b), d = (a >> 16) + (b >> 16) + (c >> 16);
                return d << 16 | 65535 & c;
            }), q.prototype.append = function(a) {
                return /[\u0080-\uFFFF]/.test(a) && (a = unescape(encodeURIComponent(a))), this.appendBinary(a), 
                this;
            }, q.prototype.appendBinary = function(a) {
                this._buff += a, this._length += a.length;
                var b, c = this._buff.length;
                for (b = 64; c >= b; b += 64) h(this._state, i(this._buff.substring(b - 64, b)));
                return this._buff = this._buff.substr(b - 64), this;
            }, q.prototype.end = function(a) {
                var b, c, d = this._buff, e = d.length, f = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                for (b = 0; e > b; b += 1) f[b >> 2] |= d.charCodeAt(b) << (b % 4 << 3);
                return this._finish(f, e), c = a ? this._state : o(this._state), this.reset(), c;
            }, q.prototype._finish = function(a, b) {
                var c, d, e, f = b;
                if (a[f >> 2] |= 128 << (f % 4 << 3), f > 55) for (h(this._state, a), f = 0; 16 > f; f += 1) a[f] = 0;
                c = 8 * this._length, c = c.toString(16).match(/(.*?)(.{0,8})$/), d = parseInt(c[2], 16), 
                e = parseInt(c[1], 16) || 0, a[14] = d, a[15] = e, h(this._state, a);
            }, q.prototype.reset = function() {
                return this._buff = "", this._length = 0, this._state = [ 1732584193, -271733879, -1732584194, 271733878 ], 
                this;
            }, q.prototype.destroy = function() {
                delete this._state, delete this._buff, delete this._length;
            }, q.hash = function(a, b) {
                /[\u0080-\uFFFF]/.test(a) && (a = unescape(encodeURIComponent(a)));
                var c = k(a);
                return b ? c : o(c);
            }, q.hashBinary = function(a, b) {
                var c = k(a);
                return b ? c : o(c);
            }, q.ArrayBuffer = function() {
                this.reset();
            }, q.ArrayBuffer.prototype.append = function(a) {
                var b, c = this._concatArrayBuffer(this._buff, a), d = c.length;
                for (this._length += a.byteLength, b = 64; d >= b; b += 64) h(this._state, j(c.subarray(b - 64, b)));
                return this._buff = d > b - 64 ? c.subarray(b - 64) : new Uint8Array(0), this;
            }, q.ArrayBuffer.prototype.end = function(a) {
                var b, c, d = this._buff, e = d.length, f = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                for (b = 0; e > b; b += 1) f[b >> 2] |= d[b] << (b % 4 << 3);
                return this._finish(f, e), c = a ? this._state : o(this._state), this.reset(), c;
            }, q.ArrayBuffer.prototype._finish = q.prototype._finish, q.ArrayBuffer.prototype.reset = function() {
                return this._buff = new Uint8Array(0), this._length = 0, this._state = [ 1732584193, -271733879, -1732584194, 271733878 ], 
                this;
            }, q.ArrayBuffer.prototype.destroy = q.prototype.destroy, q.ArrayBuffer.prototype._concatArrayBuffer = function(a, b) {
                var c = a.length, d = new Uint8Array(c + b.byteLength);
                return d.set(a), d.set(new Uint8Array(b), c), d;
            }, q.ArrayBuffer.hash = function(a, b) {
                var c = l(new Uint8Array(a));
                return b ? c : o(c);
            }, a.register("Md5", {
                init: function() {},
                loadFromBlob: function(a) {
                    var b, c, d = a.getSource(), e = 2097152, f = Math.ceil(d.size / e), g = 0, h = this.owner, i = new q.ArrayBuffer(), j = this, k = d.mozSlice || d.webkitSlice || d.slice;
                    c = new FileReader(), (b = function() {
                        var l, m;
                        l = g * e, m = Math.min(l + e, d.size), c.onload = function(b) {
                            i.append(b.target.result), h.trigger("progress", {
                                total: a.size,
                                loaded: m
                            });
                        }, c.onloadend = function() {
                            c.onloadend = c.onload = null, ++g < f ? setTimeout(b, 1) : setTimeout(function() {
                                h.trigger("load"), j.result = i.end(), b = a = d = i = null, h.trigger("complete");
                            }, 50);
                        }, c.readAsArrayBuffer(k.call(d, l, m));
                    })();
                },
                getResult: function() {
                    return this.result;
                }
            });
        }), b("runtime/flash/runtime", [ "base", "runtime/runtime", "runtime/compbase" ], function(b, c, d) {
            function e() {
                var a;
                try {
                    a = navigator.plugins["Shockwave Flash"], a = a.description;
                } catch (b) {
                    try {
                        a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version");
                    } catch (c) {
                        a = "0.0";
                    }
                }
                return a = a.match(/\d+/g), parseFloat(a[0] + "." + a[1], 10);
            }
            function f() {
                function d(a, b) {
                    var c, d, e = a.type || a;
                    c = e.split("::"), d = c[0], e = c[1], "Ready" === e && d === j.uid ? j.trigger("ready") : f[d] && f[d].trigger(e.toLowerCase(), a, b);
                }
                var e = {}, f = {}, g = this.destroy, j = this, k = b.guid("webuploader_");
                c.apply(j, arguments), j.type = h, j.exec = function(a, c) {
                    var d, g = this, h = g.uid, k = b.slice(arguments, 2);
                    return f[h] = g, i[a] && (e[h] || (e[h] = new i[a](g, j)), d = e[h], d[c]) ? d[c].apply(d, k) : j.flashExec.apply(g, arguments);
                }, a[k] = function() {
                    var a = arguments;
                    setTimeout(function() {
                        d.apply(null, a);
                    }, 1);
                }, this.jsreciver = k, this.destroy = function() {
                    return g && g.apply(this, arguments);
                }, this.flashExec = function(a, c) {
                    var d = j.getFlash(), e = b.slice(arguments, 2);
                    return d.exec(this.uid, a, c, e);
                };
            }
            var g = b.$, h = "flash", i = {};
            return b.inherits(c, {
                constructor: f,
                init: function() {
                    var a, c = this.getContainer(), d = this.options;
                    c.css({
                        position: "absolute",
                        top: "-8px",
                        left: "-8px",
                        width: "9px",
                        height: "9px",
                        overflow: "hidden"
                    }), a = '<object id="' + this.uid + '" type="application/x-shockwave-flash" data="' + d.swf + '" ', 
                    b.browser.ie && (a += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" '), 
                    a += 'width="100%" height="100%" style="outline:0"><param name="movie" value="' + d.swf + '" /><param name="flashvars" value="uid=' + this.uid + "&jsreciver=" + this.jsreciver + '" /><param name="wmode" value="transparent" /><param name="allowscriptaccess" value="always" /></object>', 
                    c.html(a);
                },
                getFlash: function() {
                    return this._flash ? this._flash : (this._flash = g("#" + this.uid).get(0), this._flash);
                }
            }), f.register = function(a, c) {
                return c = i[a] = b.inherits(d, g.extend({
                    flashExec: function() {
                        var a = this.owner, b = this.getRuntime();
                        return b.flashExec.apply(a, arguments);
                    }
                }, c));
            }, e() >= 11.4 && c.addRuntime(h, f), f;
        }), b("runtime/flash/filepicker", [ "base", "runtime/flash/runtime" ], function(a, b) {
            var c = a.$;
            return b.register("FilePicker", {
                init: function(a) {
                    var b, d, e = c.extend({}, a);
                    for (b = e.accept && e.accept.length, d = 0; b > d; d++) e.accept[d].title || (e.accept[d].title = "Files");
                    delete e.button, delete e.id, delete e.container, this.flashExec("FilePicker", "init", e);
                },
                destroy: function() {
                    this.flashExec("FilePicker", "destroy");
                }
            });
        }), b("runtime/flash/image", [ "runtime/flash/runtime" ], function(a) {
            return a.register("Image", {
                loadFromBlob: function(a) {
                    var b = this.owner;
                    b.info() && this.flashExec("Image", "info", b.info()), b.meta() && this.flashExec("Image", "meta", b.meta()), 
                    this.flashExec("Image", "loadFromBlob", a.uid);
                }
            });
        }), b("runtime/flash/transport", [ "base", "runtime/flash/runtime", "runtime/client" ], function(b, c, d) {
            var e = b.$;
            return c.register("Transport", {
                init: function() {
                    this._status = 0, this._response = null, this._responseJson = null;
                },
                send: function() {
                    var a, b = this.owner, c = this.options, d = this._initAjax(), f = b._blob, g = c.server;
                    d.connectRuntime(f.ruid), c.sendAsBinary ? (g += (/\?/.test(g) ? "&" : "?") + e.param(b._formData), 
                    a = f.uid) : (e.each(b._formData, function(a, b) {
                        d.exec("append", a, b);
                    }), d.exec("appendBlob", c.fileVal, f.uid, c.filename || b._formData.name || "")), 
                    this._setRequestHeader(d, c.headers), d.exec("send", {
                        method: c.method,
                        url: g,
                        forceURLStream: c.forceURLStream,
                        mimeType: "application/octet-stream"
                    }, a);
                },
                getStatus: function() {
                    return this._status;
                },
                getResponse: function() {
                    return this._response || "";
                },
                getResponseAsJson: function() {
                    return this._responseJson;
                },
                abort: function() {
                    var a = this._xhr;
                    a && (a.exec("abort"), a.destroy(), this._xhr = a = null);
                },
                destroy: function() {
                    this.abort();
                },
                _initAjax: function() {
                    var b = this, c = new d("XMLHttpRequest");
                    return c.on("uploadprogress progress", function(a) {
                        var c = a.loaded / a.total;
                        return c = Math.min(1, Math.max(0, c)), b.trigger("progress", c);
                    }), c.on("load", function() {
                        var d, e = c.exec("getStatus"), f = !1, g = "";
                        return c.off(), b._xhr = null, e >= 200 && 300 > e ? f = !0 : e >= 500 && 600 > e ? (f = !0, 
                        g = "server") : g = "http", f && (b._response = c.exec("getResponse"), b._response = decodeURIComponent(b._response), 
                        d = a.JSON && a.JSON.parse || function(a) {
                            try {
                                return new Function("return " + a).call();
                            } catch (b) {
                                return {};
                            }
                        }, b._responseJson = b._response ? d(b._response) : {}), c.destroy(), c = null, 
                        g ? b.trigger("error", g) : b.trigger("load");
                    }), c.on("error", function() {
                        c.off(), b._xhr = null, b.trigger("error", "http");
                    }), b._xhr = c, c;
                },
                _setRequestHeader: function(a, b) {
                    e.each(b, function(b, c) {
                        a.exec("setRequestHeader", b, c);
                    });
                }
            });
        }), b("runtime/flash/blob", [ "runtime/flash/runtime", "lib/blob" ], function(a, b) {
            return a.register("Blob", {
                slice: function(a, c) {
                    var d = this.flashExec("Blob", "slice", a, c);
                    return new b(d.uid, d);
                }
            });
        }), b("runtime/flash/md5", [ "runtime/flash/runtime" ], function(a) {
            return a.register("Md5", {
                init: function() {},
                loadFromBlob: function(a) {
                    return this.flashExec("Md5", "loadFromBlob", a.uid);
                }
            });
        }), b("preset/all", [ "base", "widgets/filednd", "widgets/filepaste", "widgets/filepicker", "widgets/image", "widgets/queue", "widgets/runtime", "widgets/upload", "widgets/validator", "widgets/md5", "runtime/html5/blob", "runtime/html5/dnd", "runtime/html5/filepaste", "runtime/html5/filepicker", "runtime/html5/imagemeta/exif", "runtime/html5/androidpatch", "runtime/html5/image", "runtime/html5/transport", "runtime/html5/md5", "runtime/flash/filepicker", "runtime/flash/image", "runtime/flash/transport", "runtime/flash/blob", "runtime/flash/md5" ], function(a) {
            return a;
        }), b("widgets/log", [ "base", "uploader", "widgets/widget" ], function(a, b) {
            function c(a) {
                var b = e.extend({}, d, a), c = f.replace(/^(.*)\?/, "$1" + e.param(b)), g = new Image();
                g.src = c;
            }
            var d, e = a.$, f = " http://static.tieba.baidu.com/tb/pms/img/st.gif??", g = (location.hostname || location.host || "protected").toLowerCase(), h = g && /baidu/i.exec(g);
            if (h) return d = {
                dv: 3,
                master: "webuploader",
                online: /test/.exec(g) ? 0 : 1,
                module: "",
                product: g,
                type: 0
            }, b.register({
                name: "log",
                init: function() {
                    var a = this.owner, b = 0, d = 0;
                    a.on("error", function(a) {
                        c({
                            type: 2,
                            c_error_code: a
                        });
                    }).on("uploadError", function(a, b) {
                        c({
                            type: 2,
                            c_error_code: "UPLOAD_ERROR",
                            c_reason: "" + b
                        });
                    }).on("uploadComplete", function(a) {
                        b++, d += a.size;
                    }).on("uploadFinished", function() {
                        c({
                            c_count: b,
                            c_size: d
                        }), b = d = 0;
                    }), c({
                        c_usage: 1
                    });
                }
            });
        }), b("webuploader", [ "preset/all", "widgets/log" ], function(a) {
            return a;
        }), c("webuploader");
    });
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

define("tpl/template_form-debug.html", [], '<!-- 产品模板管理编辑表单 -->\n{@if id != null}\n<input type="hidden" name="id" value="!{id}" />\n{@/if}\n<div class="form-group">\n	<label for="title">标题</label> <input type="text" class="form-control" id="title" name="title" placeholder="输入标题"\n		value="!{title}">\n</div>\n<div class="form-group">\n	<label for="content">正文</label>\n	<div class="container tp-form-content">\n		<input type="hidden" name="content" />\n		<div id="js_editor" class="edui_editor_wrp"></div>\n	</div>\n</div>');
