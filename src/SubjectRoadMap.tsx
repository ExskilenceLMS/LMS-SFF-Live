import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SubjectRoadMap.css';
import Skeleton from 'react-loading-skeleton';
import MCQSkeletonCode from "./Components/MCQSkeletonCode";
import CodingSkeletonCode from "./Components/CodingSkeletonCode";
import { secretKey } from './constants';
import CryptoJS from 'crypto-js';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Modal, Accordion, Spinner } from 'react-bootstrap';
import { TfiMenuAlt } from "react-icons/tfi";
import { PiMonitorPlayBold } from "react-icons/pi";
import { SlNotebook } from "react-icons/sl";
import { FcTodoList } from "react-icons/fc";
import { LiaLaptopCodeSolid } from "react-icons/lia";
import { useNavigate } from 'react-router-dom';
import { CiSquareChevUp } from "react-icons/ci";
 
import { BsListTask } from "react-icons/bs";
import { set } from 'date-fns';
import { overflow } from 'html2canvas/dist/types/css/property-descriptors/overflow';
interface NoteSection {
    heading: string;
    content: string;
}

interface Notes {
    title: string;
    sections: NoteSection[];
}

interface MCQOption {
    id: string;
    text: string;
}

interface MCQQuestion {
    shuffledOptions: any;
    questionId: string;
    status: boolean;
    score: string;
    level: string;
    question: string;
    options: string[];
    correct_answer: string;
    Explanation?: string;
    Qn_name: string;
    entered_ans: string;
}

interface CodingQuestion {
    id: number;
    question: string;
    score: string;
    isSolved: boolean;
}


  interface SubTopic {
    subtopicid: string;
    sub_topic: string;
    lesson: string[];
    notes: string[];
    mcqQuestions: number;
    codingQuestions: number;
}

interface Chapter {
    Day: string;
    title: string;
    duration: string;
    sub_topic_data: SubTopic[];
}

const SubjectRoadMap: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [disablePreviousBtn, setDisablePreviousBtn] = useState<boolean>(true);
    const [disableNextBtn, setDisableNextBtn] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
    const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
    const [mcqQnScore, setMcqQnScore] = useState<string>('');
    const encryptedStudentId = sessionStorage.getItem('StudentId') || "";
    const decryptedStudentId = CryptoJS.AES.decrypt(encryptedStudentId!, secretKey).toString(CryptoJS.enc.Utf8);
    const studentId = decryptedStudentId;
    const encryptedSubjectId = sessionStorage.getItem('SubjectId');
    const decryptedSubjectId = CryptoJS.AES.decrypt(encryptedSubjectId!, secretKey).toString(CryptoJS.enc.Utf8);
    const subjectId = decryptedSubjectId;
    const encryptedSubject = sessionStorage.getItem('Subject');
    const decryptedSubject = CryptoJS.AES.decrypt(encryptedSubject!, secretKey).toString(CryptoJS.enc.Utf8);
    const subject = decryptedSubject;
    const encryptedDayNumber = sessionStorage.getItem('DayNumber');
    const decryptedDayNumber = CryptoJS.AES.decrypt(encryptedDayNumber!, secretKey).toString(CryptoJS.enc.Utf8);
    const dayNumber = decryptedDayNumber;
    const encryptedWeekNumber = sessionStorage.getItem('WeekNumber');
    const decryptedWeekNumber = CryptoJS.AES.decrypt(encryptedWeekNumber!, secretKey).toString(CryptoJS.enc.Utf8);
    const weekNumber = decryptedWeekNumber;
    const [hasFetched, setHasFetched] = useState(false);
    const [modalMessage, setModalMessage] = useState<string>("");
    const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
    const [unlockedSubtopics, setUnlockedSubtopics] = useState<Set<string>>(new Set());
    const [currentView, setCurrentView] = useState<'lesson' | 'mcq' | 'coding'  | 'notes'>('lesson');
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const [selectedContent, setSelectedContent] = useState<string>('');
    const [contentType, setContentType] = useState<'notes' | 'pdf' | 'ppt'>('notes');
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
    const [currentSubTopicIndex, setCurrentSubTopicIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
    const [currentNotesIndex, setCurrentNotesIndex] = useState(0);
    const [submittedAnswers, setSubmittedAnswers] = useState<{ [key: string]: boolean }>({});
    const [showExplanation, setShowExplanation] = useState<{ [key: string]: boolean }>({});
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [isActive, setIsActive] = useState<boolean>(true);
    // const [currentSubTopicIndex, setCurrentSubTopicIndex] = useState(0);
    const [currentContentType, setCurrentContentType] = useState<'lesson' | 'notes' | 'mcq' | 'coding'>('lesson');
    let allSubtopicIdsList: string[] = [];
    const navigate = useNavigate();
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const handleToggle = () => {
        setIsActive(prevIsActive => !prevIsActive);
    };
    useEffect(() => {
  const currentId = sessionStorage.getItem("currentSubTopicId");
  if (currentId && chapters.length > 0) {
    const idx = chapters[0].sub_topic_data.findIndex(sub => sub.subtopicid === currentId);
    if (idx !== -1) {
      setExpandedSection(idx.toString());
    }
  }
}, []);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    const blockedKeys = ['v', 'c', 'a'];

    if (key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && blockedKeys.includes(key.toLowerCase())) {
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key.toLowerCase())) {
      e.preventDefault();
    }
  };

  const disableRightClick = (e: MouseEvent) => {
    e.preventDefault();
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("contextmenu", disableRightClick);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("contextmenu", disableRightClick);
  };
}, []);

    useEffect(() => {
  const currentId = sessionStorage.getItem("currentSubTopicId");
  if (currentId && chapters.length > 0) {
    const idx = chapters[0].sub_topic_data.findIndex(sub => sub.subtopicid === currentId);
    if (idx !== -1) {
      setExpandedSection(idx.toString());
    }
  }
}, [sessionStorage.getItem("currentSubTopicId"),sessionStorage.getItem("lastContentType")]);

    const url = (subject: string): string => {
        if (subject.toLowerCase().includes("python")) {
            return "/py-editor";
        } else if (subject.toLowerCase().includes("sql")) {
            return "/sql-editor";
        } else if (subject.toLowerCase().includes("html") || subject.toLowerCase().includes("css")) {
            return "/html-css-editor";
        } else if (subject.toLowerCase().includes("java_script") || subject.toLowerCase().includes("javascript")) {
            return "/js-editor";
        }
        return "/html-css-editor";
    }

    const navigateTo = url(subject);

