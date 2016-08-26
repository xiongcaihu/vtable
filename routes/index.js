var express = require('express');
var router = express.Router();
var Mock = require('mockjs');

//传递给客户端模式表格的数据
router.post('/makeData', function(req, res, next) {
    var returnData = {
        el: "#vtable",
        "tbody": function() {
            var Random = Mock.Random;
            var array = [];
            for (var i = 0; i < 1002; i++) {
                var item = [{
                    "data":"id",
                    "value": Random.integer(1,10000),
                },{
                    "data":"name",
                    "value": Random.name(),
                }, {
                    "data":"position",
                    "value": Random.name(),
                }, {
                    "data": "img",
                    "value": "img/a.jpg",
                }, {
                    "data": "date",
                    "value": Random.date(),
                }, {
                    "data": "start_date",
                    "value": Random.date(),
                }, {
                    "data": "salary",
                    "value": Random.integer(500, 1000)
                }];

                array.push(item);
            }

            return array;
        },
        "thead": [
        {
            "data":"id",
            "name":"id",
            "show":false,
            "dataType":"int",//数据类型，int,float,boolean,string,text,date
            "checkRegxp":"^[0-9]*$",//检验规则，适用于在form中做输入的检查
        },
        {
            "data": "name",
            "name": "name",
            "dataType":"string",
            "checkRegxp":"",//检验规则，适用于在form中做输入的检查
        }, {
            "data": "position",
            "name": "position",
            "dataType":"string",
            "checkRegxp":"",//检验规则，适用于在form中做输入的检查
        }, {
            "data": "img",
            "name": "img",
            "dataType":"string",
            "checkRegxp":"",//检验规则，适用于在form中做输入的检查
        }, {
            "data": "date",
            "name": "date",
            "dataType":"date",
            "checkRegxp":"^[1-9][0-9]{3}-[0-9]{1,2}-[0-9]{1,2}$",//检验规则，适用于在form中做输入的检查
        }, {
            "data": "start_date",
            "name": "start_date",
            "dataType":"date",
            "checkRegxp":"^[1-9][0-9]{3}-[0-9]{1,2}-[0-9]{1,2}$",//检验规则，适用于在form中做输入的检查
        }, {
            "data": "salary",
            "name": "salary",
            "dataType":"float",
            "checkRegxp":"^[0-9]*[.]{0,}[0-9]{0,2}$",//检验规则，适用于在form中做输入的检查
        }],
    };

    res.send(Mock.mock(returnData));
});

//接收客户端模式表格修改后的数据
router.put('/makeData', function(req, res, next) {
    console.log(JSON.parse(req.body.data));
    res.send("ok");
});

//删除一个数据
router.delete('/makeData', function(req, res, next) {
    console.log(JSON.parse(req.body.data));
    res.send("ok");
});

router.delete('/vtable', function(req, res, next) {
    console.log(JSON.parse(req.body.data));
    res.send("ok");
});

//接收服务端模式下的表格修改的单条数据
router.put('/vtable', function(req, res, next) {
    console.log(JSON.parse(req.body.data));
    res.send("ok");
});

//服务端模式下的表格的数据
router.post('/vtable', function(req, res, next) {
    var body=JSON.parse(req.body.data);
    var pageLength = body.pageLength;
    var nowPage = body.nowPage;
    var searchObj = body.searchObj;
    var sortObj = body.sortObj;
    var total;

    console.log(sortObj);
    var returnData = {
        el: "#vtable",
        "tbody": function() {
            var Random = Mock.Random;
            var array = [];
            for (var i = 0; i < 50; i++) {
                var item = [{
                    "data":"id",
                    "value": Random.integer(1,10000),
                },{
                    "data":"name",
                    "value": Random.name(),
                }, {
                    "data":"position",
                    "value": Random.name(),
                }, {
                    "data": "office",
                    "value": Random.integer(1, 1000),
                }, {
                    "data": "extn",
                    "value": Random.date(),
                }, {
                    "data": "start_date",
                    "value": Random.string(),
                }, {
                    "data": "salary",
                    "value": Random.integer(500, 1000)
                }];

                array.push(item);
            }

            return array;
        },
        total: 102,
        searchObj: searchObj,
        nowPage: nowPage,
        sortObj: sortObj,
        "thead": [
        {
            "data":"id",
            "name":"id",
            "show":false,
            "dataType":"int",//数据类型，int,float,boolean,string,text
            "checkRegxp":"/^[0-9]*$/",//检验规则，适用于在form中做输入的检查
        },
        {
            "data": "name",
            "name": "name"
        }, {
            "data": "position",
            "name": "position"
        }, {
            "data": "office",
            "name": "office"
        }, {
            "data": "extn",
            "name": "extn"
        }, {
            "data": "start_date",
            "name": "start_date"
        }, {
            "data": "salary",
            "name": "salary"
        }],
    };

    //设置延时1秒
    setTimeout(function(){
        res.send(Mock.mock(returnData));
    },300);
});


module.exports = router;