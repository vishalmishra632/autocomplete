import React, {
  useState,
  useRef,
  createContext,
  useContext,
  useEffect,
} from "react";
import { Card, Tabs, Space } from "antd";
import MyFavoriteTab from "./TabComponents/myfavorite.tab";
import SavedReportsTab from "./TabComponents/savedreports.tab";
import DashboardTab from "./TabComponents/dashboard.tab";
import ReportsAutoComplete from "./reportautocomplete";
import { FUNCTIONALITY } from "../../Common/utility/globalenums";
import { AuthContext } from "../../AppState";
import { iPagination } from "../../Shared/Pagination";
import AddFilterButton from "../../Components/Common/GridAttributeHocUI/AddFilter/addfilter.component";
import GridAttributeHOC from "../../Components/Common/HOC/gridattributeHOC.component";
import ReportAndDashboardTabsService from "../../Services/ReportAndDashboard/reportanddashboardtabs.service";

export const ReportDashboardContext = createContext();

const { TabPane } = Tabs;

function ReportsAndDashboard(props) {
  const { setAllFiltersAndDownloadxlsToHoc } = props;
  const { getCurrentUser } = useContext(AuthContext);
  const currentuser = getCurrentUser();
  const { setLoading } = useContext(AuthContext);
  const [reportID, setReportID] = useState(0);
  const [isRefresh, setIsRefresh] = useState({
    isRefreshMyReporDashbord: false,
  });
  const [savedReportService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  let addfilterOptionData = [
    {
      key: "Category",
      filterName: "Category",
      type: "MultipleSelectionDropdown",
      defaultValue: ["ALL"],
      defaultDisplayValue: "ALL",
      ServiceMethod: "getTypes",
      ServiceName: savedReportService,
      title: "reportTypeName",
      value: "reportTypeID",
      isRequired: true,
    },
    {
      key: "Module",
      filterName: "Module",
      type: "MultipleSelectionDropdown",
      defaultValue: ["ALL"],
      defaultDisplayValue: "ALL",
      ServiceMethod: "getServiceLine",
      ServiceName: savedReportService,
      title: "reportServiceName",
      value: "reportServiceID",
      isRequired: true,
    },
  ];

  useEffect(() => {
    bindColumnsToHOC();
  }, []);

  useEffect(() => {
    if (reportID > 0 || reportID == 0) {
      callbackQueue(parentState.tabKey);
    }
  }, [reportID]);

  const TabsList = [
    FUNCTIONALITY.TABS_KEY.MY_FAVOURITE,
    FUNCTIONALITY.TABS_KEY.REPORTS,
    FUNCTIONALITY.TABS_KEY.DASHBOARDS,
    // FUNCTIONALITY.TABS_KEY.CORE_REPORTS,
  ];

  const FilterTabs = TabsList.filter(
    (element) =>
      !currentuser?.isSuperAdmin &&
      currentuser?.roleFunctionality.includes(element)
  );

  const [parentState, setParentState] = useState({
    tabKey:
      FilterTabs && FilterTabs.length > 0
        ? FilterTabs[0].toString()
        : FUNCTIONALITY.TABS_KEY.MY_FAVOURITE.toString(),
  });

  const refMyFavorite = useRef();
  const refReports = useRef();
  const refDashboards = useRef();

  const callbackQueue = (key) => {
    setParentState((prevState) => ({
      ...prevState,
      tabKey: key,
    }));
    if (key === FUNCTIONALITY.TABS_KEY.MY_FAVOURITE.toString()) {
      if (
        refMyFavorite.current !== undefined &&
        refMyFavorite.current !== null
      ) {
        refMyFavorite.current.getMyFavoriteList(reportID, props._filterData);
        refMyFavorite.current.setfVPagination(iPagination);
      }
    } else if (key === FUNCTIONALITY.TABS_KEY.REPORTS.toString()) {
      if (refReports.current !== undefined && refReports.current !== null) {
        refReports.current.getSavedReportsList(reportID, props._filterData);
        refReports.current.setsRPagination(iPagination);
      }
    } else if (key === FUNCTIONALITY.TABS_KEY.DASHBOARDS.toString()) {
      if (
        refDashboards.current !== undefined &&
        refDashboards.current !== null
      ) {
        refDashboards.current.getDashboardList(reportID, props._filterData);
        refDashboards.current.setDPagination(iPagination);
      }
    }
    // else if (key === FUNCTIONALITY.TABS_KEY.CORE_REPORTS.toString()) {
    //   if (
    //     refCoreReports.current !== undefined &&
    //     refCoreReports.current !== null
    //   ) {
    //     refCoreReports.current.getCoreReportList(reportID);
    //     refCoreReports.current.setcRPagination(iPagination);
    //   }
    // }
  };

  const bindColumnsToHOC = () => {
    // filter obj
    setAllFiltersAndDownloadxlsToHoc(addfilterOptionData);
  };

  return (
    <div className="m-3">
      <Space className="d-flex mb-2">
        <AddFilterButton {...props} />
      </Space>
      <ReportsAutoComplete
        {...props}
        parentState={parentState}
        setReportID={(reportID) => {
          setReportID(reportID);
        }}
      />
      <Card className="no-bg mt-3" bodyStyle={{ padding: "0" }}>
        <ReportDashboardContext.Provider
          value={{
            setLoading: setLoading,
            isRefresh,
            setIsRefresh,
            reportID,
            setReportID,
          }}
        >
          <Tabs
            defaultActiveKey={
              FilterTabs && FilterTabs.length > 0
                ? FilterTabs[0].toString()
                : FUNCTIONALITY.TABS_KEY.MY_FAVOURITE
            }
            activeKey={parentState.tabKey}
            onChange={callbackQueue}
          >
            {!currentuser?.isSuperAdmin &&
            currentuser?.roleFunctionality.includes(
              FUNCTIONALITY.TABS_KEY.MY_FAVOURITE
            ) ? (
              <TabPane
                key={FUNCTIONALITY.TABS_KEY.MY_FAVOURITE.toString()}
                tab={
                  <>
                    <span>{`My Favorites`}</span>
                  </>
                }
              >
                <MyFavoriteTab {...props} ref={refMyFavorite} />
              </TabPane>
            ) : (
              <></>
            )}
            {!currentuser?.isSuperAdmin &&
            currentuser?.roleFunctionality.includes(
              FUNCTIONALITY.TABS_KEY.REPORTS
            ) ? (
              <TabPane
                key={FUNCTIONALITY.TABS_KEY.REPORTS.toString()}
                tab={
                  <>
                    <span>{`Reports`}</span>
                  </>
                }
              >
                <SavedReportsTab {...props} ref={refReports} />
              </TabPane>
            ) : null}
            {!currentuser?.isSuperAdmin &&
            currentuser?.roleFunctionality.includes(
              FUNCTIONALITY.TABS_KEY.DASHBOARDS
            ) ? (
              <TabPane
                key={FUNCTIONALITY.TABS_KEY.DASHBOARDS.toString()}
                tab={
                  <>
                    <span>{`Dashboards`}</span>
                  </>
                }
              >
                <DashboardTab {...props} ref={refDashboards} />
              </TabPane>
            ) : null}
          </Tabs>
        </ReportDashboardContext.Provider>
      </Card>
    </div>
  );
}

export default GridAttributeHOC(ReportsAndDashboard);
