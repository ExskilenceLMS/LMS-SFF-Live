// import React, { useEffect, useState, useRef } from "react";
// import { Card, ProgressBar } from "react-bootstrap";
// import { FaClock } from "react-icons/fa";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faCircleRight } from "@fortawesome/free-solid-svg-icons";
// import { useNavigate } from "react-router-dom";
// import Skeleton from "react-loading-skeleton";
// import axios from "axios";
// import { ChevronLeft, ChevronRight } from "@mui/icons-material";
// import CryptoJS from "crypto-js";
// import { secretKey } from "../constants";
// import './Courses.css';
// import ErrorLogMethod from "./ErrorLogMethod";

// interface Course {
//   title: string;
//   subject: string;
//   subject_id: string;
//   color: string;
//   image: string;
//   duration: string;
//   progress: {
//     student_progress: number;
//     progress: number;
//   };
//   student_progress: number; 
//   status : string;
// }

// const Courses: React.FC = () => {
//   const navigate = useNavigate();
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [scrollPosition, setScrollPosition] = useState({
//     canScrollLeft: false,
//     canScrollRight: false,
//   });
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);
//   const encryptedStudentId = sessionStorage.getItem('StudentId');
//   const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
//   const studentId = decryptedStudentId;

//   const handleCourseClick = (subject_id: string, subject: string, courseTitle: string) => {
//     const encryptedSubjectId = CryptoJS.AES.encrypt(subject_id, secretKey).toString();
//     const encryptedSubject = CryptoJS.AES.encrypt(subject, secretKey).toString();
//     sessionStorage.setItem('SubjectId', encryptedSubjectId);
//     sessionStorage.setItem("Subject", encryptedSubject);
//     navigate("/SubjectOverview", { state: { title: courseTitle } });
//   };

//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         const url = `https://live-exskilence-be.azurewebsites.net/api/studentdashboard/mycourses/${studentId}/`;
//         const response = await axios.get(url);
  
//         const colorMapping: { [key: string]: string } = {
//           "HTML CSS": "#B6BAFE",
//           "JavaScript": "#F0DC54",
//           "Python": "#B5FEB5", 
//           "Python8": "#B5FEB5", 
//           "Data Structures with C++ and Object-Oriented Programming with C++": "#B6FEB5", 
//           "Data Structures and Algorithms": "#B6BAFE",
//           "SQL": "#FFB5B5",
//           "SQL8": "#FFB5B5", 
//         };
  
//         const courseData = response.data.map((course: any) => ({
//           ...course,
//           color: colorMapping[course.title] || "#D3D3D3",
//         }));
  
//         setCourses(courseData);
        
//         setTimeout(checkScrollStatus, 100);
//       } catch (error) {
//         console.error("Error fetching courses:", error);
//       }
//     };
  
//     fetchCourses();
//   }, [studentId]);
  
//   const checkScrollStatus = () => {
//     if (scrollContainerRef.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
//       const hasRightScroll = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2;
      
//       setScrollPosition({
//         canScrollLeft: scrollLeft > 0,
//         canScrollRight: hasRightScroll
//       });
//     }
//   };

//   useEffect(() => {
//     checkScrollStatus();
    
//     const container = scrollContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", checkScrollStatus);
      
//       setTimeout(checkScrollStatus, 100);
      
//       window.addEventListener('resize', checkScrollStatus);
//     }

//     return () => {
//       if (container) {
//         container.removeEventListener("scroll", checkScrollStatus);
//       }
//       window.removeEventListener('resize', checkScrollStatus);
//     };
//   }, [courses.length]); 

//   const scrollLeft = () => {
//     if (scrollContainerRef.current && scrollPosition.canScrollLeft) {
//       const container = scrollContainerRef.current;
//       container.scrollBy({
//         left: -container.clientWidth / 2,
//         behavior: "smooth",
//       });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollContainerRef.current && scrollPosition.canScrollRight) {
//       const container = scrollContainerRef.current;
//       container.scrollBy({
//         left: container.clientWidth / 2,
//         behavior: "smooth",
//       });
//     }
//   };

//   return (
//     <div className="row rounded-2">
//       <div className="d-flex justify-content-end py-1" style={{ fontSize: "14px" }}>
//         <div className=" text-dark">
//           <ChevronLeft
//             onClick={scrollLeft}
//             className={`arrow left ${
//               !scrollPosition.canScrollLeft ? "disabled" : ""
//             }`}
//             style={{
//               cursor: scrollPosition.canScrollLeft ? "pointer" : "pointer",
//               color: !scrollPosition.canScrollLeft ? "#7F7F7F" : "inherit",
//             }}
//           />
//           <ChevronRight  
//             onClick={scrollRight}
//             className={`arrow right ${
//               !scrollPosition.canScrollRight ? "disabled " : ""
//             }`}
//             style={{
//               cursor: scrollPosition.canScrollRight ? "pointer" : "pointer",
//               color: !scrollPosition.canScrollRight ? "#7F7F7F" : "inherit",
//             }}
//           />
//         </div>
//       </div>
//       <div
//         className="course-container d-flex text-dark pb-3 pt-1 flex-nowrap"
//         ref={scrollContainerRef}
//         style={{
//           overflowX: "auto",
//           overflowY: "hidden",
//           scrollbarWidth: "none",
//           width: "100%",
//         }}
//         onLoad={checkScrollStatus}
//       >
//         {!courses.length ? (
//           <div className="d-flex flex-nowrap justify-content-around">
//             {[...Array(8)].map((_, i) => (
//               <Skeleton
//                 key={i}
//                 height={160}
//                 width={250}
//                 style={{ maxWidth: "300px" }}
//                 containerClassName="me-3"
//               />
//             ))}
//           </div>
//         ) : (
//           courses.map((course, index) => (
//             <Card
//               key={index}
//               className={`${course.status === "Open" ? "open-course" : "closed-course"} mb-2`}   
//               style={{
//                 width: "350px",
//                 height: "150px",
//                 minWidth: "350px",
//                 marginRight: index !== courses.length - 1 ? "1rem" : "0",
//                 boxShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)",
//               }}
//             >
//               <Card.Body className="p-1 rounded-2" >
//                 <div className="d-flex p-0">
//                   <div className="d-flex flex-column align-items-center me-3">
//                     <div
//                       className="preview-image ms-2 mt-1 mb-2 border rounded-2"
//                       style={{
//                         width: "90px",
//                         height: "130px",
//                         overflow: "hidden",
//                       }}
//                     >
//                       <img
//                         src={course.image}
//                         alt={`${course.title} Preview`}
//                         className="img"
//                         style={{
//                           objectFit: "cover",
//                           width: "100%",
//                           height: "100%",
//                         }}
//                       />
//                     </div>
//                   </div>
//                   <div className="d-flex flex-column ">
//                     <h6
//                       className="p-1 mt-2 me-3"
//                       style={{
//                         backgroundColor: course.color,
//                         color: "black",
//                         borderRadius: "4px",
//                         width: "200px",
//                         boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
//                         display: "flex",
//                         justifyContent: "space-between",
//                         cursor: "pointer"
//                       }}
//                       title={course.title.length > 20 ? course.title : ""}
//                       onClick={() => {
//                         if (course.status === 'Open') {
//                           handleCourseClick(course.subject_id, course.subject, course.title);
//                         }
//                       }}
                      
//                     >
//                       {course.title.length > 20
//                         ? `${course.title.slice(0, 20)}...`
//                         : course.title}
//                       <FontAwesomeIcon
//                         icon={faCircleRight}
//                         style={{
//                           color: "#009dff",
//                           fontSize: "18px"
//                         }}
//                       />
//                     </h6>
//                     <span style={{ fontSize: "14px", color: "black" }}>
//                       <span>
//                         <FaClock className="mb-1" />
//                         <span className="text-secondary ps-2">Duration</span>
//                       </span>
//                       <br />
//                       <span>{course.duration}</span>
//                       <ProgressBar
//                         className="me-3 border-dark border rounded-1"
//                         style={{
//                           flexGrow: 1,
//                           marginTop: "30px",
//                           height: "10px",
//                           borderRadius: "4px",
//                           borderColor: "#74C0FC",
//                           backgroundColor: "white",
//                         }}
//                       >
//                         <ProgressBar
//                           style={{color: "#37D447", background: "#37D447"}}
//                           now={course.progress.student_progress}
//                           key={1}
//                         />
//                         <ProgressBar
//                           now={course.progress.progress - course.progress.student_progress}
//                           key={2}
//                           style={{backgroundColor: "white"}}
//                         />
//                       </ProgressBar>
//                       {course.progress.student_progress === 0 && (
//                         <span className="d-flex justify-content-center align-items-center text-center pt-1" style={{fontSize:"8px"}}>
//                           Not Started
//                         </span>
//                       )}
//                     </span>
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Courses;



import React, { useEffect, useState, useRef } from "react";
import { Card, ProgressBar } from "react-bootstrap";
import { FaClock } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import axios, { AxiosError } from "axios";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import CryptoJS from "crypto-js";
import { secretKey } from "../constants";
import './Courses.css';
import ErrorLogMethod from "./ErrorLogMethod";

interface Course {
  title: string;
  subject: string;
  subject_id: string;
  color: string;
  image: string;
  duration: string;
  progress: {
    student_progress: number;
    progress: number;
  };
  student_progress: number;
  status: string;
}

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [scrollPosition, setScrollPosition] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const encryptedStudentId = sessionStorage.getItem('StudentId');
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;

  const handleCourseClick = (subject_id: string, subject: string, courseTitle: string) => {
    const encryptedSubjectId = CryptoJS.AES.encrypt(subject_id, secretKey).toString();
    const encryptedSubject = CryptoJS.AES.encrypt(subject, secretKey).toString();
    sessionStorage.setItem('SubjectId', encryptedSubjectId);
    sessionStorage.setItem("Subject", encryptedSubject);
    navigate("/SubjectOverview", { state: { title: courseTitle } });
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const url = `https://live-exskilence-be.azurewebsites.net/api/studentdashboard/mycourses/${studentId}/`;
        const response = await axios.get(url);

        const colorMapping: { [key: string]: string } = {
          "HTML CSS": "#B6BAFE",
          "JavaScript": "#F0DC54",
          "Python": "#B5FEB5",
          "Python8": "#B5FEB5",
          "Data Structures with C++ and Object-Oriented Programming with C++": "#B6FEB5",
          "Data Structures and Algorithms": "#B6BAFE",
          "SQL": "#FFB5B5",
          "SQL8": "#FFB5B5",
        };

        const courseData = response.data.map((course: any) => ({
          ...course,
          color: colorMapping[course.title] || "#D3D3D3",
        }));

        setCourses(courseData);

        setTimeout(checkScrollStatus, 100);
      } catch (error) {
        console.error("Error fetching courses:", error);
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          <ErrorLogMethod url={`https://live-exskilence-be.azurewebsites.net/api/studentdashboard/mycourses/${studentId}/`} body={axiosError.request?.data} response={axiosError.response?.data} />;
        } else {
          console.error("Unexpected error:", error);
        }
      }
    };

    fetchCourses();
  }, [studentId]);

  const checkScrollStatus = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

      const hasRightScroll = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2;

      setScrollPosition({
        canScrollLeft: scrollLeft > 0,
        canScrollRight: hasRightScroll
      });
    }
  };

  useEffect(() => {
    checkScrollStatus();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollStatus);

      setTimeout(checkScrollStatus, 100);

      window.addEventListener('resize', checkScrollStatus);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollStatus);
      }
      window.removeEventListener('resize', checkScrollStatus);
    };
  }, [courses.length]);

  const scrollLeft = () => {
    if (scrollContainerRef.current && scrollPosition.canScrollLeft) {
      const container = scrollContainerRef.current;
      container.scrollBy({
        left: -container.clientWidth / 2,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current && scrollPosition.canScrollRight) {
      const container = scrollContainerRef.current;
      container.scrollBy({
        left: container.clientWidth / 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="row rounded-2">
      <div className="d-flex justify-content-end py-1" style={{ fontSize: "14px" }}>
        <div className=" text-dark">
          <ChevronLeft
            onClick={scrollLeft}
            className={`arrow left ${
              !scrollPosition.canScrollLeft ? "disabled" : ""
            }`}
            style={{
              cursor: scrollPosition.canScrollLeft ? "pointer" : "pointer",
              color: !scrollPosition.canScrollLeft ? "#7F7F7F" : "inherit",
            }}
          />
          <ChevronRight
            onClick={scrollRight}
            className={`arrow right ${
              !scrollPosition.canScrollRight ? "disabled " : ""
            }`}
            style={{
              cursor: scrollPosition.canScrollRight ? "pointer" : "pointer",
              color: !scrollPosition.canScrollRight ? "#7F7F7F" : "inherit",
            }}
          />
        </div>
      </div>
      <div
        className="course-container d-flex text-dark pb-3 pt-1 flex-nowrap"
        ref={scrollContainerRef}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          width: "100%",
        }}
        onLoad={checkScrollStatus}
      >
        {!courses.length ? (
          <div className="d-flex flex-nowrap justify-content-around">
            {[...Array(8)].map((_, i) => (
              <Skeleton
                key={i}
                height={160}
                width={250}
                style={{ maxWidth: "300px" }}
                containerClassName="me-3"
              />
            ))}
          </div>
        ) : (
          courses.map((course, index) => (
            <Card
              key={index}
              className={`${course.status === "Open" ? "open-course" : "closed-course"} mb-2`}
              style={{
                width: "350px",
                height: "150px",
                minWidth: "350px",
                marginRight: index !== courses.length - 1 ? "1rem" : "0",
                boxShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Card.Body className="p-1 rounded-2" >
                <div className="d-flex p-0">
                  <div className="d-flex flex-column align-items-center me-3">
                    <div
                      className="preview-image ms-2 mt-1 mb-2 border rounded-2"
                      style={{
                        width: "90px",
                        height: "130px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={course.image}
                        alt={`${course.title} Preview`}
                        className="img"
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-column ">
                    <h6
                      className="p-1 mt-2 me-3"
                      style={{
                        backgroundColor: course.color,
                        color: "black",
                        borderRadius: "4px",
                        width: "200px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer"
                      }}
                      title={course.title.length > 20 ? course.title : ""}
                      onClick={() => {
                        if (course.status === 'Open') {
                          handleCourseClick(course.subject_id, course.subject, course.title);
                        }
                      }}

                    >
                      {course.title.length > 20
                        ? `${course.title.slice(0, 20)}...`
                        : course.title}
                      <FontAwesomeIcon
                        icon={faCircleRight}
                        style={{
                          color: "#009dff",
                          fontSize: "18px"
                        }}
                      />
                    </h6>
                    <span style={{ fontSize: "14px", color: "black" }}>
                      <span>
                        <FaClock className="mb-1" />
                        <span className="text-secondary ps-2">Duration</span>
                      </span>
                      <br />
                      <span>{course.duration}</span>
                      <ProgressBar
                        className="me-3 border-dark border rounded-1"
                        style={{
                          flexGrow: 1,
                          marginTop: "30px",
                          height: "10px",
                          borderRadius: "4px",
                          borderColor: "#74C0FC",
                          backgroundColor: "white",
                        }}
                      >
                        <ProgressBar
                          style={{color: "#37D447", background: "#37D447"}}
                          now={course.progress.student_progress}
                          key={1}
                        />
                        <ProgressBar
                          now={course.progress.progress - course.progress.student_progress}
                          key={2}
                          style={{backgroundColor: "white"}}
                        />
                      </ProgressBar>
                      {course.progress.student_progress === 0 && (
                        <span className="d-flex justify-content-center align-items-center text-center pt-1" style={{fontSize:"8px"}}>
                          Not Started
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;
