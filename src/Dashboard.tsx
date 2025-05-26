import React from "react";
import DashBoardProfile from "./Components/DashBoardProfile";
import Progress from "./Components/Progress";
import Courses from "./Components/Courses";
import Activity from "./Components/Activity";
import Upcoming from "./Components/Upcoming";
import Calendar from "./Components/Calendar";
const Dashboard : React.FC =() => {
  return (
    <div style={{ backgroundColor: "#F3EDED", minHeight: "100vh" }}>
      <div className="" style={{ backgroundColor: "#F3EDED" }}>
        <div className="container-fluid">
          <div className="row" >
            <div className="col me-3 mt-3 rounded-3 text-white" style={{ backgroundColor: "#111111" }}>
              <div className="row me-2 mt-2 mb-2">
                <div className="col-lg-7 col-md-6 col-xl-8 col-xxl-7">
                  <DashBoardProfile />
                </div>
                <div className="col-lg-5 col-md-6 col-xl-4 col-xxl-5">
                  <Progress />
                </div>
              </div>
            </div>
          </div>
          <div className="row mt-2 mb-2 " style={{marginRight: "0px"}}>
            <div className="col bg-white rounded-3 px-4 " >
              <Courses />
            </div>
          </div>
          <div className="row mt-2 mb-2" style={{marginRight: "0px"}}>
            <div className="col-sm-12 col-md-12 col-lg-5 p-0 ">
              <Activity />
            </div>
            <div className="col-sm-12 col-md-8 col-lg-4 p-0">
              <Upcoming />
            </div>
            <div className="col-sm-12 col-md-4 col-lg-3 p-0">
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
