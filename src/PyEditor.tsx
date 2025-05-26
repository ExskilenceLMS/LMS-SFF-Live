import React, { useState, useEffect, useRef } from "react";
import AceEditor from "react-ace";
import axios from "axios";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-dreamweaver";
import Sk from "skulpt";
import { useLocation, useNavigate } from "react-router-dom";
import SkeletonCode from './Components/EditorSkeletonCode'
import { secretKey } from "./constants";
import CryptoJS from "crypto-js";

interface Example {
  [index: number]: { Example: { Inputs: string[], Output: string, Explanation?: string } };
}

interface TestCase {
  Testcase: {
    Value: string[];
    Output: string;
  };
}

interface Question {
  FunctionCall: string;
  Template: string;
  Examples: [
    {
      Example: {
        Inputs: string[];
        Output: string;
        Explanation: string;
      };
    }
  ],
  Qn: string;
  TestCases: TestCase[];
  Qn_name: string;
  status: boolean;
  entered_ans: string;
  Ans: string;
}

const PyEditor: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([
    {
      Qn: '',
      TestCases: [],
      Qn_name: '',
      status: false,
      entered_ans: '',
      Ans: '',
      Template: '',
      FunctionCall: '',
      Examples: [
        {
          Example: {
            Inputs: [],
            Output: '',
            Explanation: '',
          }
        }
      ],
    }
  ]);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [output, setOutput] = useState<string>("");
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false);
  const [currentInput, setCurrentInput] = useState<string>("");
  const inputResolver = useRef<((value: string) => void) | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const [runResponseTestCases, setRunResponseTestCases] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [additionalMessage, setAdditionalMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [functionCall, setFunctionCall] = useState<string>("");
  const [template, setTemplate] = useState<string>();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [status, setStatus] = useState<boolean>(false);
  const [enteredAns, setEnteredAns] = useState<string>("");
  const [isNextBtn, setIsNextBtn] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [Ans, setAns] = useState<string>("");
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const queryQuestionIndex = urlParams.get('questionIndex');
  const encryptedStudentId = sessionStorage.getItem('StudentId');
  const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
  const studentId = decryptedStudentId;
  const encryptedSubjectId = sessionStorage.getItem('SubjectId');
  const decryptedSubjectId = CryptoJS.AES.decrypt(encryptedSubjectId!, secretKey).toString(CryptoJS.enc.Utf8);
  const subjectId = decryptedSubjectId;
  const encryptedSubject = sessionStorage.getItem('Subject');
  const decryptedSubject = CryptoJS.AES.decrypt(encryptedSubject!, secretKey).toString(CryptoJS.enc.Utf8);
  const subject = decryptedSubject;
  const encryptedWeekNumber = sessionStorage.getItem('WeekNumber');
  const decryptedWeekNumber = CryptoJS.AES.decrypt(encryptedWeekNumber!, secretKey).toString(CryptoJS.enc.Utf8);
  const weekNumber = decryptedWeekNumber;
  const encryptedDayNumber = sessionStorage.getItem('DayNumber');
  const decryptedDayNumber = CryptoJS.AES.decrypt(encryptedDayNumber!, secretKey).toString(CryptoJS.enc.Utf8);
  const dayNumber = decryptedDayNumber;

  useEffect(() => {
    const script = document.createElement('script');
    // script.src = "https://cdn.jsdelivr.net/npm/skulpt@1.1.0/dist/skulpt.min.js";
    script.src = "https://cdn.jsdelivr.net/npm/skulpt@latest/dist/skulpt.min.js";
    script.async = true;
    script.onload = () => {
      const builtinScript = document.createElement('script');
      builtinScript.src = "https://cdn.jsdelivr.net/npm/skulpt@1.1.0/dist/skulpt-stdlib.js";
      builtinScript.async = true;
      document.body.appendChild(builtinScript);
    };
    document.body.appendChild(script);
  }, []);

  const getUserCodeKey = (qnName: string) => {
    return `userCode_${subject}_${weekNumber}_${dayNumber}_${qnName}`;
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(
          `https://live-exskilence-be.azurewebsites.net/api/student/practicecoding/` +
          `${studentId}/` +
          `${subject}/` +
          `${subjectId}/` +
          `${dayNumber}/` +
          `${weekNumber}/` +
          `${sessionStorage.getItem("currentSubTopicId")}/`
        );
        
        const questionsWithSavedCode = response.data.map((q: Question) => {
          const savedCodeKey = getUserCodeKey(q.Qn_name);
          const savedCode = sessionStorage.getItem(savedCodeKey);
          
          if (savedCode !== null) {
            return { ...q, entered_ans: savedCode };
          }
          return q;
        });
        
        setQuestions(questionsWithSavedCode);

        const initialIndex = parseInt(sessionStorage.getItem("currentQuestionIndex")!) ? parseInt(sessionStorage.getItem("currentQuestionIndex")!) : 0;
        
        setCurrentQuestionIndex(initialIndex);
        setStatus(questionsWithSavedCode[initialIndex].status);
        setEnteredAns(questionsWithSavedCode[initialIndex].entered_ans);
        setFunctionCall(questionsWithSavedCode[initialIndex].FunctionCall || '');
        setAns(questionsWithSavedCode[initialIndex].entered_ans || 
              questionsWithSavedCode[initialIndex]?.Ans + '\n' + questionsWithSavedCode[initialIndex]?.FunctionCall || ''); 
        setLoading(false);

      } catch (error) {
        console.error("Error fetching the questions:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);
  
  const handleCodeChange = (newCode: string) => {
    setAns(newCode);
    
    if (questions[currentQuestionIndex]?.Qn_name) {
      const codeKey = getUserCodeKey(questions[currentQuestionIndex].Qn_name);
      sessionStorage.setItem(codeKey, newCode);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLPreElement>) => {
    if (!isWaitingForInput) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputResolver.current) {
        const inputValue = currentInput;
        setOutput(prev => prev + '\n');
        inputResolver.current(inputValue);
        inputResolver.current = null;
        setIsWaitingForInput(false);
        setCurrentInput("");
      }
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1));
        setOutput(prev => prev.slice(0, -1));
      }
    } else if (event.key.length === 1) {
      event.preventDefault();
      setCurrentInput(prev => prev + event.key);
      setOutput(prev => prev + event.key);
    }
  };

  const promptInput = (prompt: string) => {
    return new Promise<string>((resolve) => {
      setOutput(prev => prev + prompt);
      setIsWaitingForInput(true);
      inputResolver.current = resolve;
      if (outputRef.current) {
        outputRef.current.focus();
      }
    });
  };

  const handleRunPython = () => {
    setOutput('');
    setIsWaitingForInput(false);
    setCurrentInput('');
    inputResolver.current = null;

    function builtinRead(x: string) {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
        throw new Error("File not found: '" + x + "'");
      }
      return Sk.builtinFiles["files"][x];
    }

    Sk.configure({
      output: (text: string) => setOutput(prev => prev + text),
      read: builtinRead,
      inputfun: promptInput,
    });

    const myPromise = Sk.misceval.asyncToPromise(() => {
      return Sk.importMainWithBody('<stdin>', false, Ans, true);
    });

    myPromise.then(
      () => {
      },
      (err: any) => {
        setOutput(prev => prev + err.toString());
      }
    );
  };

  const handleQuestionChange = (index: number) => {
    if (questions[currentQuestionIndex]?.Qn_name && Ans) {
      const currentCodeKey = getUserCodeKey(questions[currentQuestionIndex].Qn_name);
      sessionStorage.setItem(currentCodeKey, Ans);
    }
    
    setOutput('');
    setCurrentQuestionIndex(index);
    setStatus(questions[index].status);
    
    const nextQuestionKey = getUserCodeKey(questions[index].Qn_name);
    const savedCode = sessionStorage.getItem(nextQuestionKey);
    
    if (savedCode !== null) {
      setEnteredAns(savedCode);
      setAns(savedCode);
    } else {
      setEnteredAns(questions[index].entered_ans);
      setAns(questions[index].entered_ans || 
            questions[index]?.Ans + '\n' + questions[index]?.FunctionCall || '');
    }
    
    const question = questions[index];
    setTestCases(question.TestCases || []);
    
    setRunResponseTestCases([]); 
    setSuccessMessage(""); 
    setAdditionalMessage(""); 
    setIsSubmitted(false);
  };

  const handleNext = () => {
    if (questions[currentQuestionIndex]?.Qn_name && Ans) {
      const currentCodeKey = getUserCodeKey(questions[currentQuestionIndex].Qn_name);
      sessionStorage.setItem(currentCodeKey, Ans);
    }
    
    setIsNextBtn(false);
    if (currentQuestionIndex == questions.length - 1) {
      navigate('/subject-roadmap');
    }
    else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const nextQuestionKey = getUserCodeKey(questions[nextIndex].Qn_name);
      const savedCode = sessionStorage.getItem(nextQuestionKey);
      
      setStatus(questions[nextIndex].status);
      
      if (savedCode !== null) {
        setEnteredAns(savedCode);
        setAns(savedCode);
      } else {
        setEnteredAns(questions[nextIndex].entered_ans);
        setAns(questions[nextIndex].entered_ans || 
              questions[nextIndex]?.Ans + '\n' + questions[nextIndex]?.FunctionCall || '');
      }
      
      setTestCases(questions[nextIndex].TestCases || []);
      
      setRunResponseTestCases([]); 
      setSuccessMessage(""); 
      setAdditionalMessage(""); 
      setIsSubmitted(false);
    }
  };

  const handleCheckCode = async () => {
    if (questions[currentQuestionIndex]?.Qn_name) {
      const codeKey = getUserCodeKey(questions[currentQuestionIndex].Qn_name);
      sessionStorage.setItem(codeKey, Ans);
    }

    handleRunPython();
    setOutput('');
    setIsWaitingForInput(false);
    setCurrentInput('');
    inputResolver.current = null;
    setProcessing(true);
    setSuccessMessage("");
    setAdditionalMessage("");

    function builtinRead(x: string) {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
        throw new Error("File not found: '" + x + "'");
      }
      return Sk.builtinFiles["files"][x];
    }

    Sk.configure({
      output: (text: string) => setOutput(prev => prev + text),
      read: builtinRead,
      inputfun: promptInput,
    });

    const myPromise = Sk.misceval.asyncToPromise(() => {
      return Sk.importMainWithBody('<stdin>', false, Ans, true);
    });

    myPromise.then(
      () => {
      },
      (err: any) => {
        setOutput(prev => prev + err.toString());
      }
    );

    try {
      const postData = {
        student_id: studentId,
        week_number: weekNumber,
        day_number: dayNumber,
        subject: subject,
        subject_id: subjectId,
        Qn: questions[currentQuestionIndex].Qn_name,
        Code: Ans,
        Result: output.trimEnd(),
        CallFunction: "",
        TestCases: questions[currentQuestionIndex].TestCases,
        Attempt: 0
      };

      const response = await axios.post(
        "https://live-exskilence-be.azurewebsites.net/api/student/coding/py/",
        postData
      );

      const responseData = response.data as { TestCases: any[] };
      const testCases = responseData.TestCases;
      const firstTestCase = testCases[0];

      const filteredTestCases = testCases.slice(1).map(({ Result, ...rest }: { Result: any, [key: string]: any }) => rest);
      const updatedTestCases = await Promise.all(
        filteredTestCases.map(async (testCase: { [key: string]: any }) => {
          try {
            const testCaseKey = Object.keys(testCase)[0];
            const { Code, Output } = testCase[testCaseKey];

            if (!Code) {
              console.error("Test case has an undefined 'Code' property.");
              return { ...testCase, Result: "Error: Code is undefined" };
            }

            let testCaseOutput = "";
            Sk.configure({
              output: (text: string) => {
                testCaseOutput += text.replace("<module '__main__' from '<stdin>.py'>", "");
              },
              read: builtinRead,
            });

            const executePython = async () => {
              try {
                await Sk.misceval.asyncToPromise(() =>
                  Sk.importMainWithBody("<stdin>", false, Code, true)
                );
                return testCaseOutput.trim();
              } catch (err: unknown) {
                console.error("Error executing Python code for TestCaseId:", testCase.TestCaseId, err);
                return (err as Error).toString();
              }
            };

            const actualOutput = await executePython();
            testCase.Result = actualOutput === Output ? "Passed" : "Failed";
            return testCase;
          } catch (error) {
            console.error("Unexpected error while processing test case:", testCase, error);
            return { ...testCase, Result: "Error: Unexpected error occurred" };
          }
        })
      );

      const formattedTestCases = updatedTestCases.map((testCase, index) => {
        return { [`TestCase${index + 2}`]: testCase.Result };
      });

      const newTestCases = [firstTestCase, ...formattedTestCases];
      const otherTestCases = newTestCases.slice(0, -1).map(({ Result, ...rest }) => rest);

      const allPassed = otherTestCases.every((testCase) => {
        return Object.values(testCase)[0] === 'Passed';
      });
      const resultTestCase = { Result: allPassed ? "True" : "False" };
      const updatedTestCases12 = [...otherTestCases, resultTestCase];
      setRunResponseTestCases(updatedTestCases12);

      if (allPassed) {
        setSuccessMessage("Congratulations!");
        setAdditionalMessage("You have passed all the test cases. Click the submit code button.");
      } else {
        setSuccessMessage("Wrong Answer");
        setAdditionalMessage("You have not passed all the test cases.");
      }
    } catch (error) {
      console.error("Error executing the code:", error);
      setSuccessMessage("Error");
      setAdditionalMessage("There was an error executing the code.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    setProcessing(true);
    try {
      const postData = {
        student_id: studentId,
        week_number: weekNumber,
        day_number: dayNumber,
        subject: subject,
        subject_id: subjectId,
        Qn: questions[currentQuestionIndex].Qn_name,
        Ans: Ans,
        CallFunction: "",
        Result: runResponseTestCases,
        Attempt: 0
      };

      const response = await axios.put(
        "https://live-exskilence-be.azurewebsites.net/api/student/coding/",
        postData
      );

      const responseData = response.data;
      
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex].status = true;
      setQuestions(updatedQuestions);
      setStatus(true);
      
      const codeKey = getUserCodeKey(questions[currentQuestionIndex].Qn_name);
      sessionStorage.setItem(codeKey, Ans);
 
    } catch (error) {
      console.error("Error executing the code:", error);
      setSuccessMessage("Error");
      setAdditionalMessage("There was an error for submitting the code.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-0" style={{ height: "100vh", maxWidth: "100%", overflowX: "hidden", backgroundColor: "#f2eeee" }}>
        <div className="p-0 my-0 me-2" style={{ backgroundColor: "#F2EEEE"}}>
          <SkeletonCode />
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 90px)',  overflowX: "hidden", overflowY: "hidden", backgroundColor: "#f2eeee" }}>
      <div className="p-0 my-0 me-2" style={{ backgroundColor: "#F2EEEE"}}>
        <div className="container-fluid p-0 pt-2" style={{ maxWidth: "100%", overflowX: "hidden", overflowY: "auto", backgroundColor: "#f2eeee" }}>
          <div className="row g-2">
            <div className="col-12">
              <div className="bg-white border rounded-2" style={{ height: "calc(100vh - 100px)", overflowY: "auto", padding: '20px 11px 15px 15px' }}>
                <div className="d-flex h-100">
                  {/* Question List */}
                  <div className="d-flex flex-column align-items-center" style={{ width: "80px"}}>
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        className="btn border border-dark rounded-2 mb-2 px-1 mx-auto"
                        style={{ 
                          width: "60px", 
                          height: "60px", 
                          backgroundColor: currentQuestionIndex === index ? "#42FF58" : "#FFFFFF", 
                          color: "#000", 
                          cursor: "pointer" 
                        }}
                        onClick={() => handleQuestionChange(index)}
                      >
                        Q{index + 1}
                      </button>
                    ))}
                  </div>
                  {/* Question Section */}
                  <div className="col-5 lg-8" style={{height: "100%", display: "flex", flexDirection: "column", marginLeft: '20px'}}>
                    <div className="border border-dark rounded-2 d-flex flex-column" style={{ height: "calc(100% - 5px)", backgroundColor: "#E5E5E533" }}>
                      <div className="border-bottom border-dark p-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0">Problem Statement</h5>
                      </div>
                      <div className="p-3 overflow-auto" >
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                          {questions[currentQuestionIndex]?.Qn}
                        </pre>
                        {questions[currentQuestionIndex].Examples && questions[currentQuestionIndex].Examples.length > 0 && (
                          <div className="mt-3">
                            <h6>Examples:</h6>
                            {questions[currentQuestionIndex].Examples.map((example, index) => (
                              <div key={index} className="border border-dark rounded-2 p-2 mb-2 bg-light">
                                <div className="mb-1">
                                  <strong>Input:</strong>
                                  <pre className="m-0" style={{ whiteSpace: 'pre-wrap' }}>
                                    {example.Example.Inputs && example.Example.Inputs.join('\n')}
                                  </pre>
                                </div>
                                <div className="mb-1">
                                  <strong>Output:</strong>
                                  <pre className="m-0" style={{ whiteSpace: 'pre-wrap' }}>{example.Example.Output}</pre>
                                </div>
                                {example.Example.Explanation && (
                                  <div>
                                    <strong>Explanation:</strong>
                                    <p className="m-0">{example.Example.Explanation}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editor Section */}
                  <div className="col-6 lg-8" style={{height: "100%", display: "flex", flexDirection: "column", marginLeft: "25px"}}> 
                    <div className="border border-dark rounded-2 me-3" style={{ height: "45%", backgroundColor: "#E5E5E533" }}>
                      <div className="border-bottom border-dark p-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0">Python</h5>
                      </div>
                      <AceEditor
                        mode="python"
                        theme="dreamweaver"
                        onChange={handleCodeChange}
                        value={Ans}
                        fontSize={16}
                        showPrintMargin={true}
                        showGutter={true}
                        highlightActiveLine={true}
                        wrapEnabled={true}
                        setOptions={{ useWorker: false }}
                        style={{ width: "100%", height: "calc(100% - 60px)" }}
                      />
                    </div>
                    <div style={{ height: "9%", padding: "10px 0" }} className="d-flex flex-column justify-content-center me-3">
                      <div className="d-flex justify-content-between align-items-center h-100">
                        <div className="d-flex flex-column justify-content-center">
                          {processing ? (
                            <h5 className="m-0">Processing...</h5>
                          ) : (
                            <>
                              {successMessage && <h5 className="m-0">{successMessage}</h5>}
                              {additionalMessage && <p className="m-0" style={{ fontSize: "12px" }}>{additionalMessage}</p>}
                            </>
                          )}
                        </div>
                        <div className="d-flex justify-content-end align-items-center">
                        <button
                            className="btn btn-sm btn-light me-2 "
                            style={{
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                              minWidth: "70px",
                              boxShadow: "#888 1px 2px 5px 0px",
                              height: "30px"
                            }}
                            disabled={processing}
                            onClick={handleCheckCode}
                          >
                            RUN CODE
                          </button>
                          <button
                            className="btn btn-sm btn-light me-2 "
                            style={{
                              backgroundColor: "#FBEFA5DB",
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                              minWidth: "70px",
                              boxShadow: "#888 1px 2px 5px 0px",
                              height: "30px"
                            }}
                            onClick={handleSubmit}
                            disabled={isSubmitted || processing || status == true}
                          >
                          {(status == false && !isSubmitted) ? "SUBMIT CODE" : "SUBMITTED"}
                          </button>

                          {(isSubmitted || status == true) ?                             
                          <button
                            className="btn btn-sm btn-light"
                            style={{
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                              minWidth: "70px",
                              boxShadow: "#888 1px 2px 5px 0px",
                              height: "30px"
                            }}
                            onClick={handleNext}
                          >
                            NEXT
                          </button> : 
                            null
                          }
                        </div>
                      </div>
                    </div>

                    <div className="border border-dark rounded-2 me-3" style={{ height: "45%", backgroundColor: "#E5E5E533" }}>
                      <div className="border-bottom border-dark p-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0">Output</h5>
                      </div>
                      <div className="p-3 overflow-auto" style={{ height: "calc(100% - 60px)" }}>
                        <pre
                          className="m-0"
                          id="output"
                          ref={outputRef}
                          tabIndex={0}
                          onKeyDown={handleKeyPress}
                          style={{ outline: 'none' }}
                        >
                          {output}
                        </pre>
                        {runResponseTestCases && (
                          <div className="col mt-3 mb-5">
                            {runResponseTestCases.map((testCase, index) => (
                                <div
                                    key={index}
                                    className="d-flex align-items-center mb-2 border border-ligth shadow bg-white rounded p-2 rounded-2"
                                    style={{ width: "fit-content", fontSize: "12px" }}
                                >
                                    <span className="me-2">{Object.keys(testCase)[0]}:</span>
                                    <span style={{ color: Object.values(testCase)[0] === "Passed" ? "blue" : Object.values(testCase)[0] === "True" ? "blue" : "red" }}>
                                    {Object.values(testCase)[0] as React.ReactNode}
                                    </span>
                                </div>
                            ))}
                          </div>
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
    </div>
  );
};

export default PyEditor;