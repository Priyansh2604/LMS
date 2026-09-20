import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import { jsPDF } from "jspdf";
import { defaultCourses } from "./courseData";
import "./SkillPassport.css";

Chart.register(...registerables);

const roadmapTopics = {
    "AI & Machine Learning": ["Data Analytics", "Development", "Cloud & DevOps"],
    Cybersecurity: ["Development", "Cloud & DevOps", "AI & Machine Learning"],
    "Data Analytics": ["AI & Machine Learning", "Development", "Cloud & DevOps"],
    IoT: ["Development", "Cloud & DevOps", "Cybersecurity"],
    Development: ["Data Analytics", "Cloud & DevOps", "Cybersecurity"],
    "Cloud & DevOps": ["Development", "Cybersecurity", "AI & Machine Learning"],
};

function getResult() {
    try {
        return JSON.parse(localStorage.getItem("learnlySkillPassport")) || null;
    } catch {
        return null;
    }
}

function getCertificates() {
    try {
        const certificates = JSON.parse(localStorage.getItem("learnlyCertificates") || "[]");
        return Array.isArray(certificates) ? certificates : [];
    } catch {
        return [];
    }
}

function getLevel(percentage) {
    if (percentage >= 80) return "Advanced foundation";
    if (percentage >= 60) return "Growing practitioner";
    return "Starting point";
}

function getRecommendation(percentage, focusTopic) {
    if (percentage >= 80) return `Apply your ${focusTopic} knowledge in a practical project, then explore an advanced course.`;
    if (percentage >= 60) return `Strengthen ${focusTopic} with two focused practice sessions and a small guided project.`;
    return `Revisit the ${focusTopic} fundamentals, review the missed questions, and retake the check after practising.`;
}

