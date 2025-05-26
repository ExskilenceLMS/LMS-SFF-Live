import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from 'react-bootstrap/Modal';
import eye from './Components/images/eye.png';
import { secretKey } from "./constants";
import CryptoJS from "crypto-js";
import { Spinner } from "react-bootstrap";

interface Data1 {
  timeTaken: string;
  score: {
    user: string;
    total: string;
  };
  result: {
    pass: boolean;
    status: string;
    cutoff: string;
  };
  problems: {
    user: string;
    total: string;
  };
  rank: {
    college: string;
    overall: string;
  };
  time: {
    start: string;
    end: string;
  };
  good: string[];
  average: string[];
  bad: string[];
}

interface question {
  id: number;
  question: string;
  testcase?: string;
  answer?: {
    user: string;
    correct: string;
  };
  options?: [option, option, option, option];
  score: string;
  status: string;
  topic: string;
  explanation: string;
}

interface option {
  data: string;
  user: boolean;
  correct: boolean;
}

interface questionData {
  mcq: question[];
  coding: question[];
}

const TestReport: React.FC = () => {
  const navigate = useNavigate();
  const [choice, setChoice] = useState<"mcq" | "coding">("mcq");
  const [data, setData] = useState<Data1>({
    timeTaken: "",
    score: {
      user: "",
      total: "",
    },
    result: {
      pass: false,
      status: "",
      cutoff: "",
    },
    problems: {
      user: "",
      total: "",
    },
    rank: {
      college: "",
      overall: "",
    },
    time: {
      start: "",
      end: "",
    },
    good: [],
    average: [],
    bad: [],
  });

  const [showModal, setShowModal] = useState<boolean>(false);
  const [popupData, setPopupData] = useState<question | null>(null);
  const [questionsData, setQuestionsData] = useState<questionData>({
    mcq: [],
    coding: [],
  });

  const [expandedTopics, setExpandedTopics] = useState<{ [key: string]: boolean }>({});

  const encryptedStudentId = sessionStorage.getItem("StudentId") || "";
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;
  const encryptedTestId = sessionStorage.getItem("TestId") || "";
  const decryptedTestId = CryptoJS.AES.decrypt(encryptedTestId!, secretKey).toString(CryptoJS.enc.Utf8);
  const testId = decryptedTestId;
  const [loading, setLoading] = useState<boolean>(false);
  const handleClose = () => setShowModal(false);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/student/test/report/${studentId}/${testId}/`);
        const apiData = response.data;
        setData({
          timeTaken: `${apiData.test_summary.time_taken_for_completion} / ${apiData.test_summary.total_time}`,
          score: {
            user: apiData.test_summary.score_secured.toString(),
            total: apiData.test_summary.max_score.toString(),
          },
          result: {
            pass: apiData.test_summary.status === "Passed",
            status: apiData.test_summary.percentage >= 40 ? "Passed" : "Failed",
            cutoff: ">=40%",
          },
          problems: {
            user: apiData.test_summary.attempted_questions.toString(),
            total: apiData.test_summary.total_questions.toString(),
          },
          rank: {
            college: "",
            overall: "",
          },
          time: {
            start: apiData.test_summary.test_start_time.toString(),
            end: apiData.test_summary.test_end_time.toString(),
          },
          good: apiData.topics.good || [],
          average: apiData.topics.average || [],
          bad: apiData.topics.poor || [],
        });

        const mcqQuestions = apiData.answers.mcq.map((q: any, index: number) => ({
          id: index + 1,
          question: q.question,
          options: q.options.map((opt: any) => ({
            data: opt,
            user: q.user_answer === opt,
            correct: q.correct_answer === opt,
          })),
          score: `${q.score_secured}/${q.max_score}`,
          status: q.status.toLowerCase(),
          topic: q.topic,
          explanation: q.Explanation,
        }));

        const codingQuestions = apiData.answers.coding.map((q: any, index: number) => ({
          id: index + 1,
          question: q.Qn,
          answer: {
            user: q.user_answer,
            correct: q.Ans,
          },
          testcase: q.testcases,
          score: `${q.score_secured}/${q.max_score}`,
          status: q.status.toLowerCase(),
          topic: q.topic,
        }));

        setQuestionsData({
          mcq: mcqQuestions,
          coding: codingQuestions,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAnswerClick = (data: question) => {
    setPopupData(data);
    console.log("Popup Data:", data);
    setShowModal(true);
  };

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  return (
    <>
      <div className="" style={{ backgroundColor: "#F2EEEE", height: `calc(100vh - 90px)` }}>
        <div className="p-0 my-0 me-2" style={{ backgroundColor: "#F2EEEE" }}>
          <div className="container-fluid bg-white mt-2 border pb-4 rounded-1" style={{ height: `calc(100vh - 70px)`, overflowY: "scroll", backgroundColor: "white" }}>
            <div className="p-1 pt-4">
              <div className="container-fluid border rounded-2 shadow">
                <div className="row mb-4 pt-2">
                  <div className="col">
                    {data.timeTaken !== undefined ? data.timeTaken : "0"}
                    <p>time taken for completion</p>
                  </div>

                  <div className="col">
                    {data.score.user !== undefined ? data.score.user : "0"}
                    <p>scored out of {data.score.total !== undefined ? data.score.total : "0"}</p>
                  </div>

                  <div className="col">
                    {data.result.status !== undefined ? data.result.status : "Failed"}
                    <p>in the test (cutoff score {data.result.cutoff !== undefined ? data.result.cutoff : "0%"})</p>
                  </div>

                  <div className="col"></div>
                </div>
                <div className="row">
                  <div className="col">
                    {data.problems.user !== undefined ? data.problems.user : "0"}
                    <p>Problems attempted out of {data.problems.total !== undefined ? data.problems.total : "0"}</p>
                  </div>
                  <div className="col">
                    <div className="row">
                      <div className="col">
                        {data.rank.college !== undefined ? data.rank.college : "--"}
                        <p>College Rank</p>
                      </div>
                      <div className="col">
                        {data.rank.overall !== undefined ? data.rank.overall : "--"}
                        <p>Overall Rank</p>
                      </div>
                    </div>
                  </div>
                  <>
                    <div className="col">
                      {data.time.start !== undefined ? data.time.start : "0"}
                      <p>Test Start Time</p>
                    </div>
                    <div className="col">
                      {data.time.end !== undefined ? data.time.end : "0"}
                      <p>Test End Time</p>
                    </div>
                  </>
                </div>
              </div>
              {(data.good.length > 0 || data.average.length > 0 || data.bad.length > 0) ? (
                <div className="container-fluid mt-5 pb-3 border rounded-2 shadow">
                  {data.good.length > 0 && (
                    <div className="row row-cols-5 row-cols-lg-6 row-cols-md-4 row-cols-sm-3 row-cols-xl-8">
                      <span className="mt-2 p-2 ps-3">Very Good :</span>
                      {data.good.map((item) => (
                        <span
                          key={item}
                          style={{ width: "140px", backgroundColor: expandedTopics[item] ? '#6eadef' : 'initial', color: expandedTopics[item] ? 'white' : 'initial' }}
                          role="button"
                          title={item}
                          className="mt-2 d-flex justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2"
                          onClick={() => toggleTopic(item)}
                        >
                          {item.length > 10 ? item.substring(0, 10) + "..." : item}
                        </span>
                      ))}
                    </div>
                  )}
                  {data.average.length > 0 && (
                    <div className="row row-cols-5 mt-4 row-cols-lg-6 row-cols-md-4 row-cols-sm-3 row-cols-xl-8">
                      <span className="mt-2 p-2 ps-3">Average in :</span>
                      {data.average.map((item) => (
                        <span
                          key={item}
                          style={{ width: "140px", backgroundColor: expandedTopics[item] ? '#6eadef' : 'initial', color: expandedTopics[item] ? 'white' : 'initial' }}
                          title={item}
                          role="button"
                          className="mt-2 d-flex justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2"
                          onClick={() => toggleTopic(item)}
                        >
                          {item.length > 10 ? item.substring(0, 10) + "..." : item}
                        </span>
                      ))}
                    </div>
                  )}
                  {data.bad.length > 0 && (
                    <div className="row row-cols-5 mt-4 row-cols-lg-6 row-cols-md-4 row-cols-sm-3 row-cols-xl-8">
                      <span className="mt-2 p-2 ps-3">Poor in :</span>
                      {data.bad.map((item) => (
                        <span
                          key={item}
                          style={{ width: "140px", backgroundColor: expandedTopics[item] ? '#6eadef' : 'initial', color: expandedTopics[item] ? 'white' : 'initial' }}
                          title={item}
                          role="button"
                          className="mt-2 d-flex justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2"
                          onClick={() => toggleTopic(item)}
                        >
                          {item.length > 10 ? item.substring(0, 10) + "..." : item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <div className="container-fluid mt-5 pb-3 pt-3 border rounded-2 shadow">
                <span
                  onClick={() => setChoice("mcq")}
                  role="button"
                  className={`ms-3 me-5  ${
                    choice === "mcq" ? "border-2 border-bottom" : ""
                  }`}
                >
                  MCQ's
                </span>
                <span
                  role="button"
                  onClick={() => setChoice("coding")}
                  className={`ms-3 ${
                    choice === "coding" ? "border-2 border-bottom" : ""
                  }`}
                >
                  Coding
                </span>
                <div className="table-responsive pt-3 px-5">
                  <table className="table">
                    <thead className="">
                      <tr>
                        <th className="text-center">Q.no</th>
                        <th className="text-center">Question</th>
                        <th className="text-center">Answer</th>
                        {choice === "coding" && (
                          <th className="text-center">
                            <span style={{ whiteSpace: 'nowrap' }}>{"Test Cases"}</span>
                          </th>
                        )}
                        <th className="text-center">Score</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ textAlign: "center" }}>
                      {Object.keys(expandedTopics).filter(topic => expandedTopics[topic]).length > 0 ? (
                        questionsData[choice]
                          .filter(question =>
                            Object.keys(expandedTopics).filter(topic => expandedTopics[topic]).every(topic => question.topic === topic)
                          )
                          .map((question) => (
                            <tr key={question.id}>
                              <td>{question.id}</td>
                              <td style={{ textAlign: "start"}}> {question.question.length > 80
                                ? question.question.substring(0, 80) + "..."
                                : question.question}</td>
                              <td
                                className="text-center"
                                onClick={() => handleAnswerClick(question)}
                              >
                                <img src={eye} alt="eye" role="button" />
                              </td>
                              {choice === "coding" && <td className="text-center">{question.testcase}</td>}
                              <td className="text-center">{question.score}</td>
                              {question.status === "correct" ? (
                                <td className="text-success">Correct</td>
                              ) : (
                                question.status === "partial" ? (
                                  <td className="text-warning">Partial</td>
                                ) : (
                                  question.status === "wrong" ? (
                                    <td className="text-danger">Wrong</td>
                                  ) : (
                                    question.status === "skipped" ? (
                                      <td className="text-danger">Skipped</td>
                                    ) : (
                                      <td style={{ color: 'orange' }}>{question.status.toLowerCase() == "not attempted" ? "Not Attempted" : question.status}</td>
                                    )
                                  )
                                )
                              )}
                            </tr>
                          ))
                      ) : (
                        questionsData[choice].map((question) => (
                          <tr key={question.id}>
                            <td>{question.id}</td>
                            <td style={{ textAlign: "start"}}> {question.question.length > 80
                              ? question.question.substring(0, 80) + "..."
                              : question.question}</td>
                            <td
                              className="text-center"
                              onClick={() => handleAnswerClick(question)}
                            >
                              <img src={eye} alt="eye" role="button" />
                            </td>
                            {choice === "coding" && <td>{question.testcase}</td>}
                            <td>{question.score}</td>
                            {question.status === "correct" ? (
                              <td className="text-success">Correct</td>
                            ) : (
                              question.status === "partial" ? (
                                <td className="text-warning">Partial</td>
                              ) : (
                                question.status === "wrong" ? (
                                  <td className="text-danger">Wrong</td>
                                ) : (
                                  question.status === "skipped" ? (
                                    <td className="text-danger">Skipped</td>
                                  ) : (
                                    <td style={{ color: 'orange' }}>{question.status.toLowerCase() == "not attempted" ? "Not Attempted" : question.status}</td>
                                  )
                                )
                              )
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <Modal
                show={showModal}
                onHide={handleClose}
                size="xl"
                className="custom-modal"
                centered
              >
                <Modal.Body className="border border-black rounded-3">
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleClose}
                    style={{ position: "absolute", top: "10px", right: "10px" }}
                  ></button>
                  <h4 className="text-center">Answer</h4>
                  {popupData ? (
                    <div className="p-4">
                      {popupData.question && (
                        <p className="pb-3">
                          {popupData.id}. {popupData.question}
                        </p>
                      )}
                      {popupData.answer && (
                        <>
                          <div className="container-fluid">
                            <div className="row">
                              <div className="col border border-black rounded-3 p-3 px-5 me-4">
                                <p className="fw-bold pb-0 mb-0">Your answer</p>
                                <hr className="mt-0 pt-0" />
                                <div>
                                  {popupData.answer.user}
                                </div>
                              </div>
                              <div className="col border border-black rounded-2 p-3 px-5">
                                <p className="fw-bold pb-0 mb-0">Optimal answer</p>
                                <hr className="mt-0 pt-0" />
                                <div>
                                  {popupData.answer.correct}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {popupData.options &&
                        popupData.options.map((optionItem, index) => {
                          const isUserAnswer = optionItem.user;
                          const isCorrectAnswer = optionItem.correct;
                          const optionstyles =
                            isUserAnswer && isCorrectAnswer
                              ? { color: "green" }
                              : isUserAnswer
                                ? { color: "red" }
                                : isCorrectAnswer
                                  ? { color: "green" }
                                  : {};
                          return (
                            <div key={index}>
                              <input
                                type="radio"
                                disabled
                                checked={isUserAnswer}
                                className="me-2"
                              />
                              <label
                                htmlFor={`option-${index}`}
                                style={optionstyles}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    {optionItem.data}
                                  </div>
                                  <div className="d-flex justify-content-end">
                                    {isUserAnswer && (
                                      <span className="text-dark text-end ps-3">
                                        Your answer
                                      </span>
                                    )}
                                    {isCorrectAnswer && !isUserAnswer && (
                                      <span className="text-dark text-end ps-3">
                                        Correct answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      {popupData.status === "wrong" && popupData.explanation && (
                        <div className="mt-3">
                          <p className="fw-bold">Explanation:</p>
                          <p>{popupData.explanation}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    ""
                  )}
                </Modal.Body>
              </Modal>
              {loading && (
                <div className="loading-overlay">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestReport;
