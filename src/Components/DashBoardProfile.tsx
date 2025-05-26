import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Rank from "./images/Rank.png";
import ProgressMeter from "./images/ProgressMeter.png";
import Badge from "./images/Badge.png";
import Hourglass from "./images/Hourglass.png";
import Skeleton from "react-loading-skeleton";
import axios from "axios";
import ph_star from "./images/ph_star-four-fill.png";
import { secretKey } from "../constants";
import CryptoJS from "crypto-js";
import { LiaEditSolid } from "react-icons/lia";
import UserPic from "./images/UserPic.jpg";

interface ProfileData {
  score?: string;
  college_rank?: string;
  overall_rank?: string;
  category?: string;
  hour_spent?: string;
  name?: string;
  student_id?: string;
}

function DashBoardProfile() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>({});
  const encryptedStudentId = sessionStorage.getItem('StudentId');
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://live-exskilence-be.azurewebsites.net/api/studentdashboard/summary/${studentId}/`
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [studentId]);

  return (
    <div
      className="row px-1 mx-1 my-2 py-3 rounded-3"
      style={{ backgroundColor: "#2B2B2B" }}
    >
      <div className="col-4 col-xl-3 m-0 p-0 justify-content-center">
        <div className="row justify-content-center">
          <img
            src={UserPic}
            alt="Profile"
            className="rounded-circle p-0"
            style={{ width: "100px", height: "100px" }}
          />
          <LiaEditSolid size={20} className="ps-5 ms-3 d-flex flex-end pr-auto justify-content-end text-end" style={{ cursor: "pointer" }} title="Edit Profile" onClick={() => navigate('/Profile')} />
        </div>
        <div className="row mt-2">
          {data.name ? (
            <div className="col text-center">
              <h5>{data.name}</h5>
              <p>{data.student_id}</p>
            </div>
          ) : (
            <Skeleton height={30} width={50} containerClassName="text-center p-0" />
          )}
        </div>
      </div>
      <div className="col-8 col-xl-9 m-0 p-0">
        <div className="text-white">
          <div className="container ps-5">
            <div className="row mb-3">
              <div className="col-5 text-start border-1 border-end" style={{ marginRight: "20px" }}>
                <div className="row">
                  <div className="col p-0 ps-2 m-0 d-flex me-auto justify-content-start text-center">
                    <div
                      className="border border-2 border-light rounded-circle d-flex justify-content-center align-items-center"
                      style={{ height: "50px", width: "50px" }}
                    >
                      <img src={ProgressMeter} className="" alt="Profile" />
                    </div>
                    <div className="p-0 m-0 ps-4 pt-1 text-center">
                      {data.score !== undefined && data.score !== null ? (
                        <>
                          <h6 className="text-start">{data.score}</h6>
                          <p className="mb-0 fw-light" style={{ fontSize: "12px" }}>
                            Score
                          </p>
                        </>
                      ) : (
                        <Skeleton height={20} width={50} containerClassName="text-center p-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col text-center">
                <div className="row">
                  <div className="col p-0 ps-2 m-0 d-flex me-auto justify-content-start text-center">
                    <div
                      className="border border-2 border-light rounded-circle d-flex justify-content-center align-items-center"
                      style={{ height: "50px", width: "50px" }}
                    >
                      <img src={Rank} className="" alt="rank" />
                    </div>
                    <div className="p-0 m-0 ps-3 pt-1 text-center">
                      {data.college_rank !== undefined && data.college_rank !== null ? (
                        <div className="d-flex flex-row">
                          <div>
                            <h6 className="text-start">{data.college_rank}</h6>
                            <p className="mb-0 fw-light" style={{ fontSize: "12px" }}>
                              College Rank
                            </p>
                          </div>
                          <div className="ps-2">
                            {data.overall_rank !== undefined && data.overall_rank !== null ? (
                              <>
                                <h6 className="text-start">{data.overall_rank}</h6>
                                <p className="mb-0 fw-light" style={{ fontSize: "12px" }}>
                                  Overall Rank
                                </p>
                              </>
                            ) : (
                              <Skeleton height={10} width={50} containerClassName="text-center p-0" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <Skeleton height={70} width={80} containerClassName="text-center p-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mb-3" style={{ marginRight: '-22px' }}>
              <div className="col-4 px-1" style={{ marginRight: '18px' }}>
                <hr style={{ borderColor: "white", opacity: "1" }} />
              </div>
              <div className="col-1 text-center text-white fw-bolder fs-5">
                <img src={ph_star} alt="ph_star" style={{ width: "20px", height: "20px" }} />
              </div>
              <div className="col-6">
                <hr style={{ borderColor: "white", opacity: "1" }} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-5 text-start border-1 border-end" style={{ marginRight: "20px" }}>
                <div className="row">
                  <div className="col d-flex me-auto justify-content-start text-center">
                    <div className="border border-2 border-light rounded-circle d-flex justify-content-center align-items-center" style={{ height: "50px", width: "50px" }}>
                      <img src={Badge} className="" alt="badge" />
                    </div>
                    <div className="p-0 ps-3 pt-1 m-0 text-start">
                      {data.category !== undefined && data.category !== null ? (
                        <>
                          <h6>{data.category}</h6>
                          <p className="mb-0 fw-light" style={{ fontSize: "12px" }}>
                            Category
                          </p>
                        </>
                      ) : (
                        <Skeleton height={20} width={50} containerClassName="text-center p-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col text-center">
                <div className="row">
                  <div className="col p-0 ps-2 m-0 d-flex me-auto justify-content-start text-center">
                    <div className="border border-2 border-light rounded-circle d-flex justify-content-center align-items-center" style={{ height: "50px", width: "50px" }}>
                      <img src={Hourglass} className="" alt="Hourglass" />
                    </div>
                    <div className="p-0 m-0 ps-3 pt-1 text-center">
                      {data.hour_spent !== undefined && data.hour_spent !== null ? (
                        <>
                          <h6 className="text-start">{data.hour_spent}</h6>
                          <p className="mb-0 fw-light" style={{ fontSize: "12px" }}>
                            Hours Spent
                          </p>
                        </>
                      ) : (
                        <Skeleton height={20} width={50} containerClassName="text-center p-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashBoardProfile;
