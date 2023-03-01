import React, { useEffect, useState, useContext } from "react";
import {
  Table,
  Space,
  Modal,
  AutoComplete,
  Input,
  Badge,
  Col,
  Row,
  Typography,
} from "antd";
import {
  CloseCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import ReportAndDashboardTabsService from "../../../Services/ReportAndDashboard/reportanddashboardtabs.service";
import {
  ENUM_NOTIFY_TYPE,
  NOTIFICATION_TITLE,
} from "../../../Common/utility/globalenums";
import {
  statusCode,
  nullDataCheck,
  showNotification,
} from "../../../Shared/Common";
import { iPagination } from "../../../Shared/Pagination";
import ENUM_HTTPSTATUSCODE from "../../../Common/utility/httpstatuscode.enum";
import ManageAccessService from "../../../Services/ReportAndDashboard/manageaccess.service";
import { AuthContext } from "../../../AppState";
import { ChildLoading } from "../../../Components/Common/Loader/Loading";

function ManageAccessRole(props) {
  const { open, setisopen, selectedRecord } = props;
  const { setLoading } = useContext(AuthContext);
  const [pageLoading, setPageLoading] = useState(false);
  const [listState, setListState] = useState({
    manageAccessDataList: [],
    searchList: [],
    totalRecords: 0,
    isrevokeAccess: false,
    Filter: "",
    Id: null,
    Name: "",
  });
  const [mAPagination, setmAPagination] = useState(iPagination);
  const [reportDashboardTabService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  const [manageAccessService] = useState(() => new ManageAccessService());

  const [options, setOptions] = useState([]);
  const [refreshList, setrefreshList] = useState([]);
  const [name, setName] = useState("");
  const { getCurrentUser } = useContext(AuthContext);
  const currentuser = getCurrentUser();
  const { Text } = Typography;
  useEffect(() => {
    getManageAccessList();
  }, [selectedRecord, name]);

  const getManageAccessList = () => {
    let ReportMasterID = selectedRecord.reportMasterID;
    setPageLoading(true);
    mAPagination.total = listState.totalRecords;
    reportDashboardTabService
      .getManageAccess(ReportMasterID)
      .then((response) => {
        setPageLoading(false);
        if (nullDataCheck(response, NOTIFICATION_TITLE.MANAGE_ACCESS)) return;
        if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
          setListState((prevState) => ({
            ...prevState,
            manageAccessDataList: response.data,
            totalRecords: response.totalRecords,
          }));
          //condition added to handle the warning of pagination as undefined
          if (mAPagination !== undefined)
            mAPagination.current = response.data[0]?.currentPage;
        }
      });
  };

  const revokeAccess = (record) => {
    let params = {
      userRole: [
        {
          reportMasterId: selectedRecord.reportMasterID,
          userId: record.userID,
          roleGroupId: record.roleGroupID,
          layoutID: selectedRecord.layoutID,
          reportName: selectedRecord.reportName,
          userName: record.userName,
          roleName: record.roleName,
          email: record.email,
          isAccessToRole:
            record.email != "" && record.email != null ? false : true,
        },
      ],
    };
    setLoading(true);
    reportDashboardTabService.revokeAccess(params).then((response) => {
      if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
        setListState((item) => ({
          ...item,
          isrevokeAccess: true,
        }));
        setLoading(false);
        showNotification(
          ENUM_NOTIFY_TYPE.SUCCESS,
          NOTIFICATION_TITLE.REVOKE_ACCESS,
          "Access Revoked successfully. "
        );
        getManageAccessList();
      } else {
        showNotification(
          ENUM_NOTIFY_TYPE.ERROR,
          NOTIFICATION_TITLE.REVOKE_ACCESS,
          response.message
        );
      }
    });
  };

  const sorter = (a, b) => {
    a = a === null || a === undefined ? "" : a;
    b = b === null || b === undefined ? "" : b;
    if (a === b) return 0;
    else if (a < b) return -1;
    else if (a > b) return 1;
  };

  const getManageAccessColumns = () => {
    const _columns = [
      {
        dataIndex: "rowID",
        key: "rowID",
        width: 50,
        sortDirections: ["descend", "ascend", "descend"],
        sorter: (a, b) => sorter(a.rowID, b.rowID),
      },
      {
        render: (text) => (
          <a target="_blank">
            {<Badge status="success" style={{ cursor: "auto" }} />}
          </a>
        ),
        width: 50,
        align: "centre",
      },
      {
        title: "User",
        dataIndex: "userName",
        key: "userName",
        width: 200,
        showSorterTooltip: false,
        ellipsis: { showTitle: true },
        sortDirections: ["descend", "ascend", "descend"],
        sorter: (a, b) => sorter(a.userName, b.userName),
      },
      {
        title: "Role",
        dataIndex: "roleName",
        key: "roleName",
        width: 180,
        showSorterTooltip: false,
        ellipsis: { showTitle: true },
        sortDirections: ["descend", "ascend", "descend"],
        sorter: (a, b) => sorter(a.roleName, b.roleName),
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        width: 180,
        showSorterTooltip: false,
        ellipsis: { showTitle: true },
        sortDirections: ["descend", "ascend", "descend"],
        sorter: (a, b) => sorter(a.email, b.email),
      },
      {
        title: "Action",
        align: "center",
        width: 100,
        render: (text, record) => (
          <Space>
            <a
              title="Remove Access"
              className="font-16"
              style={{ color: "red" }}
            >
              {currentuser?.loginUserID !== record.userID ? (
                <CloseOutlined onClick={() => revokeAccess(record)} />
              ) : (
                <></>
              )}
            </a>
          </Space>
        ),
      },
    ];
    return _columns;
  };

  const renderTitle = (title, count) => (
    <span
      style={{
        fontWeight: "bold",
        color: "black",
      }}
    >
      {title}
    </span>
  );

  const renderItem = (value, title, roleGroupName, email, roleGroupId) => ({
    value: value,
    label: (
      <Row>
        <Col span={8}>
          {" "}
          <Text ellipsis={true}>{title}</Text>
        </Col>
        <Col span={7}>
          {" "}
          <Text ellipsis={true}>{roleGroupName}</Text>
        </Col>
        <Col span={7}>
          {" "}
          <Text ellipsis={true}>{email}</Text>
        </Col>
        <Col span={2}>
          <a
            type="button"
            title="Grant Access"
            className="font-16"
            style={{ color: "Green" }}
          >
            <PlusOutlined
              onClick={() => {
                invokeGrantAccess(
                  value,
                  title,
                  roleGroupName,
                  email,
                  roleGroupId
                );
              }}
            />
          </a>
        </Col>
      </Row>
    ),
  });

  const invokeGrantAccess = (
    value,
    title,
    roleGroupName,
    email,
    roleGroupId
  ) => {
    let param = {};
    if (email != "") {
      param = {
        userRole: [
          {
            reportMasterId: selectedRecord.reportMasterID,
            userId: value,
            roleGroupId: roleGroupId,
            reportName: selectedRecord.reportName,
            userName: title,
            roleName: roleGroupName,
            email: email,
            isAccessToRole: false,
          },
        ],
      };
    } else {
      param = {
        userRole: [
          {
            reportMasterId: selectedRecord.reportMasterID,
            userId: null,
            roleGroupId: value,
            reportName: selectedRecord.reportName,
            userName: "",
            roleName: title,
            email: "",
            isAccessToRole: true,
          },
        ],
      };
    }
    manageAccessService.insertGrantAccess(param).then((response) => {
      if (statusCode(response, NOTIFICATION_TITLE.MANAGE_ACCESS)) return;
      if (nullDataCheck(response, NOTIFICATION_TITLE.MANAGE_ACCESS)) return;

      if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
        if (response.data > 0) {
          showNotification(
            ENUM_NOTIFY_TYPE.SUCCESS,
            NOTIFICATION_TITLE.MANAGE_ACCESS,
            "Report shared successfully. "
          );
          getManageAccessList();
        } else {
          showNotification(
            ENUM_NOTIFY_TYPE.INFO,
            NOTIFICATION_TITLE.MANAGE_ACCESS,
            "User/Role already exists. "
          );
        }
      } else
        showNotification(
          ENUM_NOTIFY_TYPE.ERROR,
          NOTIFICATION_TITLE.MANAGE_ACCESS,
          response.message
        );
    });
  };

  useEffect(() => {
    if (name.length < 3) {
      setOptions([]);
    }
  }, [refreshList]);

  const getOnSearch = (filterValue) => {
    setName(filterValue);
    if (filterValue.length >= 3) {
      setLoading(true);
      reportDashboardTabService
        .getManageSearchList(filterValue)
        .then((response) => {
          if (statusCode(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
          if (nullDataCheck(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
          if (response.data.length === 0) {
            showNotification(
              ENUM_NOTIFY_TYPE.INFO,
              NOTIFICATION_TITLE.MANAGE_SEARCH,
              response.message
            );
            return;
          }
          setListState((prevState) => ({
            ...prevState,
            searchList: response.data,
            totalRecords: response.totalRecords,
          }));
          setLoading(false);
          const _data = {
            user_role: [],
          };

          let userOptions = [];
          let roleOptions = [];
          response.data.lstuser.map((data) => {
            userOptions.push(
              renderItem(
                data.Id,
                data.Name,
                data.roleGroupName,
                data.email,
                data.roleGroupID
              )
            );
          });
          response.data.lstrole.map((data) => {
            roleOptions.push(renderItem(data.Id, data.Name, "", "", 0));
          });

          if (userOptions.length > 0) {
            _data.user_role.push({
              label: renderTitle("Users", userOptions.length),
              options: userOptions,
            });
          }
          if (roleOptions.length > 0) {
            _data.user_role.push({
              label: renderTitle("Roles", roleOptions.length),
              options: roleOptions,
            });
          }
          setOptions(_data.user_role);
          setrefreshList(_data.user_role);
        });
    } else if (filterValue.length === 0 && options.length > 0) {
      // Preserve the search text when clicking on the search box again
      setOptions([]);
      const _data = {
        user_role: [],
      };

      let userOptions = [];
      let roleOptions = [];
      listState.searchList.lstuser.map((data) => {
        userOptions.push(
          renderItem(
            data.Id,
            data.Name,
            data.roleGroupName,
            data.email,
            data.roleGroupID
          )
        );
      });
      listState.searchList.lstrole.map((data) => {
        roleOptions.push(renderItem(data.Id, data.Name, "", "", 0));
      });

      if (userOptions.length > 0) {
        _data.user_role.push({
          label: renderTitle("Users", userOptions.length),
          options: userOptions,
        });
      }
      if (roleOptions.length > 0) {
        _data.user_role.push({
          label: renderTitle("Roles", roleOptions.length),
          options: roleOptions,
        });
      }
      setOptions(_data.user_role);
      setrefreshList(_data.user_role);
    } else {
      setOptions([]);
    }
  };

  const onCloseModal = () => {
    setName("");
    setOptions([]);
    setmAPagination({
      ...mAPagination,
      current: 1,
      pageSize: 10,
    });
    setListState(() => ({
      manageAccessDataList: [],
      totalRecords: 0,
    }));
  };

  const onSelect = (val, option) => {
    setName(option.label.props.children[0].props.children[1].props.children);
  };

  return (
    <>
      <Modal
        title="Manage Access"
        width={900}
        open={open}
        onCancel={() => setisopen(false)}
        bodyStyle={{ padding: "1rem" }}
        className="theme-modal-wrap"
        closeIcon={<CloseCircleOutlined onClick={() => onCloseModal()} />}
        footer={false}
        destroyOnClose={true}
        maskClosable={false}
      >
        <AutoComplete
          className="autocomplete-edit mb-3"
          popupClassName="certain-category-search-dropdown search-pointer-edit"
          dropdownMatchSelectWidth={false}
          style={{
            width: "100%",
            position: "relative",
            cursor: "auto",
          }}
          onChange={getOnSearch}
          options={options}
          getPopupContainer={(trigger) => trigger.parentElement}
          onSelect={(val, option) => onSelect(val, option)}
          value={name}
        >
          <Input
            placeholder="Search for user or role"
            prefix={<SearchOutlined />}
            allowClear
          />
        </AutoComplete>

        <Table
          key="my_manageaccess_table"
          rowKey="id"
          scroll={{
            x: 600,
            y: 282,
          }}
          dataSource={listState.manageAccessDataList}
          loading={{ indicator: <ChildLoading />, spinning: pageLoading }}
          columns={getManageAccessColumns()}
          pagination={{
            ...mAPagination,
            total: listState.totalRecords, // need to pass no. of record count if api will return it
            onChange: async (page, pageSize) => {
              setmAPagination({
                ...mAPagination,
                current: page,
                pageSize: pageSize,
                total: listState.totalRecords,
              });
            },
          }}
        />
      </Modal>
    </>
  );
}

export default ManageAccessRole;
