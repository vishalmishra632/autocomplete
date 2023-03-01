import React, {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Table, Space } from "antd";
import { StarOutlined, SettingOutlined, StarFilled } from "@ant-design/icons";
import { ReportDashboardContext } from "../reportanddashboard.component";
import ManageAccessRole from "./manageaccessrole.component";
import Paths from "../../../Shared/Path";
import { Link } from "react-router-dom";
import { iPagination } from "../../../Shared/Pagination";
import ReportAndDashboardTabsService from "../../../Services/ReportAndDashboard/reportanddashboardtabs.service";
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
import { AuthContext } from "../../../AppState";

const CoreReportsTab = (props, ref) => {
  const { setLoading, setIsRefresh } = useContext(ReportDashboardContext);
  const { _filterData, setColumnsToHOC, setAllFiltersAndDownloadxlsToHoc } =
    props;
  const [coreReportService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  const [manageaccessopen, setIsmanageaccessopen] = useState(false);
  const { getCurrentUser } = useContext(AuthContext);
  const currentuser = getCurrentUser();
  const [cRPagination, setcRPagination] = useState(iPagination);
  const [updateList, setUpdateList] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState({
    reportMasterID: 0,
    reportName: "",
  });

  let addfilterOptionData = [
    {
      key: "Type",
      filterName: "Type",
      type: "MultipleSelectionDropdown",
      defaultValue: ["ALL"],
      defaultDisplayValue: "ALL",
      ServiceMethod: "getTypes",
      ServiceName: coreReportService,
      title: "reportTypeName",
      value: "reportTypeID",
      isRequired: true,
    },
    {
      key: "ServiceLine",
      filterName: "Service Line",
      type: "MultipleSelectionDropdown",
      defaultValue: ["ALL"],
      defaultDisplayValue: "ALL",
      ServiceMethod: "getServiceLine",
      ServiceName: coreReportService,
      title: "reportServiceName",
      value: "reportServiceID",
      isRequired: true,
    },
  ];

  const [data, setData] = useState({
    coreReportDataList: [],
    totalRecords: 0,
    addFilterOption: addfilterOptionData,
  });

  useEffect(() => {
    bindColumnsToHOC();
  }, []);

  //Use : bind all columns to ManageColumns ,bind filter
  const bindColumnsToHOC = () => {
    let _columns = getCoreReportColumns();
    setColumnsToHOC(_columns);
    let notification_Title = NOTIFICATION_TITLE.CORE_REPORTS;
    // filter obj
    setAllFiltersAndDownloadxlsToHoc(addfilterOptionData, notification_Title);
  };

  useEffect(() => {
    if (_filterData) getCoreReportList(0, _filterData);
  }, [_filterData]);

  useImperativeHandle(
    ref,
    () => ({
      getCoreReportList,
      setcRPagination,
    }),
    []
  );

  const getCoreReportList = (reportID, filterdata) => {
    let params = {
      // reportGroupIDs: "1,2,3",
      roleGroupID: 0,
      tabID: REPORTS_TABS_ENUM.CORE_REPORTS,
      reportMasterID: reportID,
      reportTypeIds: filterdata?.Type,
      reportGroupIDs: filterdata?.ServiceLine,
    };
    cRPagination.total = data.totalRecords;
    setLoading(true);
    coreReportService.getSavedReports(params).then((response) => {
      if (statusCode(response, NOTIFICATION_TITLE.CORE_REPORTS)) return;
      if (nullDataCheck(response, NOTIFICATION_TITLE.CORE_REPORTS)) return;
      if (response.data.length === 0) {
        showNotification(
          ENUM_NOTIFY_TYPE.INFO,
          NOTIFICATION_TITLE.CORE_REPORTS,
          response.message
        );
        return;
      }
      setData((prevState) => ({
        ...prevState,
        coreReportDataList: response.data,
        totalRecords: response.totalRecords,
      }));
      setLoading(false);
      if (cRPagination !== undefined)
        cRPagination.current = response.data[0]?.currentPage;
    });
  };

  const handleFavouriteChange = (inProcessRecord, isMyFav) => {
    let index = data.coreReportDataList.findIndex(
      (x) => x.reportMasterID === inProcessRecord.reportMasterID
    );

    if (index > -1) {
      let newItem = data.coreReportDataList[index];

      newItem.isMyFav = !isMyFav;
      setData((prev) => [
        ...prev.slice(0, index),
        newItem,
        ...prev.slice(index + 1, prev.length),
      ]);
      let updateIndex = updateList.findIndex(
        (x) => x.reportMasterID === inProcessRecord.reportMasterID
      );
      updateIndex > -1
        ? setUpdateList((prev) => [
            ...prev.slice(0, updateIndex),
            newItem,
            ...prev.slice(updateIndex + 1, prev.length),
          ])
        : setUpdateList((prev) => [...prev, newItem]);
    }
  };

  const handleSaveConfig = (item, status) => {
    setLoading(true);
    let recordToUpdate = data.coreReportDataList.filter(
      (x) => x.reportMasterID == item
    );
    if (recordToUpdate != null) {
      if (status == 0) {
        recordToUpdate[0].isMyFav = false;
      } else if (status == 1) {
        recordToUpdate[0].isMyFav = true;
      }
    }
    coreReportService.setFavouriteDetails(recordToUpdate).then((res) => {
      setLoading(false);
      if (statusCode(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;
      if (nullDataCheck(res, NOTIFICATION_TITLE.MANAGE_FAVOURITE)) return;

      if (res?.result?.toLowerCase() === RESULT_STATUS.SUCCESS) {
        showNotification(
          ENUM_NOTIFY_TYPE.SUCCESS,
          NOTIFICATION_TITLE.MANAGE_FAVOURITE,
          res.message
        );
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

  const getCoreReportColumns = () => {
    const _columns = [
      {
        title: "Report Name",
        dataIndex: "reportName",
        key: "reportName",
        ellipsis: true,
        render: (text) => (
          <Link to={Paths.RAOpportunity} target="_blank">
            {" "}
            {text}{" "}
          </Link>
        ),
      },
      {
        title: "Service Line",
        dataIndex: "reportServiceName",
        key: "reportServiceName",
        ellipsis: true,
      },
      {
        title: "Manage Action",
        dataIndex: "isMyFav",
        key: "isMyFav",
        align: "center",
        render: (index, record) => (
          <Space>
            {currentuser.roleFunctionality.includes(
              FUNCTIONALITY.TABS_KEY.MY_FAVOURITE
            ) ? (
              record != null ? (
                record.isMyFav === false ? (
                  <StarOutlined
                    title="Add to favorite"
                    checked={record.isMyFav}
                    onClick={() => {
                      handleFavouriteChange(record, record.isMyFav);
                      handleSaveConfig(record.reportMasterID, 1);
                    }}
                  />
                ) : (
                  <StarFilled
                    title="Remove from favorite"
                    checked={record.isMyFav}
                    onClick={() => {
                      handleFavouriteChange(record, record.isMyFav);
                      handleSaveConfig(record.reportMasterID, 0);
                    }}
                  />
                )
              ) : (
                <StarOutlined
                  title="Add to favorite"
                  checked={record.isMyFav}
                  onClick={() => {
                    handleFavouriteChange(record, record.isMyFav);
                    handleSaveConfig(record.reportMasterID, 1);
                  }}
                />
              )
            ) : null}

            {currentuser.roleFunctionality.includes(
              FUNCTIONALITY.BUTTONS_KEY.MANAGE_ACCESS
            ) ? (
              <SettingOutlined
                onClick={() => {
                  setSelectedRecord((prevState) => ({
                    ...prevState,
                    reportMasterID: record.reportMasterID,
                    reportName: record.reportName,
                  }));
                  setIsmanageaccessopen(true);
                }}
                title="Manage Access"
              />
            ) : null}
          </Space>
        ),
      },
    ];
    return _columns;
  };

  return (
    <>
      <ManageAccessRole
        open={manageaccessopen}
        setisopen={setIsmanageaccessopen}
        selectedRecord={selectedRecord}
      />
      <Table
        key="Core_Reports_table"
        rowKey="reportMasterID"
        columns={getCoreReportColumns()}
        dataSource={data.coreReportDataList}
        loading={setLoading}
        pagination={{
          ...cRPagination,
          total: data.totalRecords, // need to pass no. of record count if api will return it
          onChange: async (page, pageSize) => {
            let pageNumber = cRPagination.pageSize !== pageSize ? 1 : page;
            setcRPagination({
              ...cRPagination,
              current: pageNumber,
              pageSize: pageSize,
            });
          },
        }}
      />
    </>
  );
};

export default forwardRef(CoreReportsTab);
