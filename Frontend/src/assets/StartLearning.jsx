import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultCourses } from "./courseData";
import "./StartLearning.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FINAL_ASSESSMENT_PASS_PERCENT = 80;

function toEmbedUrl(videoUrl) {
    try {
        const url = new URL(videoUrl);
        const hostname = url.hostname.replace("www.", "");

        if (hostname === "youtube.com" || hostname === "m.youtube.com") {
            const videoId = url.searchParams.get("v");
            return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
        }

        if (hostname === "youtu.be") {
            const videoId = url.pathname.replace("/", "");
            return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
        }

        return videoUrl;
    } catch {
        return videoUrl;
    }
}

function getStoredUser() {
    try {
        const savedUser = localStorage.getItem("learnlyUser");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        return parsedUser && typeof parsedUser === "object" ? parsedUser : null;
    } catch {
        return null;
    }
}

const practicalTasks = {
    "AI & Machine Learning": {
        prompt: "Write one Python line that creates a feature matrix named X from a pandas DataFrame named data.",
        starterCode: "# Write your solution here\n",
        keywords: ["data", "X", "iloc", "drop"],
    },
    Cybersecurity: {
        prompt: "Write a Python function called isStrongPassword that returns true when a password has at least 12 characters.",
        starterCode: "def isStrongPassword(password):\n    # Write your solution here\n    pass\n",
        keywords: ["def", "isStrongPassword", "len", "12", "return"],
    },
    "Data Analytics": {
        prompt: "Write a SQL query that returns the average salary from a table named employees.",
        starterCode: "-- Write your SQL query here\n",
        keywords: ["select", "avg", "salary", "from", "employees"],
    },
    Development: {
        prompt: "Write a JavaScript function called add that returns the sum of two numbers.",
        starterCode: "function add(first, second) {\n  // Write your solution here\n}\n",
        keywords: ["function", "add", "first", "second", "return"],
    },
    IoT: {
        prompt: "Write a JavaScript function called isSafeTemperature that returns true when a value is between 0 and 40.",
        starterCode: "function isSafeTemperature(value) {\n  // Write your solution here\n}\n",
        keywords: ["function", "isSafeTemperature", "value", "return", "40"],
    },
};

function buildFinalAssessment(questions, topic) {
    return questions.map((question, index) => {
        if (index === 1) {
            return { ...question, type: "fill", prompt: `Fill in the answer: ${question.question}`, expectedAnswer: question.options[question.answer] };
        }

        if (index === 2) return { ...question, type: "scenario", scenario: "REAL-WORLD SCENARIO: You are making this decision for a production team. Choose the best action." };

        if (index === 3) return { ...question, type: "code", ...practicalTasks[topic] || practicalTasks.Development };

        return { ...question, type: "choice" };
    });
}

function escapeXml(value) {
    return String(value).replace(/[<>&'"]/g, (character) => ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
    }[character]));
}

