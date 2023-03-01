import React, {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Table, Space, Typography, Button } from "antd";
import { StarOutlined, SettingOutlined, StarFilled } from "@ant-design/icons";
import { ReportDashboardContext } from "../reportanddashboard.component";
import ManageAccessRole from "./manageaccessrole.component";
import ReportAndDashboardTabsService from "../../../Services/ReportAndDashboard/reportanddashboardtabs.service";
import { iPagination } from "../../../Shared/Pagination";
import {
  ENUM_NOTIFY_TYPE,
  NOTIFICATION_TITLE,
  RESULT_STATUS,
  REPORTS_TABS_ENUM,
} from "../../../Common/utility/globalenums";
import {
  statusCode,
  nullDataCheck,
  showNotification,
  someThingWrong,
} from "../../../Shared/Common";
import ENUM_HTTPSTATUSCODE from "../../../Common/utility/httpstatuscode.enum";
import { usePromiseTracker } from "react-promise-tracker";

const SavedReportsTab = (props, ref) => {
  const { Link } = Typography;
  const { _filterData, isSearchClick } = props;
  const { setLoading, setIsRefresh, reportID } = useContext(
    ReportDashboardContext
  );
  const [manageaccessopen, setIsmanageaccessopen] = useState(false);
  const [sRPagination, setsRPagination] = useState(iPagination);
  const [savedReportService] = useState(
    () => new ReportAndDashboardTabsService()
  );
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
                  handleSaveConfig(record.reportMasterID, 1);
                }}
              >
                <StarOutlined
                  title="Add to favorite"
                  checked={record.isMyFav}
                />
              </Button>
            ) : (
              <Button
                type="link"
                className="p-0"
                onClick={() => {
                  handleSaveConfig(record.reportMasterID, 0);
                }}
              >
                <StarFilled
                  title="Remove from favorite"
                  checked={record.isMyFav}
                />
              </Button>
            )
          ) : (
            <Button
              type="link"
              className="p-0"
              onClick={() => {
                handleSaveConfig(record.reportMasterID, 1);
              }}
            >
              <StarOutlined title="Add to favorite" checked={record.isMyFav} />
            </Button>
          )}
          {
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
          }
        </Space>
      ),
    },
  ];

  const [data, setData] = useState({
    savedReportDataList: [],
    totalRecords: 0,
  });

  const [selectedRecord, setSelectedRecord] = useState({
    reportMasterID: 0,
    reportName: "",
    reportDisplayName: "",
  });

  useEffect(() => {
    if (_filterData) getSavedReportsList(reportID, _filterData);
    if (isSearchClick)
      setsRPagination({
        ...sRPagination,
        current: iPagination.current,
        pageSize: iPagination.pageSize,
      });
  }, [_filterData]);

  useImperativeHandle(
    ref,
    () => ({
      getSavedReportsList,
      setsRPagination,
    }),
    []
  );

  const handleSaveConfig = (item, status) => {
    setLoading(true);
    let recordToUpdate = data.savedReportDataList.filter(
      (x) => x.reportMasterID == item
    );
    if (recordToUpdate != null) {
      if (status == 0) {
        recordToUpdate[0].isMyFav = false;
      } else if (status == 1) {
        recordToUpdate[0].isMyFav = true;
      }
    }
    savedReportService.setFavouriteDetails(recordToUpdate).then((res) => {
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

  const getSavedReportsList = (reportID, filterdata) => {
    setIsLoading(true);
    let params = {
      filters: "",
      roleGroupID: 0,
      tabID: REPORTS_TABS_ENUM.REPORTS,
      reportMasterID: reportID,
      reportTypeIds: filterdata?.Category,
      reportGroupIDs: filterdata?.Module,
    };
    sRPagination.total = data.totalRecords;
    savedReportService.getSavedReports(params).then((response) => {
      setIsLoading(false);
      if (nullDataCheck(response, NOTIFICATION_TITLE.SAVED_REPORTS)) return;
      if (response.statusCode === ENUM_HTTPSTATUSCODE.OK) {
        if (response.data.length === 0) {
          setData((prevState) => ({
            ...prevState,
            savedReportDataList: response.data,
            totalRecords: response.totalRecords,
          }));
          return;
        }
        setData((prevState) => ({
          ...prevState,
          savedReportDataList: response.data,
          totalRecords: response.totalRecords,
        }));

        //condition added to handle the warning of pagination as undefined
        if (sRPagination !== undefined)
          sRPagination.current = response.data[0]?.currentPage;
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
        key="saved_report_table"
        rowKey="reportMasterID"
        dataSource={data.savedReportDataList}
        columns={_columns}
        locale={{ emptyText: isLoading || promiseInProgress ? " " : "" }}
        scroll={{ y: 500 }}
        pagination={{
          ...sRPagination,
          total: data.totalRecords, // need to pass no. of record count if api will return it
          onChange: async (page, pageSize) => {
            let pageNumber = sRPagination.pageSize !== pageSize ? 1 : page;
            setsRPagination({
              ...sRPagination,
              current: pageNumber,
              pageSize: pageSize,
            });
          },
        }}
      />
    </>
  );
};

export default forwardRef(SavedReportsTab);
