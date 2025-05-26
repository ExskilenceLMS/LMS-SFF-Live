import React, { useEffect } from 'react';
import axios from 'axios';
import CryptoJS from "crypto-js";
import { secretKey } from "../constants";

interface ErrorLogProps {
  url: string;
  body?: any;
  response?: any;
}

const ErrorLogMethod: React.FC<ErrorLogProps> = ({ url, body, response }) => {
  useEffect(() => {
    const encryptedStudentId = sessionStorage.getItem('StudentId');
    const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
    const studentId = decryptedStudentId;
    const encryptedEmail = sessionStorage.getItem('Email');
    const decryptedEmail = CryptoJS.AES.decrypt(encryptedEmail!, secretKey).toString(CryptoJS.enc.Utf8);
    const email = decryptedEmail;
    const encryptedName = sessionStorage.getItem('Name');
    const decryptedName = CryptoJS.AES.decrypt(encryptedName!, secretKey).toString(CryptoJS.enc.Utf8);
    const name = decryptedName;

    axios.post("https://live-exskilence-be.azurewebsites.net/api/error/", {
      student_id: studentId,
      email: email,
      name: name,
      url: url,
      body: body,
      response: response
    }, {
      headers: {
        "Content-Type": "application/json",
      }
    });
  }, [url, body, response]);

  return null;
};

export default ErrorLogMethod;
