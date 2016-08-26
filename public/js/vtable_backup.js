(function() {
    //要插入的内容
    var innerHTML =
        '<form class="form-inline tools" onSubmit="return false">' +
        '<div class="form-group left">' +
        '<label>每页</label>' +
        '<select class="form-control input-sm" @change="pageLengthChange($event)">' +
        '<template v-for="item in pageMenu">' +
        '<option v-if="item == pageLength" value="{{item}}" selected="true">{{item}}</option>' +
        '<option v-else value="{{item}}">{{item}}</option>' +
        '</template>' +
        '</select>' +
        '<label>条</label>' +
        '</div>' +
        '<div class="form-group right">' +
        '<input type="text" class="form-control" placeholder="输入内容搜索" @change="searchEvent($event)">' +
        '</div>' +
        '</form>' +
        '<div class="tableContainer">' +
        '<table class="table table-bordered" @click="tableClickPoxy($event)">' +
        '<thead>' +
        '<tr>' +
        '<td v-show="edit" class="column operate">操作</td>' +
        '<td class="column index">序号</td>' +
        '<td class="column" v-for="item in thead" v-show="item.show!=false">{{item.name}}<span class="sortIcon asc {{$index==sortObj[0].columnIndex && sortObj[0].sortWay==\'asc\'?\'active\':\'\'}}">&uarr;</span>' +
        '<span class="sortIcon desc {{$index==sortObj[0].columnIndex && sortObj[0].sortWay==\'desc\'?\'active\':\'\'}}">&darr;</span>' +
        '</td>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr v-for="item in showRecord ">' +
        '<td v-show="edit"><span class="glyphicon glyphicon-pencil" @click="rowEdit($event)"></span>&nbsp;<span class="glyphicon glyphicon-trash" @click="rowDelete($event)"></span></td>' +
        '<td>{{$index+1}}</td>' +
        '<td v-for="sub in item" v-show="thead[$index].show!=false"><span class="content">{{sub.value}}</span><input v-model="sub.value"></td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="footer">' +
        '<div class="left">' +
        '<label>显示 {{startRecord}} - {{endRecord}} 条，共 {{totalRecord}} 条</label>' +
        '</div>' +
        '<div class="right">' +
        '<div class="btn-group" role="group" aria-label="..." @click="buttonGroupClick($event)">' +
        '<button type="button" class="btn btn-default" data-position="first">&laquo;' +
        '</button>' +
        '<button type="button" class="btn btn-default" data-position="prev">&lt;</button>' +
        '<template v-for="item in nowButtonGroup">' +
        '<button type="button" class="btn btn-default {{nowPage==item.name?\'btn-primary\':\'\'}}" data-position="{{item.name}}">{{item.name}}</button>' +
        '</template>' +
        '<button type="button" class="btn btn-default" data-position="next">&gt;</button>' +
        '<button type="button" class="btn btn-default" data-position="end">&raquo;</button>' +
        '</div>' +
        '<div class="jumpTo">跳转到&nbsp;<input type="number" value="1" min="1" max="{{buttons}}" @change="jumpChange($event)" />&nbsp;页</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal fade" id="defaultWindow" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" id="exampleModalLabel">编辑</h4>' +
        '</div>' +
        '<div class="modal-body">' +
        '<form>' +
        '<div class="form-group" v-for="item in nowEditRow" v-show="thead[$index].show!=false">' +
        '<label class="control-label">{{thead[$index].name}}</label>' +
        '<input type="text" class="form-control" v-model="item.value" @change="editColumn($event,$index)">' +
        '<span class="errorMsg" v-show="!item.checkOk">类型错误</span>'+
        '</div>' +
        '</form>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>' +
        '<button type="button" class="btn btn-primary" save>确定</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

    function makeVtable(vtableConfig) {
        var element = document.querySelector(vtableConfig.el);
        if (isEmpty(element)) {
            return;
        }
        element.innerHTML = innerHTML;

        //检查参数是否都合法
        var table = checkInputParam(vtableConfig);

        // 创建根实例
        var vm = new Vue({
            el: table.el,
            data: table,
            computed: {
                startRecord: function() {
                    return (this.nowPage - 1) * parseInt(this.pageLength) + 1;
                },
                //总记录
                totalRecord: function() {
                    var mode = this.mode;
                    if (mode == "person") {
                        this.total = this.total || 1;
                        return this.total;
                    } else {
                        return this.total;
                    }
                },
                //当页最后一条记录
                endRecord: function() {
                    var pageLength = this.pageLength;
                    var total = this.totalRecord;
                    var startRecord = parseInt(this.startRecord);

                    if (startRecord + pageLength > total) {
                        return total;
                    } else {
                        var end = startRecord + pageLength - 1;
                        return end;
                    }
                },
                //展示的记录
                showRecord: function() {
                    var pageLength = this.pageLength;
                    var total = this.totalRecord;
                    var tbody = this.tbody;
                    var start = this.startRecord;
                    var mode = this.mode;

                    if (mode == "person") {
                        //补上空位
                        var finalArray = tbody.slice(start - 1, start - 1 + pageLength);
                        if (finalArray.length < pageLength) {
                            var fillCount = pageLength - finalArray.length;
                            for (var i = 0; i < fillCount; i++) {
                                var emptyArray = [];
                                for (var j = 0; j < this.thead.length; j++) {
                                    emptyArray.push({
                                        value: "-"
                                    });
                                }
                                finalArray.push(emptyArray);
                            }
                        }

                        return finalArray;
                    } else {
                        //补上空位
                        if (tbody.length < pageLength) {
                            var fillCount = pageLength - tbody.length;
                            for (var i = 0; i < fillCount; i++) {
                                var emptyArray = [];
                                for (var j = 0; j < this.thead.length; j++) {
                                    emptyArray.push({
                                        value: "-"
                                    });
                                }
                                tbody.push(emptyArray);
                            }
                        }
                        return tbody;
                    }
                },
                //按钮个数
                buttons: function() {
                    var total = this.totalRecord;
                    var pageLength = this.pageLength;
                    var start = this.startRecord;

                    var buttons = Math.ceil(total / pageLength);
                    return buttons;
                },
                //按钮组
                buttonGroup: {
                    get: function() {
                        var buttons = this.buttons;

                        var group = [];
                        for (var i = 0; i < buttons; i++) {
                            group.push({
                                name: i + 1
                            });
                        }

                        //根据当前页数来显示哪个范围的按钮

                        return group;
                    }
                },
                //当前按钮组，根据设置的每组的按钮数来计算
                nowButtonGroup: function() {
                    var buttonGroup = this.buttonGroup;
                    var buttonCount = this.buttonCount;
                    var nowPage = this.nowPage;
                    var nowButtonGroup;

                    if (nowPage % buttonCount == 1) {
                        var groupIndex = parseInt(nowPage / buttonCount);
                        nowButtonGroup = buttonGroup.slice(groupIndex * buttonCount, (groupIndex + 1) * buttonCount);
                    } else if (nowPage % buttonCount == 0) {
                        var groupIndex = parseInt(nowPage / buttonCount) - 1;
                        nowButtonGroup = buttonGroup.slice(groupIndex * buttonCount, (groupIndex + 1) * buttonCount);
                    } else {
                        var groupIndex = parseInt(nowPage / buttonCount);
                        nowButtonGroup = buttonGroup.slice(groupIndex * buttonCount, (groupIndex + 1) * buttonCount);
                    }

                    return nowButtonGroup;
                }
            },
            methods: {
                /**
                 * 表格所有点击事件总代理
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                tableClickPoxy: function(e) {
                    var self = this;
                    var target = e.target;
                    var targetName = target.nodeName || "undefined";
                    targetName = targetName.toLowerCase();
                    var className = target.className;

                    //处理表头点击事件
                    if (targetName === "td" && className === "column") {
                        dealColumnClick(target, self);
                    } else if (targetName == "span" && className == "content") { //单元格点击事件
                        if (self.edit == false) return;
                        var content = $(target);
                        var input = $(target).siblings("input");
                        input.css("width", content.width() + "px");

                        content.hide();
                        input.one("blur", function() {
                            content.show();
                            $(this).hide();
                        });
                        input.one("change", function() {
                            //保存单条数据
                            var saveData = $(this).parents("tr")[0].__v_frag.raw;
                            saveEdit(saveData, self);

                            fixedVtableHead(self);
                        }).show().select();
                    }
                },
                pageLengthChange: function(e) {
                    var target = e.target;
                    var mode = this.mode;
                    this.nowPage = 1;
                    this.pageLength = parseInt(target.value);

                    if (mode == "server") {
                        reloadData(this);
                        return;
                    }

                    fixedVtableHead(this);
                },
                buttonGroupClick: function(e) {
                    var target = e.target;
                    var targetName = target.nodeName || "undefined";
                    targetName = targetName.toLowerCase();
                    var content = target.getAttribute("data-position");
                    var nowPage = this.nowPage;

                    var pageLength = this.pageLength;
                    var total = this.totalRecord;
                    var tbody = this.tbody;
                    var start = this.startRecord;
                    var mode = this.mode;

                    if (content == "first") {
                        nowPage = 1;
                    } else if (content == "end") {
                        nowPage = this.buttons;
                    } else if (content == "next") {
                        nowPage++;
                        nowPage = nowPage > this.buttons ? this.buttons : nowPage;
                    } else if (content == "prev") {
                        nowPage--;
                        nowPage = nowPage < 1 ? 1 : nowPage;
                    } else {
                        nowPage = parseInt(content);
                    }
                    this.nowPage = nowPage;

                    if (mode == "server") {
                        reloadData(this);
                        return;
                    }

                    fixedVtableHead(this);
                },
                searchEvent: function(e) {
                    var target = e.target;
                    var searchContent = target.value;

                    //选中输入框中的字符串
                    $(target).select();

                    this.$set("searchObj", {
                        content: searchContent
                    });

                    if (this.mode == "server") {
                        reloadData(this);
                        return;
                    }

                    if (isEmpty(searchContent)) {
                        this.tbody = this.orignBody;
                        this.total = this.tbody.length;
                        this.nowPage = 1;
                        fixedVtableHead(this);
                        return;
                    }

                    // //再根据搜索的内容来过滤
                    var tbody = this.orignBody;
                    var searchContent = this.searchObj.content;

                    tbody = tbody.filter(function(value) {
                        return value.some(function(value) {
                            return value.value.toString().indexOf(searchContent) != -1;
                        });
                    });

                    this.tbody = tbody;
                    this.total = this.tbody.length;
                    this.nowPage = 1;

                    fixedVtableHead(this);
                },
                rowEdit: function(e) {
                    var self = this;
                    var target = e.target;
                    var rowData = $(target).parents("tr")[0].__v_frag.raw;

                    $(self.el+" #defaultWindow").one("shown.bs.modal", function() {
                        self.nowEditRow = JSON.parse(JSON.stringify(rowData));

                        //编辑框中保存按钮的事件
                        $(this).find("button[save]").on("click", function() {
                            //将form中的所有变量赋值给rowData
                            for (var i = 0; i < rowData.length; i++) {
                                rowData.$set(i, self.nowEditRow[i]);
                            }
                            //如果是服务端模式则需要保存
                            if (self.mode == "server") {
                                saveEdit(rowData,self);
                            }

                            $(self.el+" #defaultWindow").modal("hide");
                        });
                    }).modal("show");
                },
                rowDelete: function(e) {
                    var target = e.target;
                    var rowData = $(target).parents("tr")[0].__v_frag.raw;

                    console.dir(rowData);
                },
                jumpChange: function(e) {
                    var target = e.target;
                    var value = target.value;

                    if (isEmpty(value) || value <= 0) {
                        target.value = 1;
                    } else if (value > this.buttons) {
                        target.value = this.buttons;
                    }

                    this.nowPage = target.value;

                    if (this.mode == "server") {
                        reloadData(this);
                        return;
                    }
                },
                reloadData: reloadData,
                editColumn:function(e,index){
                    var target=e.target;
                    var column=this.thead[index];
                    var cell=target.__v_model._frag.raw;
                    
                    if(isEmpty(column.checkRegxp)){
                        cell.checkOk=true;
                        return;
                    }
                    if(!new RegExp(column.checkRegxp).test(cell.value)){
                        cell.checkOk=false;
                    }else{
                        cell.checkOk=true;
                    }
                }
            },
            //实例创建时
            created: function() {
                if (this.mode == "server") {
                    reloadData(this);
                } else {
                    this.total = this.tbody.length;
                }
            },
            ready: function(e) {
                var self = this;
                var el = this.el;
                $(this.el + " .tableContainer").css("max-height", this.tableContainerMaxHeight + "px");

                if (this.mode == "person") {
                    this.$nextTick(function() {
                        fixedVtableHead(self);
                    });
                }
            }
        });

        return vm;
    }

    function fixedVtableHead(vm) {
        setTimeout(function() {
            $(vm.el + " #copyTable").remove();
            var obj = $(vm.el + " table");
            if (isEmpty(obj)) {
                return;
            }
            fixedTableHead(obj, 0);
        }, 300);
    }

    /**
     * 保存编辑过后的数据
     * @param  {[type]} data [description]
     * @param  {[type]} vm   [description]
     * @return {[type]}      [description]
     */
    function saveEdit(data, vm) {
        var self = vm;
        var sendData = {
            data: data
        };

        $.ajax({
            url: self.url,
            type: "PUT",
            data: {
                data: JSON.stringify(sendData)
            },
            success: function(data) {

            }
        });

        //重新调整固定表头
        self.$nextTick(function() {
            setTimeout(function() {
                $(vm.el + " #copyTable").remove();
                var obj = $(vm.el + " table");
                if (isEmpty(obj)) {
                    return;
                }
                fixedTableHead(obj, 0);
            }, 300);
        });
    }

    /**
     * 检查入参是否合法
     * @param  {[type]} vtableConfig [description]
     * @return {[type]}              [description]
     */
    function checkInputParam(vtableConfig) {
        var table = vtableConfig;

        table.thead = vtableConfig.thead || [{ name: "noData", data: "noData" }];
        table.tbody = vtableConfig.tbody || [
            [{ value: "noData" }]
        ];
        table.edit = vtableConfig.edit || false; //是否开启编辑模式
        table.mode = vtableConfig.mode || "person"; //两种模式，客户端模式（person），服务器端模式（server）
        table.searchObj = vtableConfig.searchObj || { content: "" }; //搜索内容
        table.sortObj = vtableConfig.sortObj || [{ columnIndex: 0, sortWay: "asc" }]; //排序字段
        table.dataUrl = vtableConfig.dataUrl || ""; //开启服务模式时有效
        table.pageLength = vtableConfig.pageLength || 10; //每页显示多少条
        table.total = vtableConfig.total || 0; //一共多少条
        table.nowPage = vtableConfig.nowPage || 1;
        table.orignBody = table.tbody;
        table.pageMenu = vtableConfig.pageMenu || [10, 20, 50, 100];
        table.tableContainerMaxHeight = vtableConfig.tableContainerMaxHeight || 500;
        table.buttonCount = vtableConfig.buttonCount || 5;
        table.nowEditRow = []; //当前编辑的行
        return table;
    }

    /**
     * 重新请求数据
     * @param  {[type]} vm [description]
     * @return {[type]}    [description]
     */
    function reloadData(vm) {
        var self = vm;
        var sendData = {
            pageLength: self.pageLength,
            searchObj: self.searchObj,
            sortObj: self.sortObj,
            nowPage: self.nowPage,
        };

        $.ajax({
            url: self.url,
            type: "POST",
            data: {
                data: JSON.stringify(sendData)
            },
            beforeSend: function() {
                var shadow = document.createElement("div");
                shadow.innerHTML = "<span>Loading...</span>";
                shadow.className = "shadow";

                //加上遮罩
                $(self.el + " .tableContainer").append(shadow);
                $(self.el + " .tableContainer").scroll(function(e) {
                    shadow.style.top = $(this).prop("scrollTop") + "px";
                });
            },
            success: function(data) {
                self.thead = data.thead;
                self.tbody = data.tbody;
                self.total = data.total;
                self.nowPage = data.nowPage;
                self.sortObj = data.sortObj;
                self.searchObj = data.searchObj;

                $(self.el + " .tableContainer .shadow").remove();
            },
            error: function() {
                $(self.el + " .tableContainer .shadow").remove();
            }
        });

        //重新调整固定表头
        self.$nextTick(function() {
            fixedVtableHead(self);
        });
    }

    /**
     * 处理表头点击事件
     * @param  {[type]} target [description]
     * @return {[type]}        [description]
     */
    function dealColumnClick(target, self) {
        var sortWay = self.sortObj[0].sortWay;

        self.$set("sortObj", [{
            columnIndex: target.cellIndex - 2,
            sortWay: sortWay == "desc" ? "asc" : "desc"
        }]);

        if (self.mode == "server") {
            self.nowPage = 1;
            reloadData(self);
            return;
        }

        //根据sortObj对tbody排序
        var sortColumnIndex = self.sortObj[0].columnIndex;
        var sortWay = self.sortObj[0].sortWay;
        self.tbody.sort(function(a, b) {
            var avalue = a[sortColumnIndex].value;
            var bvalue = b[sortColumnIndex].value;

            //判断类型
            if (/^[0-9]*$/.test(avalue) && /^[0-9]*$/.test(bvalue)) { //整数
                if (sortWay == "desc")
                    return bvalue - avalue;
                else
                    return avalue - bvalue;
            } else { //字符串
                var length = avalue.length > bvalue.length ? avalue.length : bvalue.length;
                for (var i = 0; i < length; i++) {
                    var a = avalue[i] == undefined ? 0 : avalue[i].charCodeAt(0);
                    var b = bvalue[i] == undefined ? 0 : bvalue[i].charCodeAt(0);

                    if (sortWay == "desc") {
                        if (a != b) {
                            return b - a;
                        }
                    } else {
                        if (a != b) {
                            return a - b;
                        }
                    }
                }
            }
        });

        self.nowPage = 1;

        fixedVtableHead(self);
    }

    //表头固定
    function fixedTableHead(query, nowScrollTop) {
        if (isEmpty(query)) {
            return;
        }
        var nowScrollTop = nowScrollTop || 0;
        var table = $(query);
        var tableParent = table.parent("*"); //取上一级的容器
        var copyTable = table.clone();
        copyTable.attr("id", "copyTable");

        //先检查哪个父容器有滚动事件
        tableParent = (function(parent) {
            //首先将所有的父元素如果position=static的改为relative
            var isScroll = $(parent).css("overflow");
            if (parent != document.body && (isScroll == "" || isScroll == null || isScroll == undefined || isScroll == "hidden" || isScroll == "visible")) {
                parent = parent.parentNode;
                return arguments.callee(parent);
            } else {
                //给最终的这个父元素设置relative
                var tableParentPosition = parent.style.position;
                if (tableParentPosition == "static" || tableParentPosition == undefined || tableParentPosition == "") {
                    parent.style.position = "relative";
                }
                return $(parent);
            }
        })(tableParent[0]);

        //去掉表体
        copyTable.find("tbody").remove();
        //设置表格宽度和原表格一样
        copyTable.css("width", table.prop("offsetWidth") + "px");

        copyTable.css("table-layout", "fixed");
        //再设置每个表头的td和原表格的一样
        var tds = table.find("thead td");
        var copyTds = copyTable.find("thead td");
        tds.each(function(index, obj) {
            var copyTd = $(copyTds[index]);
            var childs = copyTd[0].childNodes;
            var content;
            for (var i = 0; i < childs.length; i++) {
                if (childs[i].nodeName == "#text") {
                    content = childs[i].wholeText || childs[i].textContent;
                }
            }
            copyTd[0].innerHTML = content;
            copyTd.css("width", $(this).prop("offsetWidth") + "px");
        });

        tableParent.append(copyTable);
        copyTable[0].style.cssText += "margin:0px!important;position:absolute;opacity:1;display:none;background-color:white;";

        //设置表格的初始位置
        var initLeft = calcEleToTargetOffset(table[0], tableParent[0], "offsetLeft");
        var initTop = calcEleToTargetOffset(table[0], tableParent[0], "offsetTop");
        // var maxHeight = initTop + table[0].offsetHeight;

        tableParent[0].onscroll = function(e) {
            var scrollTop = tableParent[0].scrollTop;
            if (tableParent[0] == document.body) {
                scrollTop = scrollTop == 0 ? window.scrollY : scrollTop;
            }

            if (scrollTop > initTop) {
                if (tableParent[0] == document.body) {
                    copyTable.css("position", "fixed");
                    copyTable.css("left", initLeft + "px");
                    copyTable.hide();
                } else {
                    copyTable.css("top", scrollTop + "px");
                    copyTable.css("left", initLeft + "px");
                    copyTable.show();
                }
            } else {
                copyTable.hide();
            }
        }

        function calcEleToTargetOffset(ele, target, offsetTopOrLeft) {
            if (ele == target || target == null) {
                return 0;
            } else {
                if (ele.style.position == "fixed") {
                    return ele[offsetTopOrLeft];
                }
                return calcEleToTargetOffset(ele.offsetParent, target, offsetTopOrLeft) + ele[offsetTopOrLeft];
            }
        }

        //滚动nowScrollTop距离
        tableParent[0].scrollTop = (nowScrollTop + 1);
        tableParent[0].scrollTop = (nowScrollTop - 1);

        $(tableParent).one("resize", function(e) {
            copyTable.remove();
            fixedTableHead(query, tableParent[0].scrollTop);
        });

        $(window).one("resize", function() {
            copyTable.remove();
            fixedTableHead(query, tableParent[0].scrollTop);
        });
    }

    function isEmpty(obj) {
        if (obj == undefined || obj == null || (typeof obj) == "undefined" || obj.length <= 0 || obj.toString() == "NaN") {
            return true;
        } else if (typeof obj == "object") {
            var count = 0;
            for (key in obj) {
                count++;
            }
            return count == 0 ? true : false;
        } else
            return false;
    }

    window.makeVtable = makeVtable;
})();
