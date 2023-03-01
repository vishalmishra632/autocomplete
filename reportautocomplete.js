import React, { useState, useEffect } from "react";
import { Input, AutoComplete, Row, Col } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ReportAndDashboardTabsService from "../../Services/ReportAndDashboard/reportanddashboardtabs.service";
import { NOTIFICATION_TITLE } from "../../Common/utility/globalenums";
import { statusCode, nullDataCheck } from "../../Shared/Common";

function ReportsAutoComplete(props) {
  const [filterValue, setFilterValue] = useState("");
  const [refreshFilter, setrefreshFilter] = useState([]);
  const { setReportID, _filterData } = props;
  const [manageAccessService] = useState(
    () => new ReportAndDashboardTabsService()
  );
  const [options, setOptions] = useState([]);

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

  const renderItem = (title, value, typename, servicename, reportUrl) => ({
    value: value + "$%" + title,
    label: (
      <Row>
        <Col span={10}>
          {" "}
          <span className="d-none">{title}</span>
          <span
            className="text-truncate"
            style={{ display: "block", maxWidth: "80%" }}
            title={value}
          >
            {value}
          </span>
        </Col>
        <Col span={7}>
          {" "}
          <span>{typename}</span>
        </Col>
        <Col span={7}>
          {" "}
          <span>{servicename}</span>
        </Col>
      </Row>
    ),
    reportUrl: reportUrl,
  });

  useEffect(() => {
    if (filterValue.length < 3) {
      setOptions([]);
    }
  }, [refreshFilter]);

  const generateOptions = (DashboardList, ReportList) => {
    const _data = {
      accounting: [],
    };

    let dashboardOptions = [];
    let reportOptions = [];
    if (DashboardList.length != 0) {
      DashboardList.map((data) => {
        dashboardOptions.push(
          renderItem(
            data.reportMasterID,
            data.reportDisplayName,
            data.reportTypeName,
            data.reportServiceName,
            data.reportUrl
          )
        );
      });

      _data.accounting.push({
        label: renderTitle("Dashboards"),
        options: dashboardOptions,
      });
    }
    if (ReportList.length != 0) {
      ReportList.map((data) => {
        reportOptions.push(
          renderItem(
            data.reportMasterID,
            data.reportDisplayName,
            data.reportTypeName,
            data.reportServiceName,
            data.reportUrl
          )
        );
      });
      _data.accounting.push({
        label: renderTitle("Reports"),
        options: reportOptions,
      });
    }
    setrefreshFilter(_data.accounting);
    setOptions(_data.accounting);
  };

  // const getOnSearch = (filterValue) => {
  //   setFilterValue(filterValue);
  //   if (filterValue.length >= 3) {
  //     let TabID = 5;
  //     let params = {
  //       reportName: filterValue,
  //       reportGroupIDs: _filterData?.Module,
  //       roleGroupID: 0,
  //       tabID: TabID,
  //       reportTypeIDs: _filterData?.Category,
  //     };
  //     manageAccessService.getSavedReports(params).then((response) => {
  //       if (statusCode(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
  //       if (nullDataCheck(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
  //       let ReportList = response.data.filter(
  //         (item) => item.reportFormatID === 1
  //       );
  //       let DashboardList = response.data.filter(
  //         (item) => item.reportFormatID === 2
  //       );
  //       generateOptions(DashboardList, ReportList);
  //       setTimeout(() => {
  //         let element = document.getElementsByClassName(
  //           "rc-virtual-list-holder"
  //         );
  //         if (
  //           element &&
  //           element.length > 0 &&
  //           element[0].scrollTop != undefined
  //         )
  //           element[0].scrollTop = 0;
  //       }, 200);
  //     });
  //   } else {
  //     setOptions([]);
  //   }
  // };





  // const onSelect = (val, option) => {
  //   setFilterValue(val.split("$%")[0]);
  //   const link = option.reportUrl;
  //   window.open(link, "_blank");
  //   // setName(option.value);
  // };


  const getOnSearch = (filterValue) => {
    setFilterValue(filterValue);
    if (filterValue.length >= 3) {
      let TabID = 5;
      let params = {
        reportName: filterValue,
        reportGroupIDs: _filterData?.Module,
        roleGroupID: 0,
        tabID: TabID,
        reportTypeIDs: _filterData?.Category,
      };
      manageAccessService.getSavedReports(params).then((response) => {
        if (statusCode(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
        if (nullDataCheck(response, NOTIFICATION_TITLE.MANAGE_SEARCH)) return;
        let ReportList = response.data.filter(
          (item) => item.reportFormatID === 1
        );
        let DashboardList = response.data.filter(
          (item) => item.reportFormatID === 2
        );
        const filteredOptions = [];
        DashboardList.forEach((data) => {
          if (data.reportDisplayName.toLowerCase().includes(filterValue.toLowerCase())) {
            filteredOptions.push(renderItem(
              data.reportMasterID,
              data.reportDisplayName,
              data.reportTypeName,
              data.reportServiceName,
              data.reportUrl
            ));
          }
        });
        ReportList.forEach((data) => {
          if (data.reportDisplayName.toLowerCase().includes(filterValue.toLowerCase())) {
            filteredOptions.push(renderItem(
              data.reportMasterID,
              data.reportDisplayName,
              data.reportTypeName,
              data.reportServiceName,
              data.reportUrl
            ));
          }
        });
        setOptions([{ label: renderTitle("Search Results"), options: filteredOptions }]);
        setTimeout(() => {
          let element = document.getElementsByClassName(
            "rc-virtual-list-holder"
          );
          if (
            element &&
            element.length > 0 &&
            element[0].scrollTop != undefined
          )
            element[0].scrollTop = 0;
        }, 200);
      });
    } else {
      setOptions([]);
    }
  };

  const onSelect = (val, option) => {
    setFilterValue(val.split("$%")[0]);
    const link = option.reportUrl;
    const selectedReport = option.label.props.children[0].props.children;
    setReportID(val.split("$%")[0]);
    props.searchReports(selectedReport);
  };
  

  return (
    <AutoComplete
      className="autocomplete-edit"
      popupClassName="certain-category-search-dropdown"
      dropdownMatchSelectWidth={500}
      style={{
        width: "100%",
        cursor: "auto",
      }}
      options={options}
      onChange={getOnSearch}
      onSelect={(val, option) => onSelect(val, option)}
      value={filterValue}
    >
      <Input.Search
        prefix={<SearchOutlined />}
        size="large"
        placeholder="Search for reports & dashboards by name"
        allowClear
        onChange={(e) => {
          if (e.target.value === "") {
            setReportID(0);
          }
        }}
      />
    </AutoComplete>
  );
}

export default ReportsAutoComplete;