useEffect(() => {
    const storedContentType = sessionStorage.getItem("lastContentType");
    if (storedContentType) {
        setCurrentView(storedContentType as 'lesson' | 'mcq' | 'coding' | 'notes');
    }

    const fetchRoadmapData = async () => {
        try {
            setLoading(true);
            setDisablePreviousBtn(true);
            const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/student/learningmodules/${studentId}/${subject}/${subjectId}/${dayNumber}/${weekNumber}/`);
            setChapters(response.data);
            var variable=response.data[0].day_completed;
            
            const allSubtopicIds = response.data.flatMap((chapter: { sub_topic_data: any[]; }) =>
                chapter.sub_topic_data.map(subtopic => subtopic.subtopicid)
            );

             allSubtopicIdsList = allSubtopicIds;
            console.log("All Subtopic IDs:", allSubtopicIdsList); 

            if (response.data.length > 0) {
                const chapter = response.data[0];
                const userSubtopicId = chapter.user_subtopic_id;
                console.log('heyyyyyy',response.data[0].sub_topic_data[0].subtopicid)
               variable? sessionStorage.setItem("currentSubTopicId", response.data[0].sub_topic_data[0].subtopicid): sessionStorage.setItem("currentSubTopicId", userSubtopicId);
                const newUnlockedSubtopics = new Set<string>();

                chapter.sub_topic_data.forEach((subtopic: SubTopic) => {
                    if (subtopic.subtopicid <= userSubtopicId) {
                        newUnlockedSubtopics.add(subtopic.subtopicid);
                    }
                });
                setUnlockedSubtopics(newUnlockedSubtopics);
                sessionStorage.setItem('unlockedSubtopics', JSON.stringify(Array.from(newUnlockedSubtopics)));
            }

            if (response.data.length > 0) {
                            let unlockSubTopicId = JSON.parse(sessionStorage.getItem("unlockedSubtopics") || "[]");
        let currentSubTopicId = sessionStorage.getItem("currentSubTopicId");

        if (currentSubTopicId && unlockSubTopicId.length) {
            console.log('xyz');
            console.log(currentSubTopicId, unlockSubTopicId);
            let index = unlockSubTopicId.indexOf(currentSubTopicId);
            console.log(index); 
            sessionStorage.setItem("lastSubTopicIndex", Number(index).toString());

        }
                const storedIndex = sessionStorage.getItem("lastSubTopicIndex");
                setExpandedSections([storedIndex ? parseInt(storedIndex) : 0]);
                if (storedIndex && parseInt(storedIndex) < response.data[0].sub_topic_data.length) {
                    setCurrentSubTopicIndex(parseInt(storedIndex));
                } else {
                    setCurrentSubTopicIndex(0);
                }
                const firstChapter = response.data[0];
                if (firstChapter.sub_topic_data && firstChapter.sub_topic_data.length > 0) {
                    const subTopic = firstChapter.sub_topic_data[currentSubTopicIndex];
                    if (subTopic.lesson && subTopic.lesson.length > 0) {
                        setSelectedContent(subTopic.lesson[0]);
                    }
                }
            }

            const response1 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                "student_id": studentId,
                "subject": subject,
                "subject_id": subjectId,
                "day_number": dayNumber,
                "week_number": weekNumber,
                "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                "status": false
            });

            setLoading(false);
            setDisablePreviousBtn(false);
        } catch (err) {
            console.error("Error fetching roadmap data:", err);
            setError("Failed to load learning modules. Please try again later.");
            setLoading(false);
            setDisablePreviousBtn(false);
        }
    };

    fetchRoadmapData();
}, [studentId, subject, dayNumber]);


    const fetchMCQQuestions = useCallback(async (subTopicIndex: number) => {
        try {
            setLoading(true);
            setDisablePreviousBtn(true);
            const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/student/practicemcq/${studentId}/${subject}/${subjectId}/${dayNumber}/${weekNumber}/${sessionStorage.getItem('currentSubTopicId')}/`);
            setMcqQuestions(response.data);
            setCurrentMCQIndex(0);
            setLoading(false);
            setDisablePreviousBtn(false);
        } catch (err) {
            console.error("Error fetching MCQ questions:", err);
            setError("Failed to load MCQ questions. Please try again later.");
            setLoading(false);
        }
    }, [studentId, subject, dayNumber]);

    const fetchCodingQuestions = useCallback(async (subTopicIndex: number) => {
        try {
            setLoading(true);
            setDisablePreviousBtn(true);
            const response = await axios.get(`https://live-exskilence-be.azurewebsites.net/api/student/practicecoding/${studentId}/${subject}/${subjectId}/${dayNumber}/${weekNumber}/${sessionStorage.getItem('currentSubTopicId')}/`);
            const codingQuestionsData = response.data.map((question: any, index: number) => ({
                id: index + 1,
                question: question.Qn,
                score: question.score,
                isSolved: question.status
            }));
            setCodingQuestions(codingQuestionsData);
            setLoading(false);
            setDisablePreviousBtn(false);
        } catch (err) {
            console.error("Error fetching coding questions:", err);
            setError("Failed to load coding questions. Please try again later.");
            setLoading(false);
            setDisablePreviousBtn(false);
        }
    }, [studentId, subject, dayNumber]);

    const toggleSection = useCallback((index: number) => {
        setExpandedSections(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    }, []);

    const handleSubTopicChange = useCallback(async (index: number, isUserInitiated: boolean = false) => {
        setCurrentSubTopicIndex(index);
        setCurrentLessonIndex(0);
        setCurrentNotesIndex(0);
    
        sessionStorage.setItem("lastSubTopicIndex", index.toString());
    
        if (!expandedSections.includes(index)) {
            setExpandedSections(prev => [...prev, index]);
        }
    
        if (chapters.length > 0 && chapters[0].sub_topic_data.length > index) {
            const subTopic = chapters[0].sub_topic_data[index];
    
            if (!isUserInitiated) {
                setDisablePreviousBtn(true);
                const response1 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                    "student_id": studentId,
                    "subject": subject,
                    "subject_id": subjectId,
                    "day_number": dayNumber,
                    "week_number": weekNumber,
                    "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                    "status": false
                });
                setDisablePreviousBtn(false);
            }
    
            if (currentView === 'lesson' && subTopic.lesson && subTopic.lesson.length > 0) {
                setSelectedContent(subTopic.lesson[0]);
            } else if (currentView === 'notes' && subTopic.notes && subTopic.notes.length > 0) {
                setSelectedContent(subTopic.notes[0]);
                setContentType('notes');
            }
        }
        setDisablePreviousBtn(false);
    }, [chapters, currentView, expandedSections]);
     
    
    const handleViewChange = useCallback((view: 'lesson' | 'mcq' | 'coding'  | 'notes') => {
        setCurrentView(view);
        sessionStorage.setItem("lastContentType", view);
        setCurrentContentType(view);
    
        if (!expandedSections.includes(currentSubTopicIndex)) {
            setExpandedSections(prev => [...prev, currentSubTopicIndex]);
        }
    
        if (chapters.length > 0 && chapters[0].sub_topic_data.length > currentSubTopicIndex) {
            const subTopic = chapters[0].sub_topic_data[currentSubTopicIndex];
    
            if (view === 'lesson' && subTopic.lesson && subTopic.lesson.length > 0) {
                setSelectedContent(subTopic.lesson[currentLessonIndex]);
            } else if (view === 'notes' && subTopic.notes && subTopic.notes.length > 0) {
                setSelectedContent(subTopic.notes[currentNotesIndex]);
                setContentType('notes');
            } else if (view === 'mcq') {
                fetchMCQQuestions(currentSubTopicIndex);
            } else if (view === 'coding') {
                fetchCodingQuestions(currentSubTopicIndex);
            }
        }
    }, [chapters, currentSubTopicIndex, currentLessonIndex, currentNotesIndex, fetchMCQQuestions, fetchCodingQuestions, expandedSections]);
    
    const handleNextLesson = useCallback(() => {
        if (chapters.length > 0 && chapters[0].sub_topic_data.length > currentSubTopicIndex) {
            const subTopic = chapters[0].sub_topic_data[currentSubTopicIndex];
            if (subTopic.lesson && currentLessonIndex < subTopic.lesson.length - 1) {
                const nextIndex = currentLessonIndex + 1;
                setCurrentLessonIndex(nextIndex);
                setSelectedContent(subTopic.lesson[nextIndex]);
            } else if (chapters[0].sub_topic_data.length > currentSubTopicIndex + 1) {
                const nextSubTopicIndex = currentSubTopicIndex + 1;
                setCurrentSubTopicIndex(nextSubTopicIndex);
                setCurrentLessonIndex(0);

                const nextSubTopic = chapters[0].sub_topic_data[nextSubTopicIndex];
                if (nextSubTopic.lesson && nextSubTopic.lesson.length > 0) {
                    setSelectedContent(nextSubTopic.lesson[0]);
                }
                if (currentView === 'mcq') {
                    fetchMCQQuestions(nextSubTopicIndex);
                } else if (currentView === 'coding') {
                    fetchCodingQuestions(nextSubTopicIndex);
                }
            }
        }
    }, [chapters, currentSubTopicIndex, currentLessonIndex, currentView, fetchMCQQuestions, fetchCodingQuestions]);

    const handlePreviousLesson = useCallback(() => {
        if (currentLessonIndex > 0) {
            const prevIndex = currentLessonIndex - 1;
            setCurrentLessonIndex(prevIndex);
            setSelectedContent(chapters[0].sub_topic_data[currentSubTopicIndex].lesson[prevIndex]);
        } else if (currentSubTopicIndex > 0) {
            const prevSubTopicIndex = currentSubTopicIndex - 1;
            const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];

            if (prevSubTopic.lesson && prevSubTopic.lesson.length > 0) {
                setCurrentSubTopicIndex(prevSubTopicIndex);
                setCurrentLessonIndex(prevSubTopic.lesson.length - 1);
                setSelectedContent(prevSubTopic.lesson[prevSubTopic.lesson.length - 1]);
            }
            if (currentView === 'mcq') {
                fetchMCQQuestions(prevSubTopicIndex);
            } else if (currentView === 'coding') {
                fetchCodingQuestions(prevSubTopicIndex);
            }
        }
    }, [chapters, currentSubTopicIndex, currentLessonIndex, currentView, fetchMCQQuestions, fetchCodingQuestions]);

    const handleNextNotes = useCallback(() => {
        if (chapters.length > 0 && chapters[0].sub_topic_data.length > currentSubTopicIndex) {
            const subTopic = chapters[0].sub_topic_data[currentSubTopicIndex];
            if (subTopic.notes && currentNotesIndex < subTopic.notes.length - 1) {
                const nextIndex = currentNotesIndex + 1;
                setCurrentNotesIndex(nextIndex);
                setSelectedContent(subTopic.notes[nextIndex]);
            } else if (chapters[0].sub_topic_data.length > currentSubTopicIndex + 1) {
                const nextSubTopicIndex = currentSubTopicIndex + 1;
                setCurrentSubTopicIndex(nextSubTopicIndex);
                setCurrentNotesIndex(0);

                const nextSubTopic = chapters[0].sub_topic_data[nextSubTopicIndex];
                if (nextSubTopic.notes && nextSubTopic.notes.length > 0) {
                    setSelectedContent(nextSubTopic.notes[0]);
                }
            }
        }
    }, [chapters, currentSubTopicIndex, currentNotesIndex]);

    const handlePreviousNotes = useCallback(() => {
        if (currentNotesIndex > 0) {
            const prevIndex = currentNotesIndex - 1;
            setCurrentNotesIndex(prevIndex);
            setSelectedContent(chapters[0].sub_topic_data[currentSubTopicIndex].notes[prevIndex]);
        } else if (currentSubTopicIndex > 0) {
            const prevSubTopicIndex = currentSubTopicIndex - 1;
            const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];

            if (prevSubTopic.notes && prevSubTopic.notes.length > 0) {
                setCurrentSubTopicIndex(prevSubTopicIndex);
                setCurrentNotesIndex(prevSubTopic.notes.length - 1);
                setSelectedContent(prevSubTopic.notes[prevSubTopic.notes.length - 1]);
            }
        }
    }, [chapters, currentSubTopicIndex, currentNotesIndex]);

    const handleNextMCQ = useCallback(() => {
        if (currentMCQIndex < mcqQuestions.length - 1) {
            setCurrentMCQIndex(currentMCQIndex + 1);
        } else {
            if (chapters.length > 0 && chapters[0].sub_topic_data.length > currentSubTopicIndex + 1) {
                const nextSubTopicIndex = currentSubTopicIndex + 1;
                setCurrentSubTopicIndex(nextSubTopicIndex);
                fetchMCQQuestions(nextSubTopicIndex);
            }
        }
    }, [currentMCQIndex, mcqQuestions, chapters, currentSubTopicIndex, fetchMCQQuestions]);

    const handlePreviousMCQ = useCallback(() => {
        if (currentMCQIndex > 0) {
            setCurrentMCQIndex(currentMCQIndex - 1);
        } else {
            if (currentSubTopicIndex > 0) {
                const prevSubTopicIndex = currentSubTopicIndex - 1;
                setCurrentSubTopicIndex(prevSubTopicIndex);
                fetchMCQQuestions(prevSubTopicIndex);
            }
        }
    }, [currentMCQIndex, mcqQuestions, currentSubTopicIndex, chapters, fetchMCQQuestions]);

