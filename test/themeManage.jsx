import React from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { Select, message, Upload, Table, Input, Button, Form, Modal } from "antd";
import "./themeManage.css";
import Mock from "mockjs";

const FormItem = Form.Item;

/**
 * 获取图片的base64地址
 *
 * @param {*} img
 * @param {*} callback
 */
function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

/**
 * 上传前对图片的检查
 *
 * @param {*} file
 * @returns
 */
function beforeUpload(file) {
  const isJPG = file.type === 'image/jpeg';
  if (!isJPG) {
    message.error('You can only upload JPG file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!');
  }
  return isJPG && isLt2M;
}

let FormProps = {}

@observer
class MyModal extends React.Component {
  @observable row = {};

  componentWillReceiveProps(nextProps) {
    let nowVisible = this.props.visible;
    let nextVisible = nextProps.visible;
    if (nowVisible == false && nextVisible) { // 刚打开
      this.row = nextProps.dataSource[nextProps.editingRowIndex];
    } else if (nowVisible && nextVisible == false) { // 即将关闭
      this.row = {};
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // console.log('will update', this.row, nextProps, nextState);
  }

  componentDidUpdate() {
    // console.log('updated', this.row);
  }

  /**
   * 保存
   */
  handleEditSave() {
    this.props.form.validateFields((error, values) => {
      if (error) {
        return;
      }
      this.props.saveRow(_.merge({}, this.row, FormProps), this.props.editingRowIndex);
      this.props.cancelWindow();
    });
  }

  /**
   * 上传状态改变时的处理函数
   *
   * @memberof MyModal
   */
  handleFileUploadStatusChange = (rowIndex, info) => {
    if (info.file.status === 'uploading') {
      return;
    } else if (info.file.status === 'done' || info.file.status === 'error') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (imageBase64Url) => {
        this.row.img = imageBase64Url;
      });
    }
  }

  render() {
    let rowIndex = this.props.editingRowIndex;
    let formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    }
    return (
      <Modal
        destroyOnClose
        title='编辑'
        visible={this.props.visible}
        onOk={this.handleEditSave.bind(this)}
        onCancel={() => {
          this.props.cancelWindow();
        }}
      >
        <Form>
          <FormItem label="主题名称" {...formItemLayout}>
            {this.props.form.getFieldDecorator("themeName", {
              rules: [
                {
                  required: true,
                  message: "不能为空"
                }
              ],
              initialValue: this.row["themeName"]
            })(<Input placeholder="不能为空" />)}
          </FormItem>
          <FormItem label="图片" {...formItemLayout}>
            <Upload
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={this.handleFileUploadStatusChange.bind(this, rowIndex)}
            >
              <img style={{ width: '100px', height: '100px' }} src={this.row.img} alt="" />
            </Upload>
          </FormItem>
          <FormItem label="状态" {...formItemLayout}>
            {this.props.form.getFieldDecorator("state", {
              initialValue: this.row["state"]
            })(
              <Select style={{ width: 120 }}>
                <Select.Option value="lowerShelf">已下架</Select.Option>
                <Select.Option value="inDisplay">显示中</Select.Option>
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

MyModal = Form.create({
  onFieldsChange(props, changedFields) {
    for (let key in changedFields) {
      FormProps[key] = changedFields[key].value;
    }
  }
})(MyModal);

const dataSource = Mock.mock({
  "list|10-100": [
    {
      "key|+1": 0,
      id: "@integer()",
      themeName: "@ctitle()",
      img:
        "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1544962465147&di=91a2f0c83ce1ee20733ca0b659a32152&imgtype=0&src=http%3A%2F%2Fpic17.nipic.com%2F20111023%2F8104044_230939695000_2.jpg",
      "state|1": ['lowerShelf', 'inDisplay'],
      'topping': '@boolean()'
    }
  ]
}).list;

@observer
class ThemeManage extends React.Component {
  @observable tableHeight = 0;// 表格高度
  @observable editingRowIndex = 0; // 正在编辑的行在datasource中的下标
  @observable editWindowVisible = false; // 是否打开编辑行窗口

  nowSelectedRows = [];

  state = {
    dataSource
  };

  componentWillMount() {
    this.initTable();
  }

  componentDidMount() {
    this.tableHeight =
      this.refs.themeManage.offsetHeight - 20 - 31 - 53 - 32 - 32 - 42;
  }

  handleRowEdit(index) {
    this.editingRowIndex = index;
    this.editWindowVisible = true;
  }

  /**
   * 单行删除
   *
   * @param {*} index
   * @memberof ThemeManage
   */
  handleRowDelete(index) {
    this.state.dataSource.splice(index, 1);
    this.setState({
      dataSource: this.state.dataSource
    });
  }

  /**
   * 多行删除
   *
   * @memberof ThemeManage
   */
  handleRowsDelete() {
    this.setState({
      dataSource: this.state.dataSource.filter((item) => {
        let rel = this.nowSelectedRows.findIndex((subItem) => {
          return subItem.key == item.key;
        });
        return rel === -1;
      })
    })
  }

  /**
   * 定义表头
   * 参考文档
   * https://ant.design/components/table-cn/#components-table-demo-edit-row
   *
   * @memberof ThemeManage
   */
  defineColumns() {
    // 表头设计
    this.columns = [
      {
        title: "序号",
        render: (text, row, index) => {
          return <span>{index + 1}</span>;
        },
        width: 100,
        align: "center"
      },
      {
        title: "主题名称",
        dataIndex: "themeName",
        key: "themeName",
        width: 150,
        align: "center",
        sorter: (a, b) => a.state.length - b.state.length,
        filterDropdown: this.filterComponent,
        onFilter: (value, record) => {
          // value 是当前搜索的字符串
          return record.themeName.toLowerCase().includes(value.toLowerCase());
        }
      },
      {
        title: "缩略图",
        dataIndex: "img",
        key: "img",
        align: "center",
        render: (text, row, index) => {
          return <img onClick={() => {
            var html = `<html><body>
              <img width="100%" src="${row.img}" />
            </body></html>`;
            let a = window.open();
            a.document.write(html);
          }} className="smallImg" src={row.img} />;
        }
      },
      {
        title: "状态",
        dataIndex: "state",
        key: "state",
        align: "center",
        width: 150,
        sorter: (a, b) => a.state.length - b.state.length,
        render: (text) => {
          let relText = '';
          switch (text) {
            case 'inDisplay': relText = '显示中'; break;
            case 'lowerShelf': relText = '已下架'; break;
          }
          return <span style={{ color: text == 'inDisplay' ? '#237804' : '' }}>{relText}</span>
        }
      },
      {
        title: "是否顶部显示",
        dataIndex: "topping",
        key: "topping",
        align: "center",
        width: 150,
        sorter: (a, b) => a.state.length - b.state.length,
        render: (text) => {
          let relText = text ? '是' : '否';
          return <span>{relText}</span>
        }
      },
      {
        title: "操作",
        width: 150,
        render: (text, record, index) => {
          return (
            <div>
              <span
                style={{ color: "#1890ff", cursor: "pointer", marginRight: 10 }}
                onClick={this.handleRowEdit.bind(this, index)}
              >
                编辑
              </span>
              <span
                style={{ color: "#1890ff", cursor: "pointer" }}
                onClick={this.handleRowDelete.bind(this, index)}
              >
                删除
              </span>
            </div>
          );
        }
      }
    ];
  }

  initTable() {
    this.defineColumns();
  }

  /**
   * 如果当前单元格需要被过滤，那么用此组件
* @param {} param0
  */
  filterComponent({ setSelectedKeys, selectedKeys, confirm, clearFilters }) {
    return (
      <div className="custom-filter-dropdown">
        <Input
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={e => {
            confirm();
          }}
        />
        <Button
          type="primary"
          onClick={e => {
            confirm();
          }}
        >
          搜索
        </Button>
        <Button onClick={() => clearFilters()}>重置</Button>
      </div>
    );
  }

  addRow() {
    this.state.dataSource.unshift(
      Mock.mock({
        key: '@integer()',
        id: "@integer()",
        themeName: "",
        img: "",
        "state|1": ['lowerShelf'],
        'topping': false
      })
    );

    this.setState({
      dataSource: this.state.dataSource.slice()
    });
  }

  render() {
    return (
      <div className="themeManage" ref="themeManage">
        <h2>主题管理</h2>
        <div className="tool">
          <Button onClick={this.addRow.bind(this)}>增加</Button>
          <Button onClick={this.handleRowsDelete.bind(this)}>删除</Button>
          <Button type="primary">保存</Button>
        </div>
        <Table
          bordered
          className="table"
          scroll={{ y: this.tableHeight }}
          rowSelection={{
            onChange: (selectedRowKeys, selectedRows) => {
              this.nowSelectedRows = selectedRows;
            }
          }}
          rowClassName={(record, index) => {
            return record.state == 'lowerShelf' ? 'disable' : '';
          }}
          dataSource={this.state.dataSource}
          columns={this.columns}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: total => <span>共 {total} 条</span>
          }}
        />
        <MyModal
          editingRowIndex={this.editingRowIndex}
          dataSource={this.state.dataSource}
          visible={this.editWindowVisible}
          cancelWindow={() => {
            this.editWindowVisible = false;
          }}
          saveRow={(newRow, index) => {
            this.state.dataSource[index] = newRow;
            this.setState({
              dataSource: this.state.dataSource.slice()
            });
          }}
        />
      </div>
    );
  }
}

export default ThemeManage;
