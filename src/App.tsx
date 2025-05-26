import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Detector } from "react-detect-offline";
import axios from "axios";
import { Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import 'react-loading-skeleton/dist/skeleton.css';
import "./App.css";
import { secretKey } from './constants';
import CryptoJS from 'crypto-js';
import AppRoutes from "./AppRoutes";
import Layout from "./Components/Layout";
import InternetInfo from "./Components/InternetInfo";

function App() {
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const encryptedStudentId = sessionStorage.getItem('StudentId') || "";
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setShowLogoutWarning(false); 
    timerRef.current = setTimeout(() => {
      setShowLogoutWarning(true);
      setCountdown(60);
      startCountdown();
    }, 4 * 60 * 1000); 
  }, []);

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          handleLogout();
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  }, []);

  const handleLogout = useCallback(() => {
    axios.get(`https://live-exskilence-be.azurewebsites.net/api/logout/${studentId}/`);
    sessionStorage.clear();
    window.location.href = '/'; 
  }, [studentId]);

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'scroll', 'click'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [resetTimer]);

  return (
    <Detector
      polling={{
        url: '/varun',
        enabled: true,
        timeout: 2000,
        interval: 10000
      }}
      render={({ online }) =>
        online ? (
          <Router>
            <AppRoutes />
            <Modal show={showLogoutWarning} onHide={resetTimer}>
              <Modal.Header closeButton>
                <Modal.Title>Session Timeout Warning</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                You will be logged out in {countdown} seconds due to in-active.
              </Modal.Body>
            </Modal>
          </Router>
        ) : (
          <Router>
            <Routes>
              <Route path="/InternetInfo" element={<Layout><InternetInfo /></Layout>} />
              <Route path="*" element={<Layout><InternetInfo /></Layout>} />
            </Routes>
          </Router>
        )
      }
    />
  );
}

export default App;