const isNextButtonDisabled = useCallback(() => {
    if (!chapters.length) return true;

    if (currentView === 'lesson') {
        const hasMoreLessons = currentLessonIndex < chapters[0].sub_topic_data[currentSubTopicIndex].lesson.length - 1;
        const hasNotes = chapters[0].sub_topic_data[currentSubTopicIndex].notes &&
                         chapters[0].sub_topic_data[currentSubTopicIndex].notes.length > 0;
        const hasCodingQuestions = chapters[0].sub_topic_data[currentSubTopicIndex].codingQuestions > 0;
        const hasMCQs = chapters[0].sub_topic_data[currentSubTopicIndex].mcqQuestions > 0;
        return !hasMoreLessons && !hasNotes && !hasCodingQuestions && !hasMCQs;
    }
    else if (currentView === 'notes') {
        const hasMoreNotes = currentNotesIndex < chapters[0].sub_topic_data[currentSubTopicIndex].notes.length - 1;
        const hasCodingQuestions = chapters[0].sub_topic_data[currentSubTopicIndex].codingQuestions > 0;
        const hasMCQs = chapters[0].sub_topic_data[currentSubTopicIndex].mcqQuestions > 0;
        return !hasMoreNotes && !hasCodingQuestions && !hasMCQs;
    }
    else if (currentView === 'mcq') {
        const hasMoreMCQs = currentMCQIndex < mcqQuestions.length - 1;
        const hasCodingQuestions = chapters[0].sub_topic_data[currentSubTopicIndex].codingQuestions > 0;
        return !hasMoreMCQs && !hasCodingQuestions;
    }
    else if (currentView === 'coding') {
        return currentSubTopicIndex >= chapters[0].sub_topic_data.length - 1;
    }

    return true;
}, [chapters, currentView, currentSubTopicIndex, currentLessonIndex, currentNotesIndex, currentMCQIndex, mcqQuestions]);

    const isPreviousButtonDisabled = useCallback(() => {
        if (!chapters.length) return true;

        if (currentView === 'lesson') {
            return currentLessonIndex === 0 && currentSubTopicIndex === 0;
        }
        else if (currentView === 'coding') {
            return false;
        }

        return false;
    }, [chapters, currentView, currentSubTopicIndex, currentLessonIndex, currentNotesIndex, currentMCQIndex]);

    const handleAnswerSelect = useCallback((questionId: string, option: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    }, []);


    const handleSubmitAnswer = useCallback((questionId: string, correctAnswer: string) => {
    const isCorrect = selectedAnswers[questionId] === correctAnswer;

    setSubmittedAnswers(prev => ({
        ...prev,
        [questionId]: isCorrect
    }));

    if (!isCorrect) {
        setShowExplanation(prev => ({
            ...prev,
            [questionId]: true
        }));
    }

    setAnsweredQuestions(prev => {
        const newSet = new Set(prev);
        newSet.add(questionId);
        return newSet;
    });

    const currentQuestion = mcqQuestions.find(q => q.Qn_name === questionId);

    if (currentQuestion) {
        const submissionData = {
            student_id: studentId,
            question_id: questionId,
            correct_ans: correctAnswer,
            entered_ans: selectedAnswers[questionId],
            subject_id: subjectId,
            subject: subject.split(" ")[0],
            week_number: weekNumber,
            day_number: parseInt(dayNumber)
        };

        setDisablePreviousBtn(true);
        axios.post("https://live-exskilence-be.azurewebsites.net/api/student/practicemcq/submit/", submissionData)
            .then(response => {
                setMcqQuestions(prevQuestions =>
                    prevQuestions.map(question =>
                        question.Qn_name === questionId
                            ? { ...question, score: response.data.score }
                            : question
                    )
                );
            })
            .catch(err => {
                console.error("Error submitting answer:", err);
            });
        setDisablePreviousBtn(false);
    }
}, [selectedAnswers, mcqQuestions, studentId, subject, dayNumber]);


    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfError, setPdfError] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoError, setVideoError] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);

    useEffect(() => {
        const notesUrl = chapters[0]?.sub_topic_data[currentSubTopicIndex]?.notes?.[currentNotesIndex];
        const lessonVideoUrl = chapters[0]?.sub_topic_data[currentSubTopicIndex]?.lesson?.[currentLessonIndex] || '';

        if (notesUrl && notesUrl.endsWith('.pdf')) {
            setPdfLoading(true);
            setPdfError(false);
            setLoading(true);

            fetch('https://live-exskilence-be.azurewebsites.net/media/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_url: notesUrl })
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.blob();
                })
                .then(blob => {
                    const processedUrl = URL.createObjectURL(blob);
                    setPdfUrl(processedUrl);
                    setPdfLoading(false);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching PDF:", err);
                    setPdfError(true);
                    setPdfLoading(false);
                    setLoading(false);
                });
        }

        if (lessonVideoUrl && lessonVideoUrl.endsWith('.mp4')) {
            setVideoLoading(true);
            setVideoError(false);
            setLoading(true);

            fetch('https://live-exskilence-be.azurewebsites.net/media/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_url: lessonVideoUrl })
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.blob();
                })
                .then(blob => {
                    const processedUrl = URL.createObjectURL(blob);
                    setVideoUrl(processedUrl);
                    setVideoLoading(false);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching video:", err);
                    setVideoError(true);
                    setVideoLoading(false);
                    setLoading(false);
                });
        }
    }, [chapters, currentSubTopicIndex, currentNotesIndex, currentLessonIndex]);

    const renderLessonContent = () => {
        if (loading) {
            return (
                <div className='d-flex justify-content-center'>
                    <div style={{ height: 'calc(100% - 10px)', overflow: 'auto' }}>
                        <Skeleton />
                    </div>
                </div>
            );
        }

        if (error || !chapters.length || !chapters[0].sub_topic_data[currentSubTopicIndex]?.lesson?.length) {
            return (
                <div className='d-flex justify-content-center'>
                    <div style={{ height: 'calc(100% - 10px)', overflow: 'auto' }}>
                        <Skeleton />
                    </div>
                </div>
            );
        }

        const rawVideoUrl = chapters[0]?.sub_topic_data[currentSubTopicIndex]?.lesson?.[currentLessonIndex] || '';
        const isYouTube = rawVideoUrl.includes('youtube.com') || rawVideoUrl.includes('youtu.be');

        if (isYouTube) {
            let embedUrl = rawVideoUrl;
            if (rawVideoUrl.includes('watch?v=')) {
                const videoId = rawVideoUrl.split('watch?v=')[1].split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (!rawVideoUrl.includes('/embed/')) {
                const videoIdMatch = rawVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : '';
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }

            return (
                <div className="h-100 overflow-hidden p-0">
                    <iframe
                        className="w-100 h-100"
                        src={embedUrl}
                        title="Video Player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        style={{ boxShadow: "#00000033 0px 0px 5px 0px inset" }}
                    />
                </div>
            );
        } else if (rawVideoUrl.endsWith('.mp4') && videoUrl) {
            return (
                <div className="h-100 overflow-hidden p-0">
                    <video
                        controlsList="nodownload"
                        disablePictureInPicture
                        controls
                        className="w-100 h-100"
                        src={videoUrl}
                        style={{ boxShadow: "#00000033 0px 0px 5px 0px inset" }}
                    />
                </div>
            );
        } else {
            return (
                <div className="d-flex justify-content-center align-items-center h-100">
                    Loading video...
                </div>
            );
        }
    };

    const renderNotesContent = () => {
        if (loading || error || !chapters.length || !chapters[0].sub_topic_data[currentSubTopicIndex]?.notes?.length) {
            return (
                <div>
                    <Skeleton count={6} height={20} width={100} />
                    <Skeleton count={6} height={20} />
                </div>
            );
        }

        const notesUrl = chapters[0].sub_topic_data[currentSubTopicIndex].notes[currentNotesIndex];

        if (notesUrl.endsWith('.html')) {
            return (
                <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(notesUrl)}&embedded=true`}
                    className="w-100 h-100"
                    title="HTML Notes"
                    style={{ border: 'none' }}
                />
            );
        } else if (notesUrl.endsWith('.pdf')) {
            return (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    {pdfLoading ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <div>Loading PDF...</div>
                        </div>
                    ) : pdfError ? (
                        <div style={{ color: 'red', textAlign: 'center', paddingTop: '20px' }}>
                            Failed to load PDF
                        </div>
                    ) : (
                        <div className="w-100 h-100" style={{ overflow: 'auto' }}>
                            <Viewer fileUrl={pdfUrl}  />
                        </div>
                    )}
                </Worker>
            );
        }

        return null;
    };


const renderMCQContent = () => {
    const shuffleArray = (array: string[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center h-100">
            <MCQSkeletonCode />
        </div>;
    }

    if (error || !mcqQuestions.length) {
        return <div className="d-flex justify-content-center align-items-center h-100">
            <MCQSkeletonCode />
        </div>;
    }

    const currentQuestion = mcqQuestions[currentMCQIndex];

    if (!currentQuestion) {
        return <div className="d-flex justify-content-center align-items-center h-100">
            <MCQSkeletonCode />
        </div>;
    }

    if (!currentQuestion.shuffledOptions) {
        currentQuestion.shuffledOptions = shuffleArray([...currentQuestion.options]);
    }

    const shuffledOptions = currentQuestion.shuffledOptions;
    const score = mcqQnScore ? mcqQnScore : currentQuestion.score;
    const questionId = currentQuestion.Qn_name;
    const isAnswered = currentQuestion.entered_ans !== "" || answeredQuestions.has(questionId);
    const isCorrect = submittedAnswers[questionId];

    return (
        <div className="d-flex flex-grow-1" style={{ height: '100%' }}>
            <div className="d-flex flex-column align-items-center" style={{ width: '80px' }}>
                {mcqQuestions.map((_, index) => (
                    <button key={index} className="btn border border-muted rounded-2 my-1 px-1 mx-auto" style={{ width: '50px', height: '55px', backgroundColor: index === currentMCQIndex ? '#42FF58' : '#fff', color: index === currentMCQIndex ? '#000' : '#000', cursor: 'pointer', }}
                        onClick={() => setCurrentMCQIndex(index)}
                    >
                        <span>Q{index + 1}</span>
                    </button>
                ))}
            </div>

            <div className="flex-grow-1 d-flex flex-column" style={{ height: '100%', width:'min-content' }}>
                <div className="border border-muted rounded-2" style={{ height: '100%', overflow: 'auto', boxShadow: "#00000033 0px 0px 5px 0px inset" }}>
                    <div className="border-bottom border-muted p-3 d-flex justify-content-between align-items-center">
                        <h5  style={{ cursor:'default'}} className="m-0">Practice MCQs</h5>
                    </div>

                    <div className="p-3">
                        <div className="mb-4">
                            <div className="d-flex justify-content-between mb-3">
                                <div style={{width:'85%'}}>{currentQuestion.question}</div>
                                <div>Score : {score}</div>
                            </div>

                            <div className="row g-2">
                                {shuffledOptions.map((option: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined, index: React.Key | null | undefined) => {
                                    const isSelected = selectedAnswers[questionId] === option;
                                    const isCorrectOption = option === currentQuestion.correct_answer;
                                    const isWrongOption = option === currentQuestion.entered_ans;

                                    let bgColor = '';
                                    if (!isAnswered) {
                                        bgColor = isSelected ? '#E0E0E0' : '';
                                    } else {
                                        if (isCorrectOption) {
                                            bgColor = '#BAFFCE';
                                        } else if (isSelected || isWrongOption) {
                                            bgColor = '#FFC9C9';
                                        }
                                    }

                                    return (
                                        <div key={index} className="col-6 d-flex align-items-center mb-2">
                                            <div className="me-2 mx-3">
                                            {String.fromCharCode(65 + (index as number))}.                                            </div>

                                            <button
                                                className="btn text-center px-2 py-1 rounded-2 border border-muted"
                                                style={{
                                                    backgroundColor: bgColor,
                                                    height: "100%",
                                                    width: '100%',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'normal',
                                                    boxShadow: '#00000033 0px 5px 4px',
                                                }}
                                                onClick={() => {
                                                    if (!isAnswered) {
                                                    handleAnswerSelect(questionId, option as string);
                                                    }
                                                }}
                                                disabled={isAnswered}
                                                >
                                                {option}
                                                </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {isAnswered ?
                                <button className="btn btn-outline-light mt-3 roadmap-button text-light" disabled={true} >
                                    Submitted
                                </button>
                                :
                                <button className="btn btn-outline-light mt-3 roadmap-button text-light" onClick={() => handleSubmitAnswer(questionId, currentQuestion.correct_answer)} disabled={!selectedAnswers[questionId]} >
                                    Submit
                                </button>
                            }
                            {isAnswered && !isCorrect && currentQuestion.Explanation && (
                                <div className="mt-4 border rounded-2 p-2" style={{ backgroundColor: 'white', boxShadow: "#00000033 0px 5px 4px" }} >
                                    <strong>Explanation:</strong>
                                    <div>{currentQuestion.Explanation}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

    const renderCodingContent = () => {
        if (loading) {
            <div className="d-flex justify-content-center align-items-center h-100">
                <Skeleton height={50} />
                <Skeleton count={3} height={50} />
            </div>
            return ;
        }

        if (error || !codingQuestions.length) {
            <div className="d-flex justify-content-center align-items-center h-100">
                <Skeleton height={50} />
                <Skeleton count={3} height={50} />
            </div>
            return ;
        }

        return (
            <div className="p-3">
                {codingQuestions.map((question) => (
                    <div key={question.id} className="mb-4">
                        <div className="d-flex align-items-start justify-content-between">
                            <div className='d-flex flex-column'>
                                <div className="d-flex align-items-start">
                                    <span className="me-2">{question.id}.</span>
                                    <span style={{ wordBreak: 'break-word' }}>
                                        {question.question.length >
                                            (window.innerWidth < 600
                                            ? 50
                                            : window.innerWidth < 1024
                                            ? 80
                                            : 100)
                                            ? question.question.slice(
                                                0,
                                                window.innerWidth < 1000
                                                ? 50
                                                : window.innerWidth < 1200
                                                ? 80
                                                : window.innerWidth < 1400
                                                ? 100
                                                : 140
                                            ) + "..."
                                            : question.question}
                                        </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-5" style={{ minWidth: '275px' }}>
                                <button className={`btn me-3`} style={{ minWidth: '80px', backgroundColor: question.isSolved ? '#63F67E' : '#D4DCFF', border: '1px solid black', color: 'black', }}
                                    onClick={() => {
                                        sessionStorage.setItem('currentQuestionIndex', (codingQuestions.indexOf(question)).toString());
                                        navigate(navigateTo);
                                    }}
                                    >
                                    {question.isSolved ? 'Solved' : 'Solve'}
                                </button>
                                <div className='me-3'>Score: {question.score}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

const handleNext = useCallback(async () => {
    const unlockedSubtopicsArray = JSON.parse(sessionStorage.getItem('unlockedSubtopics') || '[]');

    if (unlockedSubtopicsArray.length === 0) {
        navigate('/SubjectOverview');
        return;
    }

    if (!chapters || chapters.length === 0) {
        console.error("No chapters data available.");
        return;
    }

    const currentChapter = chapters[0];
    if (!currentChapter.sub_topic_data || currentChapter.sub_topic_data.length === 0) {
        console.error("No subtopics data available.");
        return;
    }

    if (currentView === 'lesson') {
        if (currentLessonIndex < currentChapter.sub_topic_data[currentSubTopicIndex].lesson.length - 1) {
            handleNextLesson();
        } else {
            if (currentChapter.sub_topic_data[currentSubTopicIndex].notes && currentChapter.sub_topic_data[currentSubTopicIndex].notes.length > 0) {
                handleViewChange('notes');
                setCurrentNotesIndex(0);
            } else if (currentChapter.sub_topic_data[currentSubTopicIndex].mcqQuestions > 0) {
                handleViewChange('mcq');
                setCurrentMCQIndex(0);
            } else if (currentChapter.sub_topic_data[currentSubTopicIndex].codingQuestions > 0) {
                handleViewChange('coding');
            } else {
                const isLastContent = currentLessonIndex === currentChapter.sub_topic_data[currentSubTopicIndex].lesson.length - 1;
                if (isLastContent) {
                    const response3 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                        "student_id": studentId,
                        "subject": subject,
                        "subject_id": subjectId,
                        "day_number": dayNumber,
                        "week_number": weekNumber,
                        "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                        "status": true
                    });
                    if (response3.data.message === 'Already Completed' || response3.data.message === "Updated" ) {
                        
                        const nextSubTopicIndex = currentSubTopicIndex + 1;
                        if (nextSubTopicIndex < currentChapter.sub_topic_data.length) {
                            const nextSubTopic = currentChapter.sub_topic_data[nextSubTopicIndex];
                            setUnlockedSubtopics(prev => {
                                const newSet = new Set(prev);
                                newSet.add(nextSubTopic.subtopicid);
                                sessionStorage.setItem('unlockedSubtopics', JSON.stringify(Array.from(newSet)));
                                return newSet;
                            });
                            sessionStorage.setItem("currentSubTopicId", nextSubTopic.subtopicid);
                            sessionStorage.setItem("lastContentType", 'lesson');
                            handleSubTopicChange(nextSubTopicIndex, false);
                            setCurrentView('lesson');
                            setCurrentLessonIndex(0);
                            setDisablePreviousBtn(false);
                            setDisableNextBtn(false);
                        }
                    } 
                    else if( response3.data.message === "Day Completed")
                        {
                            navigate("/SubjectOverview");
                            console.log(allSubtopicIdsList)
                        }
                    else {
                        setShowUpdateModal(true);
                        setModalMessage("Please complete the current lesson before moving to the next one");
                        setDisableNextBtn(false);
                    }
                }
            }
        }
    } else if (currentView === 'notes') {
        console.log(currentChapter)
        console.log(currentSubTopicIndex)
        console.log(currentChapter.sub_topic_data[currentSubTopicIndex])
        console.log('159', currentChapter.sub_topic_data[currentSubTopicIndex].mcqQuestions)
        if (currentNotesIndex < currentChapter.sub_topic_data[currentSubTopicIndex].notes.length - 1) {
            handleNextNotes();
        } else {
            if (currentChapter.sub_topic_data[currentSubTopicIndex].mcqQuestions > 0) {
                handleViewChange('mcq');
                setCurrentMCQIndex(0);
            } else if (currentChapter.sub_topic_data[currentSubTopicIndex].codingQuestions > 0) {
                handleViewChange('coding');
            } else {
                const isLastContent = currentNotesIndex === currentChapter.sub_topic_data[currentSubTopicIndex].notes.length - 1;
                if (isLastContent) {
                    const response3 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                        "student_id": studentId,
                        "subject": subject,
                        "subject_id": subjectId,
                        "day_number": dayNumber,
                        "week_number": weekNumber,
                        "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                        "status": true
                    });
                    if (response3.data.message === 'Already Completed' || response3.data.message === "Updated") {
                        
                        const nextSubTopicIndex = currentSubTopicIndex + 1;
                        if (nextSubTopicIndex < currentChapter.sub_topic_data.length) {
                            const nextSubTopic = currentChapter.sub_topic_data[nextSubTopicIndex];
                            setUnlockedSubtopics(prev => {
                                const newSet = new Set(prev);
                                newSet.add(nextSubTopic.subtopicid);
                                sessionStorage.setItem('unlockedSubtopics', JSON.stringify(Array.from(newSet)));
                                return newSet;
                            });
                            sessionStorage.setItem("currentSubTopicId", nextSubTopic.subtopicid);
                            sessionStorage.setItem("lastContentType", 'lesson');
                            handleSubTopicChange(nextSubTopicIndex, false);
                            setCurrentView('lesson');
                            setCurrentLessonIndex(0);
                            setDisablePreviousBtn(false);
                            setDisableNextBtn(false);
                        }
                    } 
                    else if( response3.data.message === "Day Completed")
                        {
                            navigate("/SubjectOverview");
                            console.log(allSubtopicIdsList)
                        }
                    else {
                        setShowUpdateModal(true);
                        setModalMessage("Please complete the current lesson before moving to the next one");
                        setDisableNextBtn(false);
                    }
                }
            }
        }
    } else if (currentView === 'mcq') {
        if (currentMCQIndex < mcqQuestions.length - 1) {
            handleNextMCQ();
        } else {
            if (currentChapter.sub_topic_data[currentSubTopicIndex].codingQuestions > 0) {
                handleViewChange('coding');
            } else {
                const currentSubtopicid = sessionStorage.getItem("currentSubTopicId");
                if (currentSubtopicid) {
                    const currentSubtopicIndex = currentChapter.sub_topic_data.findIndex(subTopic => subTopic.subtopicid === currentSubtopicid);
                    if (currentSubtopicIndex !== -1) {
                        const contentTypes: Array<keyof SubTopic> = ['lesson', 'notes', 'mcqQuestions', 'codingQuestions'];
                        const contentOrder = contentTypes.filter(type => {
                            const content = currentChapter.sub_topic_data[currentSubtopicIndex][type];
                            if (Array.isArray(content)) {
                                return content.length > 0;
                            } else if (typeof content === 'number') {
                                return content > 0;
                            }
                            return false;
                        });
                        const isLastContent = contentOrder[contentOrder.length - 1] === 'mcqQuestions';
                        if (isLastContent) {
                            const response3 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                                "student_id": studentId,
                                "subject": subject,
                                "subject_id": subjectId,
                                "day_number": dayNumber,
                                "week_number": weekNumber,
                                "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                                "status": true
                            });
                            if (response3.data.message === 'Already Completed' || response3.data.message === "Updated") {
                                console.log("456")
                        
                                const nextSubTopicIndex = currentSubTopicIndex + 1;
                                if (nextSubTopicIndex < currentChapter.sub_topic_data.length) {
                                    const nextSubTopic = currentChapter.sub_topic_data[nextSubTopicIndex];
                                    setUnlockedSubtopics(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(nextSubTopic.subtopicid);
                                        sessionStorage.setItem('unlockedSubtopics', JSON.stringify(Array.from(newSet)));
                                        return newSet;
                                    });
                                    sessionStorage.setItem("currentSubTopicId", nextSubTopic.subtopicid);
                                    sessionStorage.setItem("lastContentType", 'lesson');
                                    handleSubTopicChange(nextSubTopicIndex, false);
                                    setCurrentView('lesson');
                                    setCurrentLessonIndex(0);
                                    setDisablePreviousBtn(false);
                                    setDisableNextBtn(false);
                                }
                            }
                            else if( response3.data.message === "Day Completed")
                        {
                            console.log("123");
                            navigate("/SubjectOverview");
                            console.log(allSubtopicIdsList)
                        }
                         else {
                                setShowUpdateModal(true);
                                setModalMessage("Please complete the current lesson before moving to the next one");
                                setDisableNextBtn(false);
                            }
                        }
                    }
                }
            }
        }
    } else if (currentView === 'coding') {
        const currentSubtopicid = sessionStorage.getItem("currentSubTopicId");
        const subtopic = currentChapter.sub_topic_data.find(st => st.subtopicid === currentSubtopicid);
        if (!subtopic) return false;
        const contentTypes: Array<keyof SubTopic> = ['lesson', 'notes', 'mcqQuestions', 'codingQuestions'];
        const contentOrder = contentTypes.filter(type => {
            const content = subtopic[type];
            if (Array.isArray(content)) {
                return content.length > 0;
            } else if (typeof content === 'number') {
                return content > 0;
            }
            return false;
        });
        const isLastContent = contentOrder[contentOrder.length - 1] === 'codingQuestions';
        if (isLastContent) {
            const response3 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                "student_id": studentId,
                "subject": subject,
                "subject_id": subjectId,
                "day_number": dayNumber,
                "week_number": weekNumber,
                "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                "status": true
            });
            if (response3.data.message === 'Already Completed' || response3.data.message === "Updated") {

                const nextSubTopicIndex = currentSubTopicIndex + 1;
                if (nextSubTopicIndex < currentChapter.sub_topic_data.length) {
                    const nextSubTopic = currentChapter.sub_topic_data[nextSubTopicIndex];
                    setUnlockedSubtopics(prev => {
                        const newSet = new Set(prev);
                        newSet.add(nextSubTopic.subtopicid);
                        sessionStorage.setItem('unlockedSubtopics', JSON.stringify(Array.from(newSet)));
                        return newSet;
                    });
                    sessionStorage.setItem("currentSubTopicId", nextSubTopic.subtopicid);
                    sessionStorage.setItem("lastContentType", 'lesson');
                    handleSubTopicChange(nextSubTopicIndex, false);
                    setCurrentView('lesson');
                    setCurrentLessonIndex(0);
                    setDisablePreviousBtn(false);
                    setDisableNextBtn(false);
                }
            } 
            else  if( response3.data.message === "Day Completed")
                        {
                            navigate("/SubjectOverview");
                            console.log(allSubtopicIdsList)
                        }
                        else {
                setShowUpdateModal(true);
                setModalMessage("Please complete the current lesson before moving to the next one");
                setDisableNextBtn(false);
            }
        } else {
            setDisableNextBtn(true);
            setDisablePreviousBtn(true);
            const response3 = await axios.put("https://live-exskilence-be.azurewebsites.net/api/student/lessons/status/", {
                "student_id": studentId,
                "subject": subject,
                "subject_id": subjectId,
                "day_number": dayNumber,
                "week_number": weekNumber,
                "sub_topic": sessionStorage.getItem('currentSubTopicId') || "",
                "status": true
            });
            if (response3.data.message === 'Already Completed' || response3.data.message === "Updated") {
                
                setDisablePreviousBtn(false);
            }
            else if( response3.data.message === "Day Completed")
                        {
                            navigate("/SubjectOverview");
                            console.log(allSubtopicIdsList)
                        }
            else {
                setShowUpdateModal(true);
                setModalMessage("Please complete the next one.");
                setDisableNextBtn(false);
            }
        }
    }
}, [currentView, currentLessonIndex, currentNotesIndex, currentMCQIndex, chapters, currentSubTopicIndex, studentId, subject, subjectId, dayNumber, weekNumber]);


const handlePrevious = useCallback(() => {
    console.log('handleprevious')
    if (currentView === 'lesson') {
        console.log('lesson')
        if (currentLessonIndex > 0) {
            console.log('.0')
             handlePreviousLesson();
            

        } else if (currentSubTopicIndex > 0) {
            const prevSubTopicIndex = currentSubTopicIndex - 1;
            const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];
            setCurrentSubTopicIndex(prevSubTopicIndex);
            setCurrentLessonIndex(prevSubTopic.lesson.length - 1);
            setSelectedContent(prevSubTopic.lesson[prevSubTopic.lesson.length - 1]);
            let unlockSubTopicId = JSON.parse(sessionStorage.getItem("unlockedSubtopics") || "[]");
        let currentSubTopicId = sessionStorage.getItem("currentSubTopicId");

        if (currentSubTopicId && unlockSubTopicId.length) {
            console.log('xyz');
            console.log(currentSubTopicId, unlockSubTopicId);
            let index = unlockSubTopicId.indexOf(currentSubTopicId);
            console.log(index); 
            sessionStorage.setItem("lastSubTopicIndex", Number(index-1).toString());
            sessionStorage.setItem("currentSubTopicId", unlockSubTopicId[index-1]);
        }
           
        }
    } 
    
    else if (currentView === 'notes') {
        if (currentNotesIndex > 0) {
            handlePreviousNotes();
        } else {
            if (chapters[0].sub_topic_data[currentSubTopicIndex].lesson && chapters[0].sub_topic_data[currentSubTopicIndex].lesson.length > 0) {
                handleViewChange('lesson');
                setCurrentLessonIndex(chapters[0].sub_topic_data[currentSubTopicIndex].lesson.length - 1);
            } else if (currentSubTopicIndex > 0) {
                const prevSubTopicIndex = currentSubTopicIndex - 1;
                const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];
                setCurrentSubTopicIndex(prevSubTopicIndex);
                setCurrentNotesIndex(prevSubTopic.notes.length - 1);
                setSelectedContent(prevSubTopic.notes[prevSubTopic.notes.length - 1]);
            }
        }
    } 
    
    else if (currentView === 'mcq') {
        if (currentMCQIndex > 0) {
            handlePreviousMCQ();
        } else {
            if (chapters[0].sub_topic_data[currentSubTopicIndex].notes && chapters[0].sub_topic_data[currentSubTopicIndex].notes.length > 0) {
                handleViewChange('notes');
                setCurrentNotesIndex(chapters[0].sub_topic_data[currentSubTopicIndex].notes.length - 1);
            } else if (currentSubTopicIndex > 0) {
                const prevSubTopicIndex = currentSubTopicIndex - 1;
                const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];
                setCurrentSubTopicIndex(prevSubTopicIndex);
                setCurrentMCQIndex(prevSubTopic.mcqQuestions - 1);
            }
        }
    } else if (currentView === 'coding') {
        if (chapters[0].sub_topic_data[currentSubTopicIndex].mcqQuestions > 0) {
            handleViewChange('mcq');
            setCurrentMCQIndex(mcqQuestions.length - 1);
        } else {
            if (chapters[0].sub_topic_data[currentSubTopicIndex].notes && chapters[0].sub_topic_data[currentSubTopicIndex].notes.length > 0) {
                handleViewChange('notes');
                setCurrentNotesIndex(chapters[0].sub_topic_data[currentSubTopicIndex].notes.length - 1);
            } else if (currentSubTopicIndex > 0) {
                const prevSubTopicIndex = currentSubTopicIndex - 1;
                const prevSubTopic = chapters[0].sub_topic_data[prevSubTopicIndex];
                setCurrentSubTopicIndex(prevSubTopicIndex);
                setCurrentLessonIndex(prevSubTopic.lesson.length - 1);
                setSelectedContent(prevSubTopic.lesson[prevSubTopic.lesson.length - 1]);
            }
        }
    }
}, [currentView, currentLessonIndex, currentNotesIndex, currentMCQIndex, chapters, currentSubTopicIndex]);

    const SidebarComponent = () => {
        if (error || !chapters.length) {
            return (
                <div className="border border-muted rounded-2 me-3 d-flex flex-column" style={{ width: '25%', height: 'calc(100% - 10px)', overflow: 'auto', flexShrink: 0 }}>
                    <div className="border-bottom border-muted p-3 text-center">
                        <Skeleton height={20} />
                    </div>
                </div>
            );
        }
    
        const expandedSectionsString = expandedSections.map(index => index.toString());
        const currentSubTopicId = sessionStorage.getItem("currentSubTopicId") || "";
        const lastContentType = sessionStorage.getItem("lastContentType") || "lesson";
    
        return (
            <div className="border border-muted rounded-2 me-3 d-flex flex-column" style={{ width: '25%', height: 'calc(100% - 10px)', overflow: 'auto', flexShrink: 0, boxShadow: "#00000059 0px 5px 5px" }}>
                <div className="border-bottom border-muted">
                    <div className="d-flex justify-content-between align-items-center px-3 pe-1 py-2">
                        <h5 className="mb-0">
                            {chapters[0].Day}:{" "}
                            {chapters[0].title.length > 10
                                ? `${chapters[0].title.substring(0, 10)}...`
                                : chapters[0].title}
                        </h5>
                        <div className='d-flex align-items-center'>
                            <h5 className='mb-0 me-3'>{chapters[0].duration}hr</h5>
                            <button className='btn' onClick={handleToggle}><TfiMenuAlt size={25} /></button>
                        </div>
                    </div>
                </div>
                <div className="flex-grow-1 overflow-auto">
                    <Accordion
                      activeKey={expandedSection}
                      onSelect={(key) => setExpandedSection((key as string) ?? null)}
                    >
                    {chapters[0].sub_topic_data.map((subTopic, index) => (
                        <Accordion.Item key={index} eventKey={index.toString()}>
                            <Accordion.Header >
                                <span style={{ fontSize: '16px', width: '80%' }}><span style={{ fontSize: '14px', fontWeight: 'bold' }}>{index + 1}:</span> {subTopic.sub_topic}</span>
                                <CiSquareChevUp size={20} className="accordion-icon" /> 
                            </Accordion.Header>
                            <Accordion.Body>
                                <div className="p-0">
                                    {subTopic.lesson && subTopic.lesson.length > 0 && (
                                        <div
                                            className="d-flex align-items-center mb-1 ms-3"
                                            style={{
                                                color: lastContentType === 'lesson' && subTopic.subtopicid === currentSubTopicId ? 'blue' : 'black',
                                                cursor: unlockedSubtopics.has(subTopic.subtopicid) ? 'pointer' : 'not-allowed',
                                                opacity: unlockedSubtopics.has(subTopic.subtopicid) ? 1 : 0.5
                                            }}
                                            onClick={() => {
                                                if (unlockedSubtopics.has(subTopic.subtopicid)) {
                                                    handleSubTopicContentClick(index, 'lesson');
                                                }
                                            }}
                                        >
                                            <PiMonitorPlayBold size={20} style={{ marginRight: '10px' }} />
                                            <span>Video</span>
                                        </div>
                                    )}
                                    {subTopic.notes && subTopic.notes.length > 0 && (
                                        <div
                                            className="d-flex align-items-center mb-1 ms-3"
                                            style={{
                                                color: lastContentType === 'notes' && subTopic.subtopicid === currentSubTopicId ? 'blue' : 'black',
                                                cursor: unlockedSubtopics.has(subTopic.subtopicid) ? 'pointer' : 'not-allowed',
                                                opacity: unlockedSubtopics.has(subTopic.subtopicid) ? 1 : 0.5
                                            }}
                                            onClick={() => {
                                                if (unlockedSubtopics.has(subTopic.subtopicid)) {
                                                    handleSubTopicContentClick(index, 'notes');
                                                }
                                            }}
                                        >
                                            <SlNotebook size={20} style={{ marginRight: '10px' }} />
                                            <span>Notes</span>
                                        </div>
                                    )}
                                    {subTopic.mcqQuestions > 0 && (
                                        <div
                                            className="d-flex align-items-center mb-1 ms-3"
                                            style={{
                                                color: lastContentType === 'mcq' && subTopic.subtopicid === currentSubTopicId ? 'blue' : 'black',
                                                cursor: unlockedSubtopics.has(subTopic.subtopicid) ? 'pointer' : 'not-allowed',
                                                opacity: unlockedSubtopics.has(subTopic.subtopicid) ? 1 : 0.5
                                            }}
                                            onClick={() => {
                                                if (unlockedSubtopics.has(subTopic.subtopicid)) {
                                                    handleSubTopicContentClick(index, 'mcq');
                                                }
                                            }}
                                        >
                                            <BsListTask size={20} style={{ marginRight: '10px' }} />
                                            {/* <FcTodoList /> */}
                                            <span>Practice MCQs</span>
                                        </div>
                                    )}
                                    {subTopic.codingQuestions > 0 && (
                                        <div
                                            className="d-flex align-items-center mb-1 ms-3"
                                            style={{
                                                color: lastContentType === 'coding' && subTopic.subtopicid === currentSubTopicId ? 'blue' : 'black',
                                                cursor: unlockedSubtopics.has(subTopic.subtopicid) ? 'pointer' : 'not-allowed',
                                                opacity: unlockedSubtopics.has(subTopic.subtopicid) ? 1 : 0.5
                                            }}
                                            onClick={() => {
                                                if (unlockedSubtopics.has(subTopic.subtopicid)) {
                                                    handleSubTopicContentClick(index, 'coding');
                                                }
                                            }}
                                        >
                                            <LiaLaptopCodeSolid size={25} style={{ marginRight: '5px' }} />
                                            <span>Practice Coding</span>
                                        </div>
                                    )}
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
                </div>
            </div>
        );
    };
    
    const SidebarComponentBar = () => {

        return (
            <div className=" me-3 d-flex flex-column" style={{ flexShrink: 0 }}>
                <div className=" me-1 mt-2">
                    <button className='btn' onClick={handleToggle}>< TfiMenuAlt size={25}/></button>
                </div>
            </div>
        );
    };
    const handleSubTopicContentClick = useCallback(async (index: number, contentType: 'lesson' | 'notes' | 'mcq' | 'coding') => {
        const subTopic = chapters[0].sub_topic_data[index];
    
        sessionStorage.setItem("currentSubTopicId", subTopic.subtopicid);
    
        setCurrentSubTopicIndex(index);
        setCurrentContentType(contentType);
    
        if (contentType === 'lesson' && subTopic.lesson && subTopic.lesson.length > 0) {
            setSelectedContent(subTopic.lesson[0]);
            setCurrentLessonIndex(0);
        } else if (contentType === 'notes' && subTopic.notes && subTopic.notes.length > 0) {
            setSelectedContent(subTopic.notes[0]);
            setContentType('notes');
            setCurrentNotesIndex(0);
        } else if (contentType === 'mcq') {
            await fetchMCQQuestions(index);
            setCurrentMCQIndex(0);
        } else if (contentType === 'coding') {
            await fetchCodingQuestions(index);
        }
    
        handleViewChange(contentType);
    }, [chapters, fetchMCQQuestions, fetchCodingQuestions]);
    
    useEffect(() => {
        if (!hasFetched && sessionStorage.getItem('currentSubTopicId') != null) {
            fetchMCQQuestions(0);
            setHasFetched(true);
          }

          if (!hasFetched && sessionStorage.getItem('currentSubTopicId') != null) {
            fetchCodingQuestions(0);
            setHasFetched(true);
          }
    }, [fetchMCQQuestions, fetchCodingQuestions, studentId, subject, dayNumber]);


return (
    <div className="container-fluid p-0" style={{ height: `calc(100vh - 60px)`, overflowX: "hidden", overflowY: "hidden", backgroundColor: "#f2eeee" }}>
        <div className="p-0 my-0 me-2" style={{ backgroundColor: "#f0f0f0" }}>
            <div className="container-fluid p-0 pt-2" style={{ maxWidth: "100%", overflowX: "hidden", overflowY: "auto", backgroundColor: "#f0f0f0" }}>
                <div className='row g-2'>
                    <div className='col-12'>
                        <div className="bg-white border border-muted rounded-2 py-3" style={{ height: 'calc(100vh - 60px)', overflowY: "auto" }}>
                            <div className="d-flex" style={{ height: 'calc(100vh - 145px)' }}>
                                {currentView === 'lesson' && (
                                    <div className="flex-grow-1 me-3 d-flex flex-column" style={{ height: '100%' }}>
                                        <div className="border border-muted rounded-2 ms-3" style={{ height: 'calc(100% - 10px)', overflow: 'auto', boxShadow: '#00000033 0px 0px 5px 0px insets' }}>
                                            {renderLessonContent()}
                                        </div>
                                    </div>
                                )}
                                {currentView === 'notes' && (
                                    <div className="flex-grow-1 me-3 d-flex flex-column" style={{ height: '100%' }}>
                                        <div className="border border-muted rounded-2 ms-3" style={{ height: 'calc(100% - 10px)', overflow: 'auto', boxShadow: '#00000033 0px 0px 5px 0px insets' }}>
                                            {renderNotesContent()}
                                        </div>
                                    </div>
                                )}
                                {currentView === 'mcq' && (mcqQuestions.length > 0 ? (
                                    <div className="flex-grow-1 me-3 d-flex flex-column" style={{ height: '100%' }}>
                                        <div className="rounded-2" style={{ height: 'calc(100% - 10px)', overflow: 'auto' }}>
                                            {renderMCQContent()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center h-100 pe-3" style={{ width: '100%' }}>
                                        <MCQSkeletonCode />
                                    </div>
                                ))}
                                {currentView === 'coding' && (codingQuestions.length > 0 ? (
                                    <div className="flex-grow-1 me-3 d-flex flex-column" style={{ height: '100%' }}>
                                        <div className="border border-muted rounded-2 ms-3" style={{ height: 'calc(100% - 10px)', overflow: 'hide', boxShadow: '#00000033 0px 0px 5px 0px inset' }}>
                                            <div className="border-bottom border-muted p-3">
                                                <h5 style={{ cursor: 'default' }} className="m-0">Practice Coding</h5>
                                            </div>
                                            {renderCodingContent()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center h-100 pe-3" style={{ width: '100%' }}>
                                        <CodingSkeletonCode />
                                    </div>
                                ))}
                                {isActive ? SidebarComponent() : SidebarComponentBar()}
                            </div>
                            <div className="mt-2 d-flex justify-content-between px-3">
                                <button className="btn btn-sm btn-outline-light PN-button text-light px-2 py-1 rounded-2" onClick={handlePrevious} disabled={isPreviousButtonDisabled() || disablePreviousBtn}>
                                    Previous
                                </button>
                                <button className="btn btn-sm btn-outline-light PN-button text-light px-2 py-1 rounded-2" onClick={handleNext}>
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {loading && (
                    <div className="loading-overlay">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                )}
        <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Message</Modal.Title>
            </Modal.Header>
            <Modal.Body>{modalMessage}</Modal.Body>
        </Modal>
    </div>
);

};

export default SubjectRoadMap;