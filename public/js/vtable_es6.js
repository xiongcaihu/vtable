(function() {
    //要插入的内容
    var innerHTML = `
        <!--顶部-->
        <form class="form-inline tools" onSubmit="return false">
            <div class="form-group left">
                <label>每页</label>
                <select class="form-control input-sm" @change="pageLengthChange($event)">
                    <template v-for="(item,index) in pageMenu">
                        <option v-if="item == pageLength" :value="item" selected="true">{{item}}</option>
                        <option v-else :value="item">{{item}}</option>
                    </template>
                </select>
                <label>条</label>
            </div>
            <div class="form-group right">
                <div class="btn-group" v-if="expandButton.show">
                    <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{expandButton.name}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li @click="addRow($event)" v-if="edit"><a href="javascript:" >增加一行</a></li>
                        <template v-for="(item,index) in expandButton.functions">
                            <li role="separator" class="divider" v-show="index==0 && edit"></li>
                            <li @click="createEvent(item,$event)"><a href="javascript:" >{{item.name}}</a></li>
                            <li role="separator" class="divider" v-show="index!=expandButton.functions.length-1"></li>
                        </template>
                    </ul>
                </div>
                <input type="text" class="form-control" placeholder="输入内容搜索" @change="searchEvent($event)">
            </div>
        </form>
         <!--表-->
        <div class="tableContainer">
            <table class="table table-bordered" @click="tableClickPoxy($event)">
                <thead>
                    <tr>
                        <td v-show="edit" class="column operate">操作</td>
                        <td class="column index">序号</td>
                        <td class="column" v-for="(item,index) in thead" v-show="item.show!=false"><span :class="index==sortObj[0].columnIndex && sortObj[0].sortWay=='asc'?'sortIcon asc active':'sortIcon asc'">&uarr;</span>
                            <span :class="index==sortObj[0].columnIndex && sortObj[0].sortWay=='desc'?'sortIcon desc active':'sortIcon desc'">&darr;</span> {{item.name}}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item,index) in showRecord">
                        <td v-show="edit"><span class="glyphicon glyphicon-pencil" @click="rowEdit($event,item)"></span>&nbsp;<span class="glyphicon glyphicon-trash" @click="rowDelete($event,item)"></span></td>
                        <td>{{index+1}}</td>
                        <td v-for="(sub,index) in item.data" v-show="thead[index].show!=false"><span class="content" v-html="render(sub)"></span>
                            <input @change="editCell($event,sub,item,thead[index])">
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!--底部工具栏-->
        <div class="footer">
            <div class="left">
                <label>显示 {{startRecord}} - {{endRecord}} 条，共 {{totalRecord}} 条</label>
            </div>
            <div class="right">
                <div class="btn-group" role="group" aria-label="..." @click="buttonGroupClick($event)">
                    <button type="button" class="btn btn-default" data-position="first">&laquo;
                    </button>
                    <button type="button" class="btn btn-default" data-position="prev">&lt;</button>
                    <template v-for="item in nowButtonGroup">
                        <button type="button" :class="nowPage==item.name?'btn btn-default btn-primary':'btn btn-default'" :data-position="item.name">{{item.name}}</button>
                    </template>
                    <button type="button" class="btn btn-default" data-position="next">&gt;</button>
                    <button type="button" class="btn btn-default" data-position="end">&raquo;</button>
                </div>
                <div class="jumpTo">跳转到&nbsp;
                    <input class="form-control" type="number" value="1" min="1" :max="buttons" @change="jumpChange($event)" />&nbsp;页</div>
                </div>
        </div>
        <!--表单-->
        <div class="modal fade" id="defaultWindow" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="exampleModalLabel">编辑</h4>
                    </div>
                    <div class="modal-body">
                        <form>
                            <div class="form-group" v-for="(item,index) in nowEditRow.data" v-show="thead[index].show!=false">
                                <label class="control-label">{{thead[index].name}}</label>
                                <input type="text" class="form-control" v-model="item.value" @change="editColumn($event,index,item)">
                                <span class="errorMsg" v-show="item.checkOk==false">{{thead[index].errorMsg}}</span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" save>确定</button>
                    </div>
                </div>
            </div>
        </div>`;

    function makeVtable(vtableConfig) {
        var element = document.querySelector(vtableConfig.el);
        if (isEmpty(element)) {
            return;
        }
        element.innerHTML = innerHTML;

        //检查参数是否都合法
        var table = checkInputParam(vtableConfig);
        if (table == false) {
            return;
        }

        // 创建根实例
        var vm = new Vue({
            el: table.el,
            data: table,
            //实例创建时
            created: function() {
                if (this.mode == "server") {
                    reloadData(this);
                } else {
                    //为每条数据生成rowId
                    var body = this.orignBody;
                    var randoms = makeRandomNumber(body.length);
                    for (var i = 0; i < body.length; i++) {
                        var rowObj = body[i];
                        if (isEmpty(rowObj.rowId)) {
                            rowObj.rowId = randoms[i];
                        }
                    }
                    this.tbody = copyObj(this.orignBody);
                    this.total = this.tbody.length;
                }
            },
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
                                finalArray.push({
                                    data: emptyArray
                                });
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
                                tbody.push({
                                    data: emptyArray
                                });
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
                addRow: function(e) {
                    var number = makeRandomNumber(1);
                    var self = this;
                    var newRow = {
                        rowId: number[0],
                        data: (function() {
                            var row = [];
                            for (var i = 0; i < self.thead.length; i++) {
                                var cell = {
                                    data: self.thead[i].data,
                                    value: ""
                                }
                                row.push(cell);
                            }
                            return row;
                        })()
                    }

                    if (self.mode == "server") {
                        //保存到服务器后再渲染到当前tbody中
                        saveEdit(newRow,self);
                        self.tbody.unshift(newRow);
                    } else {
                        self.orignBody.unshift(newRow);

                        self.tbody = copyObj(self.orignBody);
                        self.total = self.tbody.length;
                    }
                },
                createEvent: function(methodObj, e) {
                    var method = methodObj.method.bind(this);
                    method(e);
                },
                render: function(cell) {
                    var renderColumn = this.renderColumn;

                    if (!isEmpty(renderColumn) && !isEmpty(renderColumn[cell.data])) {
                        return renderColumn[cell.data]().replace(/\$value/g, cell.value);
                    } else {
                        return cell.value;
                    }
                },
                /**
                 * 修改orignBody的行对象
                 * @param  {[type]} rowId 修改的rowId
                 * @param  {[type]} row   修改的行
                 * @return {[type]}       [description]
                 */
                changeOrignBodyRow: function(row) {
                    var rowId = row.rowId;
                    var findItem = this.orignBody.find(function(v) {
                        return v.rowId == rowId;
                    });
                    this.$set(findItem, "data", row.data);
                    fixedVtableHead(this);
                },
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
                        if (content.html() == "-") {
                            return;
                        }
                        var input = $(target).siblings("input");
                        input.css("width", content.width() + "px");
                        input.val(content.html());

                        content.hide();
                        input.one("blur", function() {
                            content.show();
                            $(this).hide();
                        });
                        input.show().select();
                    }
                },
                editCell: function(e, cell, row, column) {
                    var target = e.target;
                    var value = target.value;
                    if (isEmpty(column.checkRegxp) || new RegExp(column.checkRegxp).test(value)) {
                        cell.value = value;
                    } else {
                        return;
                    }
                    if (this.mode == "server") {
                        saveEdit(row, this);
                        reloadData(this);
                    } else {
                        //修改orignBody里的数据
                        this.changeOrignBodyRow(row);
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

                    this.$set(this, "searchObj", {
                        content: searchContent
                    });

                    if (this.mode == "server") {
                        reloadData(this);
                        return;
                    }

                    if (isEmpty(searchContent)) {
                        this.tbody = copyObj(this.orignBody);
                        this.total = this.tbody.length;
                        this.nowPage = 1;
                        fixedVtableHead(this);
                        return;
                    }

                    //再根据搜索的内容来过滤
                    var tbody = copyObj(this.orignBody);
                    var searchContent = this.searchObj.content;

                    tbody = tbody.filter(function(value) {
                        return value.data.some(function(value) {
                            return value.value.toString().indexOf(searchContent) != -1;
                        });
                    });

                    this.tbody = tbody;
                    this.total = this.tbody.length;
                    this.nowPage = 1;

                    fixedVtableHead(this);
                },
                rowEdit: function(e, data) {
                    var self = this;
                    var target = e.target;
                    var rowData = data;
                    if (isEmpty(rowData.rowId)) {
                        return;
                    }

                    $(self.el + " #defaultWindow").one("shown.bs.modal", function() {
                        $(this).find(".modal-body").height(window.innerHeight * 0.6).css("overflow-y", "auto");

                        //为每个数据加上checkOk（是否符合自定意正则检测）的标志
                        var newRowData = copyObj(rowData);
                        newRowData.data.filter(function(value, index, array) {
                            if (isEmpty(value.checkOk)) {
                                array[index].checkOk = true;
                            }
                            return true;
                        });

                        self.nowEditRow = newRowData;

                        //编辑框中保存按钮的事件
                        $(this).find("button[save]").off("click").on("click", function() {
                            //将form中的所有变量赋值给rowData
                            var allCheckOk = self.nowEditRow.data.every(function(value) {
                                return value.checkOk;
                            });
                            if (!allCheckOk) {
                                return;
                            }

                            if (self.mode == "server") {
                                saveEdit(self.nowEditRow, self);
                                reloadData(self);
                            } else {
                                self.$set(rowData, "data", self.nowEditRow.data);

                                //修改orignBody里的数据
                                self.changeOrignBodyRow(rowData);
                            }

                            $(self.el + " #defaultWindow").modal("hide");

                            self.$set(self, "nowEditRow", []);
                        });
                    }).modal("show");
                },
                rowDelete: function(e, data) {
                    var self = this;
                    var target = e.target;

                    if (self.mode == "server") {
                        deleteRow(data, self);
                    } else {
                        //删除orignBody里的数据
                        var rowId = data.rowId;
                        if (isEmpty(rowId)) {
                            return;
                        }
                        var findItemIndex = this.orignBody.findIndex(function(v) {
                            return v.rowId == rowId;
                        });
                        this.orignBody.splice(findItemIndex, 1);

                        findItemIndex = this.tbody.findIndex(function(v) {
                            return v.rowId == rowId;
                        });
                        this.tbody.splice(findItemIndex, 1);
                        this.total = this.tbody.length;

                        fixedVtableHead(this);
                    }
                },
                jumpChange: function(e) {
                    var target = e.target;
                    var value = target.value;
                    value = parseFloat(value);

                    if (typeof value == "number") {
                        if (!/^[0-9]*$/.test(value)) {
                            value = Math.ceil(value);
                            target.value = value;
                        }
                    }

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

                    fixedVtableHead(this);
                },
                reloadData: reloadData,
                saveEdit: saveEdit,
                editColumn: function(e, index, data) {
                    var target = e.target;
                    var column = this.thead[index];
                    var cell = data;
                    var dataType = column.dataType;
                    var nowValue = target.value;

                    if (isEmpty(column.checkRegxp)) {
                        cell.checkOk = true;
                        return;
                    }
                    if (!new RegExp(column.checkRegxp).test(cell.value)) {
                        cell.checkOk = false;
                    } else {
                        cell.checkOk = true;
                    }
                }
            }
        });

        vm.$nextTick(function() {
            var self = this;
            var el = this.el;
            $(this.el + " .tableContainer").css("max-height", this.tableContainerMaxHeight + "px");

            if (this.mode == "person") {
                this.$nextTick(function() {
                    fixedVtableHead(self);
                });
            }
        });

        return vm;
    }

    /**
     * 生成指定数量的随机数
     * @param  {[type]} count [description]
     * @return {[type]}       [description]
     */
    function makeRandomNumber(count) {
        var numberMap = {};
        var numberArray = [];

        (function(count) {
            var arg = arguments;

            if (count == 0) return;

            var number = Math.random().toString().slice(2, 15);
            if (numberMap["_" + number] == undefined) {
                numberMap["_" + number] = number;
                numberArray.push(number);
                count--;
            }

            arg.callee(count);

        })(count);

        return numberArray;
    }

    /**
     * 复制对象
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    function copyObj(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function fixedVtableHead(vm) {
        if (!vm.fixedHead) return;
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
     * 删除一行
     * @param  {[type]} data [description]
     * @param  {[type]} vm   [description]
     * @return {[type]}      [description]
     */
    function deleteRow(data, vm) {
        var self = vm;
        var sendData = {
            data: data
        };

        if (isEmpty(self.url)) {
            console.warn("未设置删除的url");
        } else {
            $.ajax({
                url: self.url,
                type: "Delete",
                data: {
                    data: JSON.stringify(sendData)
                },
                success: function(data) {
                    reloadData(self);
                }
            });
        }

        //重新调整固定表头
        fixedVtableHead(self);
    }

    /**
     * 保存编辑过后的数据
     * @param  {[type]} data [description]
     * @param  {[type]} vm   [description]
     * @return {[type]}      [description]
     */
    function saveEdit(row, vm) {
        var self = vm;

        if (isEmpty(self.url)) {
            console.warn("未设置保存的url");
        } else {
            $.ajax({
                url: self.url,
                type: "PUT",
                data: {
                    data: JSON.stringify(row)
                },
                success: function(data) {
                    var newRow = JSON.parse(data);
                    vm.$set(row, "data", newRow.data);
                }
            });
        }

        //重新调整固定表头
        fixedVtableHead(self);
    }

    /**
     * 检查入参是否合法
     * @param  {[type]} vtableConfig [description]
     * @return {[type]}              [description]
     */
    function checkInputParam(vtableConfig) {
        var table = vtableConfig;

        table.thead = vtableConfig.thead || [{ name: "noData", data: "noData" }];
        if (!(table.thead instanceof Array) || !(typeof table.thead[0] == "object")) {
            console.error("thead配置错误");
            return false;
        }
        table.orignBody = vtableConfig.tbody || [
            { data: [{ value: "noData" }] }
        ];
        if (!(table.orignBody instanceof Array) || !(typeof table.orignBody[0] == "object")) {
            console.error("tbody配置错误");
            return false;
        }
        table.tbody = copyObj(table.orignBody);
        // table.orignBody = table.tbody;
        table.edit = isEmpty(vtableConfig.edit) ? false : vtableConfig.edit; //是否开启编辑模式
        table.mode = vtableConfig.mode || "person"; //两种模式，客户端模式（person），服务器端模式（server）
        if (!(typeof table.mode == "string") || (table.mode != "person" && table.mode != "server")) {
            console.error("mode配置错误,选择值：person and server");
            return false;
        }
        table.url = vtableConfig.url;
        if (isEmpty(table.url) && table.mode == "server") {
            console.error("需要配置url");
            return false;
        }
        table.searchObj = vtableConfig.searchObj || { content: "" }; //搜索内容
        if (!(typeof table.searchObj == "object") || table.searchObj.content == undefined) {
            console.error("searchObj配置错误");
            return false;
        }
        table.sortObj = vtableConfig.sortObj || [{ columnIndex: 0, sortWay: "asc", data: "" }]; //排序字段
        if (!(table.sortObj instanceof Array) || !(typeof table.sortObj == "object")) {
            console.error("sortObj配置错误");
            return false;
        }
        table.pageLength = vtableConfig.pageLength || 10; //每页显示多少条
        if (!(typeof table.pageLength == "number")) {
            console.error("pageLength配置错误");
            return false;
        }
        table.total = vtableConfig.total || 0; //一共多少条
        table.nowPage = vtableConfig.nowPage || 1;
        if (!(typeof table.nowPage == "number")) {
            console.error("nowPage配置错误");
            return false;
        }
        table.pageMenu = vtableConfig.pageMenu || [10, 20, 50, 100];
        if (!(table.pageMenu instanceof Array) || !(typeof table.pageMenu[0] == "number")) {
            console.error("pageMenu配置错误");
            return false;
        }
        table.tableContainerMaxHeight = vtableConfig.tableContainerMaxHeight || 500;
        if (!(typeof table.tableContainerMaxHeight == "number")) {
            console.error("tableContainerMaxHeight配置错误");
            return false;
        }
        table.buttonCount = vtableConfig.buttonCount || 5;
        if (!(typeof table.buttonCount == "number")) {
            console.error("buttonCount配置错误");
            return false;
        }
        table.nowEditRow = []; //当前编辑的行
        table.fixedHead = isEmpty(vtableConfig.fixedHead) ? true : vtableConfig.fixedHead;
        table.renderColumn = vtableConfig.renderColumn || undefined; //过滤设置
        table.expandButton = vtableConfig.expandButton || { //扩展按钮
            name: "功能菜单",
            show: true,
            functions: [{
                name: "我的扩展按钮1",
                method: function(e) {
                    console.dir(this);
                }
            }, {
                name: "我的扩展按钮2",
                method: function(e) {
                    console.dir(this);
                }
            }]
        };
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

                var randoms = makeRandomNumber(self.tbody.length);
                for (var i = 0; i < self.tbody.length; i++) {
                    var rowObj = self.tbody[i];
                    if (isEmpty(rowObj.rowId)) {
                        rowObj.rowId = randoms[i];
                    }
                }

                $(self.el + " .tableContainer .shadow").remove();

                //重新调整固定表头
                self.$nextTick(function() {
                    fixedVtableHead(self);
                });
            },
            error: function() {
                $(self.el + " .tableContainer .shadow").remove();
            }
        });
    }

    /**
     * 处理表头点击事件
     * @param  {[type]} target [description]
     * @return {[type]}        [description]
     */
    function dealColumnClick(target, self) {
        var sortWay = self.sortObj[0].sortWay;

        self.$set(self, "sortObj", [{
            columnIndex: target.cellIndex - 2,
            sortWay: sortWay == "desc" ? "asc" : "desc",
            data: self.thead[target.cellIndex - 2]
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
            var avalue = a.data[sortColumnIndex].value;
            var bvalue = b.data[sortColumnIndex].value;

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
        if (typeof obj == "function") {
            return false;
        }
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