function downloadCertificate(course, userName, score) {
    const completedDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
        <rect width="1600" height="1100" fill="#172019"/>
        <rect x="55" y="55" width="1490" height="990" fill="none" stroke="#d6f36b" stroke-width="4"/>
        <rect x="78" y="78" width="1444" height="944" fill="none" stroke="#526052" stroke-width="2"/>
        <text x="800" y="250" fill="#d6f36b" font-family="Georgia, serif" font-size="32" letter-spacing="8" text-anchor="middle">LEARNLY ACADEMY</text>
        <text x="800" y="390" fill="#f4f7ef" font-family="Georgia, serif" font-size="76" text-anchor="middle">Certificate of Completion</text>
        <text x="800" y="480" fill="#aeb9aa" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">This certificate is proudly presented to</text>
        <text x="800" y="600" fill="#d6f36b" font-family="Georgia, serif" font-size="68" text-anchor="middle">${escapeXml(userName)}</text>
        <text x="800" y="690" fill="#aeb9aa" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">for successfully completing</text>
        <text x="800" y="770" fill="#f4f7ef" font-family="Arial, sans-serif" font-size="42" font-weight="bold" text-anchor="middle">${escapeXml(course.title)}</text>
        <text x="800" y="850" fill="#aeb9aa" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">Final assessment score: ${score}%  |  Completed ${escapeXml(completedDate)}</text>
        <line x1="520" y1="930" x2="1080" y2="930" stroke="#526052" stroke-width="2"/>
        <text x="800" y="975" fill="#aeb9aa" font-family="Arial, sans-serif" font-size="20" text-anchor="middle">Learn with intention. Build with confidence.</text>
    </svg>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    link.download = `${course.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function StartLearning() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(() => defaultCourses.find((item) => String(item.id) === courseId) || null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [watchedLessons, setWatchedLessons] = useState(() => new Set());

    const storedUser = getStoredUser();
    const userId = storedUser && typeof storedUser === "object" ? storedUser.id : null;
    const [quizState, setQuizState] = useState({ active: false, questionIndex: 0, selectedOption: null, textResponse: "", codeFeedback: "", answers: [], score: 0, complete: false, passed: false });
    const [certificate, setCertificate] = useState(null);
    const [assessmentStatus, setAssessmentStatus] = useState("");

    async function toggleWatched(lessonId, watched) {
        setWatchedLessons((currentLessons) => {
            const nextLessons = new Set(currentLessons);
            if (watched) nextLessons.add(String(lessonId));
            else nextLessons.delete(String(lessonId));
            localStorage.setItem(`learnlyProgress-${courseId}`, JSON.stringify([...nextLessons]));
            return nextLessons;
        });

        if (!userId) return;

        try {
            const response = await fetch(`${API_URL}/api/account/${userId}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId, lessonId, watched }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Unable to sync progress.");
            setWatchedLessons((currentLessons) => {
                const nextLessons = new Set(currentLessons);
                (data.progress || []).filter((item) => item.watched).forEach((item) => nextLessons.add(String(item.lessonId)));
                return nextLessons;
            });
        } catch (error) {
            setErrorMessage(`Progress saved on this device. ${error.message}`);
        }
    }

    useEffect(() => {
        let isMounted = true;

        async function loadCourseFromApi() {
            setLoading(true);
            setErrorMessage("");

            try {
                const response = await fetch(`${API_URL}/api/courses/${courseId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load course content from the backend.");
                }

                if (isMounted) {
                    const fallbackCourse = defaultCourses.find((item) => String(item.id) === courseId);
                    setCourse({
                        ...fallbackCourse,
                        ...data.course,
                        lessons: fallbackCourse?.lessons?.length ? fallbackCourse.lessons : data.course?.lessons || [],
                        finalQuiz: fallbackCourse?.finalQuiz || data.course?.finalQuiz || [],
                    });
                    const localProgress = JSON.parse(localStorage.getItem(`learnlyProgress-${courseId}`) || "[]");
                    setWatchedLessons(new Set(Array.isArray(localProgress) ? localProgress.map(String) : []));
                    if (userId) {
                        const accountResponse = await fetch(`${API_URL}/api/account/${userId}`);
                        const accountData = await accountResponse.json();
                        if (accountResponse.ok) {
                            setWatchedLessons((currentLessons) => new Set([
                                ...currentLessons,
                                ...(accountData.user?.progress || []).filter((item) => item.watched && String(item.courseId) === String(courseId)).map((item) => String(item.lessonId)),
                            ]));
                        }
                    }
                }
            } catch (error) {
                const fallbackCourse = defaultCourses.find((item) => String(item.id) === courseId) || null;
                if (isMounted) {
                    setCourse(fallbackCourse);
                    setErrorMessage(error.message || "Unable to fetch course content from the backend.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadCourseFromApi();

        return () => {
            isMounted = false;
        };
    }, [courseId, userId]);

    if (!course) {
        return (
            <main className="start-learning start-learning-empty">
                <p className="start-learning-eyebrow">COURSE NOT FOUND</p>
                <h1>That learning path is unavailable.</h1>
                <Link className="start-learning-button" to="/CoursesPage">Browse courses</Link>
            </main>
        );
    }

    const lessons = Array.isArray(course.lessons) && course.lessons.length > 0
        ? course.lessons
        : [{
            id: 1,
            title: "Course foundation",
            description: course.overview || "This course is ready to continue with the next lesson.",
            videoTitle: course.title,
            videoUrl: "",
            duration: course.durationLabel || "Lesson preview",
        }];
    const finalQuiz = Array.isArray(course.finalQuiz) ? buildFinalAssessment(course.finalQuiz, course.topic) : [];
    const completedLessons = lessons.length > 0 && lessons.every((lesson) => watchedLessons.has(String(lesson.id)));
    const currentQuizQuestion = finalQuiz[quizState.questionIndex];

    function beginFinalQuiz() {
        setQuizState({ active: true, questionIndex: 0, selectedOption: null, textResponse: "", codeFeedback: "", answers: [], score: 0, complete: false, passed: false });
        setCertificate(null);
        setAssessmentStatus("");
    }

    async function submitQuizAnswer() {
        if (!currentQuizQuestion) return;

        const requiresText = currentQuizQuestion.type === "fill" || currentQuizQuestion.type === "code";
        if ((!requiresText && quizState.selectedOption === null) || (requiresText && !quizState.textResponse.trim())) return;

        const isCorrect = currentQuizQuestion.type === "code"
            ? currentQuizQuestion.keywords.every((keyword) => quizState.textResponse.toLowerCase().includes(keyword.toLowerCase()))
            : currentQuizQuestion.type === "fill"
                ? quizState.textResponse.trim().toLowerCase() === currentQuizQuestion.expectedAnswer.toLowerCase()
                : quizState.selectedOption === currentQuizQuestion.answer;

        const nextScore = quizState.score + (isCorrect ? 1 : 0);
        const nextAnswers = [...quizState.answers, {
            question: currentQuizQuestion.question || currentQuizQuestion.prompt,
            type: currentQuizQuestion.type,
            selectedAnswer: currentQuizQuestion.type === "choice" || currentQuizQuestion.type === "scenario"
                ? currentQuizQuestion.options[quizState.selectedOption]
                : quizState.textResponse,
            correctAnswer: currentQuizQuestion.type === "code"
                ? "A solution containing the required function, inputs, return value, and constraints"
                : currentQuizQuestion.options?.[currentQuizQuestion.answer] || currentQuizQuestion.expectedAnswer,
            correct: isCorrect,
        }];
        if (quizState.questionIndex === finalQuiz.length - 1) {
            const percentage = Math.round((nextScore / finalQuiz.length) * 100);
            const passed = percentage >= FINAL_ASSESSMENT_PASS_PERCENT;
            const completion = { courseId: course.id, courseTitle: course.title, topic: course.topic, score: percentage, answers: nextAnswers, modules: course.modules || [], completedAt: new Date().toISOString() };
            if (userId) {
                try {
                    const response = await fetch(`${API_URL}/api/account/${userId}/assessment`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ courseId: course.id, score: percentage }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || "Unable to save assessment.");
                    setAssessmentStatus("Your assessment is included in your learning analytics.");
                } catch (error) {
                    setAssessmentStatus(`Assessment saved on this device. ${error.message}`);
                }
            }
            if (passed) {
                setCertificate(completion);
                const previousCertificates = (() => {
                    try {
                        const savedCertificates = JSON.parse(localStorage.getItem("learnlyCertificates") || "[]");
                        return Array.isArray(savedCertificates) ? savedCertificates : [];
                    } catch {
                        return [];
                    }
                })();
                localStorage.setItem("learnlyCertificates", JSON.stringify([
                    completion,
                    ...previousCertificates.filter((item) => String(item.courseId) !== String(course.id)),
                ]));
                window.dispatchEvent(new Event("learnly-course-completed"));
            }
            setQuizState({ ...quizState, score: nextScore, answers: nextAnswers, complete: true, passed });
            return;
        }

        setQuizState({ ...quizState, score: nextScore, answers: nextAnswers, questionIndex: quizState.questionIndex + 1, selectedOption: null, textResponse: "", codeFeedback: "" });
    }

    function runCodeCheck() {
        const passed = currentQuizQuestion?.keywords.every((keyword) => quizState.textResponse.toLowerCase().includes(keyword.toLowerCase()));
        setQuizState({ ...quizState, codeFeedback: passed ? "The solution contains the expected structure." : "Missing a required part. Read the task and try again." });
    }

    return (
        <main className="start-learning">
            <Link className="start-learning-back" to={`/Coursecontent/${course.id}`}>&lt;- Back to course overview</Link>
            <section className="start-learning-intro">
                <div>
                    <p className="start-learning-eyebrow">NOW LEARNING</p>
                    <h1>{course.title}</h1>
                    <p>{course.overview}</p>
                </div>
                <div className="start-learning-progress">
                    <span>01</span>
                    <div><i /></div>
                    <span>{String(course.modules?.length || lessons.length).padStart(2, "0")}</span>
                    <small>Learning path</small>
                </div>
            </section>

            <section className="start-learning-layout">
                <aside className="start-learning-sidebar">
                    <p className="start-learning-eyebrow">COURSE MODULES</p>
                    <ol>
                        {(course.modules || lessons.map((lesson) => lesson.title)).map((module, index) => (
                            <li className={index === 0 ? "is-current" : ""} key={`${module}-${index}`}>
                                <span>{String(index + 1).padStart(2, "0")}</span>{module}
                            </li>
                        ))}
                    </ol>
                </aside>

                <article className="start-learning-reading">
                    {loading && <p className="start-learning-status">Loading lesson content from the backend...</p>}
                    {!loading && errorMessage && <p className="start-learning-status start-learning-error">{errorMessage}</p>}

                    {lessons.map((lesson, index) => (
                        <div id={`lesson-${index + 1}`} key={lesson.id || `${lesson.title}-${index}`} style={{ marginBottom: 32, scrollMarginTop: 28 }}>
                            <p className="start-learning-eyebrow">LESSON {String(index + 1).padStart(2, "0")} / {lesson.duration || "CONTENT"}</p>
                            <h2>{lesson.title}</h2>
                            <p className="start-learning-extract">{lesson.description}</p>

                            {lesson.videoUrl && (
                                <div style={{ margin: "16px 0" }}>
                                    <iframe
                                        width="100%"
                                        height="320"
                                        src={toEmbedUrl(lesson.videoUrl)}
                                        title={lesson.videoTitle || lesson.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ borderRadius: 12 }}
                                    />
                                </div>
                            )}

                            {lesson.videoTitle && <p className="start-learning-source">VIDEO / {lesson.videoTitle}</p>}
                            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, color: "var(--muted)" }}>
                                <input
                                    type="checkbox"
                                    checked={watchedLessons.has(String(lesson.id))}
                                    onChange={(event) => toggleWatched(lesson.id, event.target.checked).catch((error) => setErrorMessage(error.message))}
                                />
                                Mark lesson as watched
                            </label>
                            {lesson.videoUrl && (
                                <a className="start-learning-link" href={lesson.videoUrl} target="_blank" rel="noreferrer">
                                    Open source video <span aria-hidden="true">-&gt;</span>
                                </a>
                            )}
                        </div>
                    ))}

                    {finalQuiz.length > 0 && (
                        <section className="final-assessment" aria-labelledby="final-assessment-title">
                            <p className="start-learning-eyebrow">FINAL ASSESSMENT</p>
                            <h2 id="final-assessment-title">Show what you can do.</h2>
                            {!completedLessons && !quizState.active && (
                                <p className="final-assessment-note">Mark all {lessons.length} lessons as watched to unlock the five-question course quiz. You must score at least {FINAL_ASSESSMENT_PASS_PERCENT}% to pass.</p>
                            )}
                            {completedLessons && !quizState.active && !quizState.complete && (
                                <button className="start-learning-button" type="button" onClick={beginFinalQuiz}>Start final quiz</button>
                            )}
                            {quizState.active && !quizState.complete && currentQuizQuestion && (
                                <div className="final-quiz-card">
                                    <div className="final-quiz-meta">QUESTION {quizState.questionIndex + 1} / {finalQuiz.length}</div>
                                    {currentQuizQuestion.type === "code" && (
                                        <div className="final-practical-question">
                                            <p className="final-question-type">PRACTICAL CODING TASK</p>
                                            <h3>{currentQuizQuestion.prompt}</h3>
                                            <textarea
                                                className="final-code-editor"
                                                value={quizState.textResponse || currentQuizQuestion.starterCode}
                                                onChange={(event) => setQuizState({ ...quizState, textResponse: event.target.value, codeFeedback: "" })}
                                                spellCheck="false"
                                                aria-label="Write your code solution"
                                            />
                                            <button className="code-check-button" type="button" onClick={runCodeCheck}>Run solution check</button>
                                            {quizState.codeFeedback && <p className={`code-check-result ${quizState.codeFeedback.startsWith("The solution") ? "is-success" : "is-warning"}`}>{quizState.codeFeedback}</p>}
                                        </div>
                                    )}
                                    {currentQuizQuestion.type === "fill" && (
                                        <label className="final-fill-question">
                                            <span className="final-question-type">FILL IN THE BLANK</span>
                                            <h3>{currentQuizQuestion.prompt}</h3>
                                            <input value={quizState.textResponse} onChange={(event) => setQuizState({ ...quizState, textResponse: event.target.value })} placeholder="Type your answer" />
                                        </label>
                                    )}
                                    {(currentQuizQuestion.type === "choice" || currentQuizQuestion.type === "scenario") && (
                                        <>
                                            {currentQuizQuestion.scenario && <p className="final-question-type">{currentQuizQuestion.scenario}</p>}
                                            <h3>{currentQuizQuestion.question}</h3>
                                            <div className="final-quiz-options" role="radiogroup" aria-label="Final quiz answers">
                                                {currentQuizQuestion.options.map((option, optionIndex) => (
                                                    <button
                                                        className={quizState.selectedOption === optionIndex ? "is-selected" : ""}
                                                        key={option}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={quizState.selectedOption === optionIndex}
                                                        onClick={() => setQuizState({ ...quizState, selectedOption: optionIndex })}
                                                    >
                                                        <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <button className="start-learning-button" type="button" disabled={(currentQuizQuestion.type === "choice" || currentQuizQuestion.type === "scenario") ? quizState.selectedOption === null : !quizState.textResponse.trim()} onClick={submitQuizAnswer}>
                                        {quizState.questionIndex === finalQuiz.length - 1 ? "Submit assessment" : "Next question"}
                                    </button>
                                </div>
                            )}
                            {quizState.complete && (
                                <div className={`final-quiz-result ${quizState.passed ? "is-passed" : "is-failed"}`}>
                                    <h3>{quizState.passed ? "Course completed." : "Almost there."}</h3>
                                    <p>You scored {Math.round((quizState.score / finalQuiz.length) * 100)}%. {quizState.passed ? "Your certificate is ready to download." : `You need at least ${FINAL_ASSESSMENT_PASS_PERCENT}% to pass the final exam. Review the missed topics and try again.`}</p>
                                    {assessmentStatus && <p className="assessment-status">{assessmentStatus}</p>}
                                    {quizState.passed ? (
                                        <button className="start-learning-button" type="button" onClick={() => downloadCertificate(course, storedUser?.name || "Learnly learner", certificate.score)}>
                                            Download certificate
                                        </button>
                                    ) : (
                                        <button className="start-learning-button" type="button" onClick={beginFinalQuiz}>Try again</button>
                                    )}
                                </div>
                            )}
                        </section>
                    )}
                </article>
            </section>
        </main>
    );
}

export default StartLearning;