function SkillPassport() {
    const [searchParams] = useSearchParams();
    const result = useMemo(() => getResult(), []);
    const certificates = useMemo(() => getCertificates(), []);
    const selectedCourseId = searchParams.get("courseId");
    const selectedCertificate = useMemo(() => certificates.find((certificate) => String(certificate.courseId) === String(selectedCourseId)), [certificates, selectedCourseId]);
    const selectedCourse = useMemo(() => defaultCourses.find((course) => String(course.id) === String(selectedCourseId)), [selectedCourseId]);
    const report = selectedCertificate || result;
    const topicChartCanvasRef = useRef(null);
    const distributionChartCanvasRef = useRef(null);
    const chartInstancesRef = useRef([]);
    const answers = useMemo(() => (Array.isArray(report?.answers) ? report.answers : []), [report]);
    const missedAnswers = useMemo(() => answers.filter((answer) => !answer.correct), [answers]);
    const topicResults = useMemo(() => selectedCertificate
        ? (answers.length > 0
            ? answers.map((answer, index) => ({ topic: `Q${index + 1}`, percentage: answer.correct ? 100 : 0 }))
            : [{ topic: selectedCertificate.topic || selectedCourse?.topic || selectedCertificate.courseTitle, percentage: selectedCertificate.score }])
        : Object.entries(result?.topicScores || {}).map(([topic, score]) => ({
            topic,
            percentage: Math.round((score.correct / score.total) * 100),
        })), [answers, result, selectedCertificate, selectedCourse]);
    const skillGroups = useMemo(() => ({
        strong: topicResults.filter(({ percentage }) => percentage >= 80),
        developing: topicResults.filter(({ percentage }) => percentage >= 60 && percentage < 80),
        needsDevelopment: topicResults.filter(({ percentage }) => percentage < 60),
    }), [topicResults]);

    useEffect(() => {
        if (!topicChartCanvasRef.current || topicResults.length === 0) return undefined;

        chartInstancesRef.current.forEach((chart) => chart.destroy());
        chartInstancesRef.current = [];
        const answerTotal = answers.length || 5;
        const answerCorrect = answers.length
            ? answers.length - missedAnswers.length
            : Math.round(((selectedCertificate?.score ?? result?.percentage ?? 0) / 100) * answerTotal);
        const answerReview = Math.max(0, answerTotal - answerCorrect);
        chartInstancesRef.current.push(new Chart(topicChartCanvasRef.current, {
            type: "bar",
            data: {
                labels: topicResults.map(({ topic }) => topic),
                datasets: [{
                    label: selectedCertificate ? "Question result" : "Skill score",
                    data: topicResults.map(({ percentage }) => percentage),
                    backgroundColor: topicResults.map(({ percentage }) => (
                        percentage >= 80 ? "#d6f36b" : percentage >= 60 ? "#7dd3fc" : "#ff9b8f"
                    )),
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 28,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: "#94a3b8", callback: (value) => `${value}%` },
                        grid: { color: "rgba(148, 163, 184, 0.2)" },
                    },
                    y: {
                        ticks: { color: "#cbd5e1", font: { size: 12, weight: "600" } },
                        grid: { display: false },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => selectedCertificate ? ` ${context.raw === 100 ? "Correct" : "Review needed"}` : ` Mastery: ${context.raw}%` } },
                },
            },
        }));

        if (distributionChartCanvasRef.current) {
            chartInstancesRef.current.push(new Chart(distributionChartCanvasRef.current, {
                type: "pie",
                data: {
                    labels: ["Correct", "Review needed"],
                    datasets: [{
                        data: [answerCorrect, answerReview],
                        backgroundColor: ["#d6f36b", "#ff9b8f"],
                        borderColor: "#172019",
                        borderWidth: 5,
                        hoverOffset: 8,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "58%",
                    plugins: {
                        legend: { position: "bottom", labels: { color: "#cbd5e1", padding: 18, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                    const percentage = total ? Math.round((context.raw / total) * 100) : 0;
                                    return ` ${context.label}: ${context.raw} (${percentage}%)`;
                                },
                            },
                        },
                    },
                },
            }));
        }

        return () => {
            chartInstancesRef.current.forEach((chart) => chart.destroy());
            chartInstancesRef.current = [];
        };
    }, [answers, missedAnswers.length, result, selectedCertificate, topicResults]);

    const roadmap = useMemo(() => {
        if (!report) return [];
        const primaryTopic = selectedCertificate?.topic || (report.topic === "Mixed topics"
            ? Object.entries(report.topicScores || {}).sort(([, first], [, second]) => (second.correct / second.total) - (first.correct / first.total))[0]?.[0]
            : report.topic);
        const topics = [primaryTopic, ...(roadmapTopics[primaryTopic] || [])].filter(Boolean);
        return [...new Set(topics)].slice(0, 4).map((topic, index) => ({
            topic,
            step: index + 1,
            course: defaultCourses.find((course) => course.topic === topic),
        }));
    }, [report, selectedCertificate]);

    if (!report) {
        return (
            <main className="passport-page passport-empty">
                <p className="passport-eyebrow">SKILL PASSPORT</p>
                <h1>Your learning profile starts with a quiz.</h1>
                <p>Take a topic quiz to reveal your strengths and generate a practical roadmap for the next level.</p>
                <Link className="passport-button" to="/QuizPage">Take the quiz <span aria-hidden="true">-&gt;</span></Link>
            </main>
        );
    }

    const strongestTopic = [...topicResults].sort((first, second) => second.percentage - first.percentage)[0]?.topic || report.topic;
    const focusTopic = [...topicResults].sort((first, second) => first.percentage - second.percentage)[0]?.topic || report.topic;
    const reportScore = report.score ?? report.percentage;
    const reportTitle = selectedCertificate?.courseTitle || "Skill Passport";
    const reportTopic = selectedCertificate?.topic || report.topic;

    function downloadReportPdf() {
        const pdf = new jsPDF({ unit: "mm", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 18;
        let y = 20;

        pdf.setFillColor(23, 32, 25);
        pdf.rect(0, 0, pageWidth, 38, "F");
        pdf.setTextColor(214, 243, 107);
        pdf.setFontSize(10);
        pdf.text("LEARNLY / STUDENT PERFORMANCE REPORT", margin, 15);
        pdf.setTextColor(244, 247, 239);
        pdf.setFontSize(22);
        pdf.text("Skill Passport", margin, 29);
        y = 52;
        pdf.setTextColor(23, 32, 25);
        pdf.setFontSize(15);
        pdf.text(`${reportTitle} assessment`, margin, y);
        pdf.setFontSize(10);
        pdf.setTextColor(96, 105, 97);
        pdf.text(`Completed ${new Date(report.completedAt || report.createdAt).toLocaleDateString()} | ${getLevel(reportScore)}`, margin, y + 8);
        pdf.setTextColor(23, 32, 25);
        pdf.setFontSize(28);
        pdf.text(`${reportScore}%`, pageWidth - margin - 25, y + 4);
        y += 25;

        pdf.setFontSize(11);
        pdf.text("Recommendation", margin, y);
        pdf.setFontSize(10);
        pdf.setTextColor(96, 105, 97);
        const recommendationLines = pdf.splitTextToSize(getRecommendation(reportScore, focusTopic), pageWidth - margin * 2);
        pdf.text(recommendationLines, margin, y + 7);
        y += 18 + recommendationLines.length * 5;

        const chartWidth = (pageWidth - margin * 2 - 8) / 2;
        if (topicChartCanvasRef.current) {
            pdf.addImage(topicChartCanvasRef.current.toDataURL("image/png"), "PNG", margin, y, chartWidth, 62);
        }
        if (distributionChartCanvasRef.current) {
            pdf.addImage(distributionChartCanvasRef.current.toDataURL("image/png"), "PNG", margin + chartWidth + 8, y, chartWidth, 62);
        }
        y += 74;
        pdf.setTextColor(23, 32, 25);
        pdf.setFontSize(12);
        pdf.text("Answer review", margin, y);
        y += 8;
        answers.forEach((answer, index) => {
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }
            pdf.setFontSize(9);
            pdf.setTextColor(answer.correct ? 61 : 180, answer.correct ? 125 : 82, answer.correct ? 93 : 72);
            pdf.text(`${String(index + 1).padStart(2, "0")}  ${answer.correct ? "CORRECT" : "REVIEW"}`, margin, y);
            pdf.setTextColor(23, 32, 25);
            const questionLines = pdf.splitTextToSize(answer.question, pageWidth - margin * 2 - 26);
            pdf.text(questionLines, margin + 26, y);
            y += questionLines.length * 4.5 + 5;
        });

        pdf.save(`learnly-${reportTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.pdf`);
    }

    function renderSkillList(items, emptyMessage) {
        return items.length > 0 ? (
            <ul className="skill-list">
                {items.map(({ topic, percentage }) => <li key={topic}><span>{topic}</span><strong>{percentage}%</strong></li>)}
            </ul>
        ) : <p className="skill-list-empty">{emptyMessage}</p>;
    }

    return (
        <main className="passport-page">
            <section className="passport-hero">
                <div>
                    <p className="passport-eyebrow">LEARNLY SKILL PASSPORT</p>
                    <h1>Your next level has a shape.</h1>
                    <p>{selectedCertificate ? `Individual report for ${reportTitle}, based on its lessons and final assessment.` : `Built from your ${report.topic} quiz, this profile turns one result into a focused progression plan.`}</p>
                </div>
                <div className="passport-score">
                    <strong>{reportScore}%</strong>
                    <span>{getLevel(reportScore)}</span>
                </div>
            </section>

            <section className="passport-summary">
                <div className="passport-panel passport-strength">
                    <p className="passport-eyebrow">CURRENT SIGNAL</p>
                    <h2>{strongestTopic}</h2>
                    <p>Your strongest signal from this check. Keep it active by applying it in a project.</p>
                </div>
                <div className="passport-panel passport-focus">
                    <p className="passport-eyebrow">NEXT SKILL TO LIFT</p>
                    <h2>{focusTopic}</h2>
                    <p>Start here to close the biggest gap surfaced by your answers.</p>
                </div>
            </section>

            <section className="passport-section passport-report" aria-labelledby="student-report-title">
                <div className="passport-section-heading">
                    <div>
                        <p className="passport-eyebrow">{selectedCertificate ? "COURSE COMPLETION REPORT" : "GENERATED STUDENT REPORT"}</p>
                        <h2 id="student-report-title">{selectedCertificate ? `${reportTitle} performance report` : "Your performance, explained."}</h2>
                    </div>
                    <div className="report-heading-actions">
                        <span className="report-timestamp">Completed {new Date(report.completedAt || report.createdAt).toLocaleDateString()}</span>
                        <button className="report-download-button" type="button" onClick={downloadReportPdf}>Download PDF</button>
                    </div>
                </div>
                <div className="report-grid">
                    <div className="report-recommendation">
                        <p className="passport-eyebrow">RECOMMENDED NEXT STEP</p>
                        <h3>{getRecommendation(reportScore, focusTopic)}</h3>
                        <p>{selectedCertificate ? `${reportTitle} was assessed against its own course content and final practical check.` : `${answers.length} of ${report.total || answers.length} questions were answered.`}</p>
                    </div>
                    <div className="report-stat-list">
                        <div><span>{selectedCertificate ? "Course score" : "Overall score"}</span><strong>{reportScore}%</strong></div>
                        <div><span>Strongest area</span><strong>{strongestTopic}</strong></div>
                        <div><span>{selectedCertificate ? "Course topic" : "Priority area"}</span><strong>{selectedCertificate ? reportTopic : focusTopic}</strong></div>
                        <div><span>Questions to revisit</span><strong>{missedAnswers.length}</strong></div>
                    </div>
                </div>
                {answers.length > 0 && (
                    <div className="answer-review">
                        <p className="passport-eyebrow">{selectedCertificate ? "COURSE ANSWER REVIEW" : "ANSWER REVIEW"}</p>
                        {answers.map((answer, index) => (
                            <article className={`answer-review-row ${answer.correct ? "is-correct" : "is-missed"}`} key={`${answer.question}-${index}`}>
                                <span className="answer-index">{String(index + 1).padStart(2, "0")}</span>
                                <div>
                                    <strong>{answer.question}</strong>
                                    <span className="answer-type">{answer.type || "assessment"}</span>
                                    <span>Your answer: {answer.selectedAnswer}</span>
                                    {!answer.correct && <span>Review: {answer.correctAnswer}</span>}
                                </div>
                                <b>{answer.correct ? "Correct" : "Review"}</b>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="passport-section">
                <div className="passport-section-heading">
                    <div>
                        <p className="passport-eyebrow">{selectedCertificate ? "COURSE CONTENT COVERAGE" : "YOUR ROADMAP"}</p>
                        <h2>{selectedCertificate ? `${reportTitle} learning path` : "From foundation to fluency."}</h2>
                    </div>
                    <Link to={selectedCertificate ? `/StartLearning/${selectedCertificate.courseId}` : "/CoursesPage"}>{selectedCertificate ? "Review course" : "Browse all courses"} <span aria-hidden="true">-&gt;</span></Link>
                </div>
                <div className="passport-roadmap">
                    {(selectedCertificate && selectedCourse ? selectedCourse.modules.map((module, index) => ({
                        topic: selectedCourse.topic,
                        step: index + 1,
                        course: selectedCourse,
                        module,
                    })) : roadmap).map(({ topic, step, course, module }) => (
                        <article className="roadmap-step" key={`${topic}-${module || step}`}>
                            <span className="roadmap-number">0{step}</span>
                            <div>
                                <p className="roadmap-topic">{topic}</p>
                                <h3>{module || course?.title || `${topic} pathway`}</h3>
                                <p>{module ? `Course module from ${reportTitle}. Review this area alongside your assessment answers.` : course?.description || `Build practical ${topic} capability through guided projects and deliberate practice.`}</p>
                                {!selectedCertificate && course ? <Link to={`/Coursecontent/${course.id}`}>View pathway <span aria-hidden="true">-&gt;</span></Link> : null}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="passport-section passport-breakdown">
                <div className="passport-section-heading">
                    <div>
                        <p className="passport-eyebrow">QUIZ BREAKDOWN</p>
                        <h2>What your answers say.</h2>
                    </div>
                </div>
                <div className="passport-score-layout">
                    <div className="passport-chart-wrap">
                        <div className="chart-caption"><span>{selectedCertificate ? "ASSESSMENT PERFORMANCE" : "TOPIC MASTERY"}</span><strong>{selectedCertificate ? "Result by question" : "Score by skill area"}</strong></div>
                        <canvas ref={topicChartCanvasRef} aria-label="Bar chart showing skill scores by topic" />
                    </div>
                    <div className="skill-groups">
                        <div className="passport-distribution-wrap">
                            <div className="chart-caption"><span>ANSWER QUALITY</span><strong>Correct versus review</strong></div>
                            <div className="passport-distribution-chart"><canvas ref={distributionChartCanvasRef} aria-label="Doughnut chart showing correct and review-needed answers" /></div>
                        </div>
                        <article className="skill-group skill-group-strong"><p className="passport-eyebrow">STRONG TOPICS</p>{renderSkillList(skillGroups.strong, "No topic has reached the strong range yet.")}</article>
                        <article className="skill-group skill-group-developing"><p className="passport-eyebrow">DEVELOPING TOPICS</p>{renderSkillList(skillGroups.developing, "No topics are currently in the developing range.")}</article>
                        <article className="skill-group skill-group-needs"><p className="passport-eyebrow">NEEDS DEVELOPMENT</p>{renderSkillList(skillGroups.needsDevelopment, "No immediate development gaps found.")}</article>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default SkillPassport;
