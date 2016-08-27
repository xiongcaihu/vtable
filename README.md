#vtable
####简单介绍：此可配置式表格组件在vue2.0基础上编写，具有常规项目所需的一些功能：排序，过滤，翻页，设置页面显示条数，固定表头，指定列特殊渲染，单元格直接编辑，整行编辑等功能。

####demo
<img src="https://github.com/xiongcaihu/vtable/blob/master/vtable.gif">

####其中，有两种可选模式：
1. 客户端模式：一次性加载所有数据，并对这些数据进行操作。
2. 服务端模式：需配置与服务端交互的url，表格每次的操作会与服务器通讯进行请求数据。

####安装
1. 下载此项目的压缩包，存放在，比如：d:/nodejs/vtable
2. 然后在cmd中键入此地址，到达vtable目录下
3. 键入npm install等待资源包下载完成
4. 键入 hotnode ./bin/www 
5. 看到绿色 hotnode  node process restarted 字样表示成功启动
6. 浏览器输入localhost:3000/index.html查看效果
