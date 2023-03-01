import React, {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Table, Space, Button, Typography } from "antd";
import { StarOutlined, SettingOutlined, StarFilled } from "@ant-design/icons";
import { ReportDashboardContext } from "../reportanddashboard.component";
import ManageAccessRole from "./manageaccessrole.component";
import { iPagination } from "../../../Shared/Pagination";
import {
  NOTIFICATION_TITLE,
  ENUM_NOTIFY_TYPE,
  RESULT_STATUS,
  FUNCTIONALITY,
  REPORTS_TABS_ENUM,
} from "../../../Common/utility/globalenums";
import {
  statusCode,
  nullDataCheck,
  showNotification,
  someThingWrong,
} from "../../../Shared/Common";
import ReportAndDashboardTabsService from "../../../Services/ReportAndDashboard/reportanddashboardtabs.service";
import ENUM_HTTPSTATUSCODE from "../../../Common/utility/httpstatuscode.enum";
import { AuthContext } from "../../../AppState";
const { Link } = Typography;

const DashboardTab = (props, ref) => {
  const { _filterData, isSearchClick } = props;
  const { setLoading, reportID } = useContext(ReportDashboardContext);
  const [manageaccessopen, setIsmanageaccessopen] = useState(false);
  const [DPagination, setDPagination] = useState(iPagination);
  const { getCurrentUser } = useContext(AuthContext);
  const currentuser = getCurrentUser();
  const [dashboardService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  const [selectedRecord, setSelectedRecord] = useState({
    reportMasterID: 0,
    reportName: "",
    reportDisplayName: "",
  });
  const _columns = [
    {
      title: "Report Name",
      dataIndex: "reportDisplayName",
      key: "reportDisplayName",
      ellipsis: true,
      render: (text, record) => {
        return (
          <>
            <Link href={record.reportUrl} target="_blank">
              {text}
            </Link>
          </>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "reportTypeName",
      key: "reportTypeName",
      ellipsis: true,
    },
    {
      title: "Module",
      dataIndex: "reportServiceName",
      key: "reportServiceName",
      ellipsis: true,
    },
    {
      title: "Manage Action",
      dataIndex: "isMyFav",
      key: "isMyFav",
      ellipsis: true,
      align: "center",
      render: (index, record) => (
        <Space size={"small"} style={{ height: "0" }}>
          {currentuser.roleFunctionality.includes(
            FUNCTIONALITY.TABS_KEY.MY_FAVOURITE
          ) ? (
            record != null ? (
              record.isMyFav === false ? (
                <Button type="link" className="p-0">
                  <StarOutlined
                    title="Add to favorite"
                    checked={record.isMyFav}
                    onClick={() => {
                      handleSaveConfig(record.reportMasterID, 1);
                    }}
                  />
                </Button>
              ) : (
                <Button type="link" className="p-0">
                  <StarFilled
                    title="Remove from favorite"
                    checked={record.isMyFav}
                    onClick={() => {
                      handleSaveConfig(record.reportMasterID, 0);
                    }}
                  />
                </Button>
              )
            ) : (
              <Button type="link" className="p-0">
                <StarOutlined
                  title="Add to favorite"
                  checked={record.isMyFav}
                  onClick={() => {
                    handleSaveConfig(record.reportMasterID, 1);
                  }}
                />
              </Button>
            )
          ) : null}

          {currentuser.roleFunctionality.includes(
            FUNCTIONALITY.BUTTONS_KEY.MANAGE_ACCESS
          ) ? (
            <Button type="link" className="p-0">
              <SettingOutlined
                onClick={() => {
                  setSelectedRecord((prevState) => ({
                    ...prevState,
                    reportMasterID: record.reportMasterID,
                    reportName: record.reportName,
                    layoutID: record.layoutID,
                    reportDisplayName: record.reportDisplayName,
                  }));
                  setIsmanageaccessopen(true);
                }}
                title="Manage Access"
              />
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];
  const [data, setData] = useState({
    dashboardDataList: [],
    totalRecords: 0,
  });

  useEffect(() => {
    if (_filterData) getDashboardList(reportID, _filterData);
    if (isSearchClick)
      setDPagination({
        ...DPagination,
        current: iPagination.current,
        pageSize: iPagination.pageSize,
      });
  }, [_filterData]);

  useImperativeHandle(
    ref,
    () => ({
      getDashboardList,
      setDPagination,
    }),
    []
  );

  const getDashboardList = (reportID, filterdata) => {
    let params = {
      filters: "",
      roleGroupID: 0,
      tabID: REPORTS_TABS_ENUM.DASHBOARDS,
      reportMasterID: reportID,
      reportTypeIds: filterdata?.Category,
      reportGroupIDs: filterdata?.Module,
    };
    setLoading(true);
    DPagination.total = data.totalRecords;
    dashboardService.getSavedReports(params).then((response) => {
      setLoading(false);
      if (nullDataCheck(response, NOTIFICATION_TITLE.DASHBOARD)) return;
      if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
        if (response.data.length === 0) {
          setData((prevState) => ({
            ...prevState,
            dashboardDataList: response.data,
            totalRecords: response.totalRecords,
          }));
          return;
        }
        setData((prevState) => ({
          ...prevState,
          dashboardDataList: response.data,
          totalRecords: response.totalRecords,
        }));
        //condition added to handle the warning of pagination as undefined
        if (DPagination !== undefined)
          DPagination.current = response.data[0]?.currentPage;
      }
    });
  };

  const handleSaveConfig = (item, status) => {
    setLoading(true);
    let recordToUpdate = data.dashboardDataList.filter(
      (x) => x.reportMasterID == item
    );
    if (recordToUpdate != null) {
      if (status == 0) {
        recordToUpdate[0].isMyFav = false;
      } else if (status == 1) {
        recordToUpdate[0].isMyFav = true;
      }
    }
    dashboardService.setFavouriteDetails(recordToUpdate).then((res) => {
      setLoading(false);
      if (statusCode(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;
      if (nullDataCheck(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;

      if (res?.result?.toLowerCase() === RESULT_STATUS.SUCCESS) {
        if (status == 1) {
          showNotification(
            ENUM_NOTIFY_TYPE.SUCCESS,
            NOTIFICATION_TITLE.MANAGE_FAVOURITE,
            "Report marked as favorite."
          );
        } else if (status == 0) {
          showNotification(
            ENUM_NOTIFY_TYPE.SUCCESS,
            NOTIFICATION_TITLE.MANAGE_FAVOURITE,
            "Report removed from favorites."
          );
        }
      } else {
        showNotification(
          ENUM_NOTIFY_TYPE.ERROR,
          NOTIFICATION_TITLE.MANAGE_FAVOURITE,
          someThingWrong
        );
      }
    });
  };

  return (
    <>
      <ManageAccessRole
        open={manageaccessopen}
        setisopen={setIsmanageaccessopen}
        selectedRecord={selectedRecord}
      />
      <Table
        key="dashboard_table"
        rowKey="reportMasterID"
        columns={_columns}
        dataSource={data.dashboardDataList}
        loading={setLoading}
        pagination={{
          ...DPagination,
          total: data.totalRecords, // need to pass no. of record count if api will return it
          onChange: async (page, pageSize) => {
            let pageNumber = DPagination.pageSize !== pageSize ? 1 : page;
            setDPagination({
              ...DPagination,
              current: pageNumber,
              pageSize: pageSize,
            });
          },
        }}
      />
    </>
  );
};

export default forwardRef(DashboardTab);
