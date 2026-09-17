import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Chart, registerables } from "chart.js";
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

function getLevel(percentage) {
    if (percentage >= 80) return "Advanced foundation";
    if (percentage >= 60) return "Growing practitioner";
    return "Starting point";
}

function SkillPassport() {
    const result = getResult();
    const chartCanvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const topicResults = useMemo(() => Object.entries(result?.topicScores || {}).map(([topic, score]) => ({
        topic,
        percentage: Math.round((score.correct / score.total) * 100),
    })), [result]);
    const skillGroups = useMemo(() => ({
        strong: topicResults.filter(({ percentage }) => percentage >= 80),
        developing: topicResults.filter(({ percentage }) => percentage >= 60 && percentage < 80),
        needsDevelopment: topicResults.filter(({ percentage }) => percentage < 60),
    }), [topicResults]);

    useEffect(() => {
        if (!chartCanvasRef.current || topicResults.length === 0) return undefined;

        chartInstanceRef.current?.destroy();
        chartInstanceRef.current = new Chart(chartCanvasRef.current, {
            type: "bar",
            data: {
                labels: topicResults.map(({ topic }) => topic),
                datasets: [{
                    label: "Skill score",
                    data: topicResults.map(({ percentage }) => percentage),
                    backgroundColor: topicResults.map(({ percentage }) => (
                        percentage >= 80 ? "#d6f36b" : percentage >= 60 ? "#7dd3fc" : "#ff9b8f"
                    )),
                    borderRadius: 5,
                    borderSkipped: false,
                    barThickness: 24,
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
                    tooltip: { callbacks: { label: (context) => ` ${context.raw}%` } },
                },
            },
        });

        return () => {
            chartInstanceRef.current?.destroy();
            chartInstanceRef.current = null;
        };
    }, [topicResults]);

    const roadmap = useMemo(() => {
        if (!result) return [];
        const primaryTopic = result.topic === "Mixed topics"
            ? Object.entries(result.topicScores || {}).sort(([, first], [, second]) => (second.correct / second.total) - (first.correct / first.total))[0]?.[0]
            : result.topic;
        const topics = [primaryTopic, ...(roadmapTopics[primaryTopic] || [])].filter(Boolean);
        return [...new Set(topics)].slice(0, 4).map((topic, index) => ({
            topic,
            step: index + 1,
            course: defaultCourses.find((course) => course.topic === topic),
        }));
    }, [result]);

    if (!result) {
        return (
            <main className="passport-page passport-empty">
                <p className="passport-eyebrow">SKILL PASSPORT</p>
                <h1>Your learning profile starts with a quiz.</h1>
                <p>Take a topic quiz to reveal your strengths and generate a practical roadmap for the next level.</p>
                <Link className="passport-button" to="/QuizPage">Take the quiz <span aria-hidden="true">-&gt;</span></Link>
            </main>
        );
    }

    const strongestTopic = [...topicResults].sort((first, second) => second.percentage - first.percentage)[0]?.topic || result.topic;
    const focusTopic = [...topicResults].sort((first, second) => first.percentage - second.percentage)[0]?.topic || result.topic;

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
                    <p>Built from your {result.topic} quiz, this profile turns one result into a focused progression plan.</p>
                </div>
                <div className="passport-score">
                    <strong>{result.percentage}%</strong>
                    <span>{getLevel(result.percentage)}</span>
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

            <section className="passport-section">
                <div className="passport-section-heading">
                    <div>
                        <p className="passport-eyebrow">YOUR ROADMAP</p>
                        <h2>From foundation to fluency.</h2>
                    </div>
                    <Link to="/CoursesPage">Browse all courses <span aria-hidden="true">-&gt;</span></Link>
                </div>
                <div className="passport-roadmap">
                    {roadmap.map(({ topic, step, course }) => (
                        <article className="roadmap-step" key={topic}>
                            <span className="roadmap-number">0{step}</span>
                            <div>
                                <p className="roadmap-topic">{topic}</p>
                                <h3>{course?.title || `${topic} pathway`}</h3>
                                <p>{course?.description || `Build practical ${topic} capability through guided projects and deliberate practice.`}</p>
                                {course ? <Link to={`/Coursecontent/${course.id}`}>View pathway <span aria-hidden="true">-&gt;</span></Link> : null}
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
                    <div className="passport-chart-wrap"><canvas ref={chartCanvasRef} aria-label="Radar chart showing skill scores" /></div>
                    <div className="skill-groups">
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
