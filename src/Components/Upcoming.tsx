import React, { useState, useEffect } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { secretKey } from "../constants";
import CryptoJS from "crypto-js";

interface Events {
  title: string;
  date: string;
  time: string;
}

interface Discussion {
  title: string; 
  week: string;
  date: string;
  time: string;
}

const Upcoming: React.FC = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [events, setEvents] = useState<Events[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const encryptedStudentId = sessionStorage.getItem('StudentId');
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;
  const encryptedCourseId = sessionStorage.getItem('CourseId');
  const decryptedCourseId = CryptoJS.AES.decrypt(encryptedCourseId!, secretKey).toString(CryptoJS.enc.Utf8);
  const courseId = decryptedCourseId;
  const encryptedBatchId = sessionStorage.getItem('BatchId');
  const decryptedBatchId = CryptoJS.AES.decrypt(encryptedBatchId!, secretKey).toString(CryptoJS.enc.Utf8);
  const batchId = decryptedBatchId;
  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/studentdashboard/upcomming/sessions/${studentId}/`);
        setDiscussions(response.data.map((item: any) => ({
          title: item.title,
          week: item.title,
          date: item.date,
          time: item.time,
        })));
      } catch (error) {
        console.error("Error fetching discussions:", error);
      } finally {
        setLoadingDiscussions(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/studentdashboard/upcomming/events/${courseId}/${batchId}/`);
        setEvents(response.data.map((event: any) => ({
          title: event.title,
          date: event.date,
          time: event.time,
        })));
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchDiscussions();
    fetchEvents();
  }, [batchId, courseId, studentId]);

  return (
    <div className="" style={{marginTop: "1px"}}>
      <div
        className="row bg-white rounded-2 mx-2 mb-2"
        style={{ minWidth: "35px", paddingBottom: "12px" }}
      >
        <p className="fw-light ps-4 pt-2" style={{ fontSize: "12px" }}>
          Upcoming live sessions
        </p>
        <div
            className="ps-4 bg-white pe-auto flex-end"
            style={{
              minWidth: "30px",
              height: "75px",
              overflowY: "auto",
              scrollbarWidth: "thin",
              fontSize: "13px",
            }}
          >
            {loadingDiscussions ? (
              <>
                <Skeleton height={10} width={100} />
                <Skeleton height={10} width={100} />
              </>
            ) : discussions.length > 0 ? (
              discussions.map((discussion, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{discussion.title}</span>
                  <span>{`${discussion.date} - ${discussion.time}`}</span>
                </div>
              ))
            ) : (
              <p className="text-center pt-3">No upcoming live sessions</p>
            )}
          </div>
      </div>

      <div
        className="row bg-white rounded-2 mx-2"
        style={{ minWidth: "35px", paddingBottom: "10px" }}
      >
        <p className="fw-light ps-4 pt-2" style={{ fontSize: "12px" }}>
          Upcoming events
        </p>
        <div
          className="ps-4 pe-auto flex-end m-0 divDetails"
          style={{
            minWidth: "30px",
            height: "75px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            fontSize: "13px",
          }}
        >
          {loadingEvents ? (
            <>
              <Skeleton height={10} width={100} />
              <Skeleton height={10} width={100} />
            </>
          ) : (
            events.map((event, index) => (
              <div
                key={index}
                className="d-flex justify-content-between align-items-center  divDetails"
              >
                <span>{event.title}</span>
                <span>{`${event.date} - ${event.time}`}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Upcoming;
