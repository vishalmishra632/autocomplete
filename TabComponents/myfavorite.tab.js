import React, {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Table, Space, Button, Typography } from "antd";
import { SettingOutlined, StarFilled } from "@ant-design/icons";
import { ReportDashboardContext } from "../reportanddashboard.component";

import {
  FUNCTIONALITY,
  REPORTS_TABS_ENUM,
  NOTIFICATION_TITLE,
  ENUM_NOTIFY_TYPE,
  RESULT_STATUS,
} from "../../../Common/utility/globalenums";
import ManageAccessRole from "./manageaccessrole.component";
import { iPagination } from "../../../Shared/Pagination";
import {
  statusCode,
  nullDataCheck,
  showNotification,
  someThingWrong,
} from "../../../Shared/Common";
import ReportAndDashboardTabsService from "../../../Services/ReportAndDashboard/reportanddashboardtabs.service";
import ENUM_HTTPSTATUSCODE from "../../../Common/utility/httpstatuscode.enum";
import { AuthContext } from "../../../AppState";
import { usePromiseTracker } from "react-promise-tracker";

const MyFavoriteTab = (props, ref) => {
  const { Link } = Typography;
  const { _filterData, isSearchClick } = props;
  const { setLoading, isRefresh, setIsRefresh, reportID } = useContext(
    ReportDashboardContext
  );
  const [favouriteService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  const [fVPagination, setfVPagination] = useState(iPagination);
  const { getCurrentUser } = useContext(AuthContext);
  const currentuser = getCurrentUser();
  const [manageaccessopen, setIsmanageaccessopen] = useState(false);
  const [isfavremoved, setisfavremoved] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState({
    reportMasterID: 0,
    reportName: "",
    reportDisplayName: "",
  });
  const { promiseInProgress } = usePromiseTracker();
  let [isLoading, setIsLoading] = useState(false);

  const _columns = [
    {
      title: "Report Name",
      dataIndex: "reportDisplayName",
      key: "reportDisplayName",
      ellipsis: true,
      render: (text, record) => {
        return (
          <>
            <Link href={record.reportUrl} target="_blank" title={text}>
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
          {record != null ? (
            record.isMyFav === false ? (
              <Button
                type="link"
                className="p-0"
                onClick={() => {
                  handleSaveConfig(record.reportMasterID, 0);
                  setisfavremoved(true);
                }}
              >
                <StarFilled
                  title="Remove from favorite"
                  checked={record.isMyFav}
                />
              </Button>
            ) : null
          ) : null}

          {currentuser.roleFunctionality.includes(
            FUNCTIONALITY.BUTTONS_KEY.MANAGE_ACCESS
          ) ? (
            <Button
              type="link"
              className="p-0"
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
            >
              <SettingOutlined title="Manage Access" />
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];
  const [data, setData] = useState({
    myfavouriteDataList: [],
    totalRecords: 0,
  });

  useEffect(() => {
    if (_filterData) getMyFavoriteList(reportID, _filterData);
    if (isfavremoved)
      setfVPagination({
        ...fVPagination,
        current: fVPagination.current,
        pageSize: fVPagination.pageSize,
      });
    if (isSearchClick)
      setfVPagination({
        ...fVPagination,
        current: iPagination.current,
        pageSize: iPagination.pageSize,
      });
  }, [isRefresh.isRefreshMyReporDashbord, _filterData]);

  useImperativeHandle(
    ref,
    () => ({
      getMyFavoriteList,
      setfVPagination,
    }),
    []
  );

  const getMyFavoriteList = (reportID, filterdata) => {
    setIsLoading(true);
    let params = {
      filters: "",
      tabID: REPORTS_TABS_ENUM.MY_FAVOURITE,
      reportMasterID: reportID,
      reportTypeIds: filterdata?.Category,
      reportGroupIDs: filterdata?.Module,
    };

    fVPagination.total = data.totalRecords;
    favouriteService.getMyFavourite(params).then((response) => {
      setIsLoading(false);
      if (nullDataCheck(response, NOTIFICATION_TITLE.MY_FAVOURITE)) return;
      if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
        if (response.data.length === 0) {
          setData((prevState) => ({
            ...prevState,
            myfavouriteDataList: response.data,
            totalRecords: response.totalRecords,
          }));
          return;
        }
        setData((prevState) => ({
          ...prevState,
          myfavouriteDataList: response.data,
          totalRecords: response.totalRecords,
        }));
        //condition added to handle the warning of pagination as undefined
        if (fVPagination !== undefined)
          fVPagination.current = response.data[0]?.currentPage;
      }
    });
  };

  const handleSaveConfig = (item, status) => {
    setLoading(true);
    let recordToUpdate = data.myfavouriteDataList.filter(
      (x) => x.reportMasterID == item
    );
    if (recordToUpdate != null) {
      if (status == 0) {
        recordToUpdate[0].isMyFav = false;
      } else if (status == 1) {
        recordToUpdate[0].isMyFav = true;
      }
    }
    favouriteService.setFavouriteDetails(recordToUpdate).then((res) => {
      setLoading(false);
      if (statusCode(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;
      if (nullDataCheck(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;

      if (res?.result?.toLowerCase() === RESULT_STATUS.SUCCESS) {
        if (status == 0) {
          showNotification(
            ENUM_NOTIFY_TYPE.SUCCESS,
            NOTIFICATION_TITLE.MANAGE_FAVOURITE,
            "Report removed from favorites."
          );
        }
        setIsRefresh((prev) => ({
          ...prev,
          isRefreshMyReporDashbord: !prev.isRefreshMyReporDashbord,
        }));
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
        key="my_favourite_table"
        rowKey="reportMasterID"
        dataSource={data.myfavouriteDataList}
        columns={_columns}
        locale={{ emptyText: isLoading || promiseInProgress ? " " : "" }}
        scroll={{ y: 500 }}
        pagination={{
          ...fVPagination,
          total: data.totalRecords, // need to pass no. of record count if api will return it
          onChange: async (page, pageSize) => {
            let pageNumber = fVPagination.pageSize !== pageSize ? 1 : page;
            setfVPagination({
              ...fVPagination,
              current: pageNumber,
              pageSize: pageSize,
            });
          },
        }}
        loading={setLoading}
      />
    </>
  );
};

export default forwardRef(MyFavoriteTab);
