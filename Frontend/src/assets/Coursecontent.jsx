import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { defaultCourses } from "./courseData";
import "./Coursecontent.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function Coursecontent() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(() => defaultCourses.find((item) => String(item.id) === courseId) || null);
    const [statusText, setStatusText] = useState("");
    const navigate = useNavigate();
    const [wikiState, setWikiState] = useState({ status: "loading", article: null, message: "", title: "" });
    const readingRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function loadCourse() {
            try {
                const response = await fetch(`${API_URL}/api/courses/${courseId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Course data unavailable from the API.");
                }

                if (isMounted) {
                    setCourse(data.course || null);
                    setStatusText("");
                }
            } catch (error) {
                const fallbackCourse = defaultCourses.find((item) => String(item.id) === courseId) || null;

                if (isMounted) {
                    setCourse(fallbackCourse);
                    setStatusText(error.message || "Unable to fetch the course from the backend.");
                }
            }
        }

        loadCourse();

        return () => {
            isMounted = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!course) return undefined;

        const controller = new AbortController();
        const articleTitle = encodeURIComponent(course.wikimediaTitle);

        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${articleTitle}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.title || "Wikimedia content is unavailable right now.");
                return result;
            })
            .then((article) => setWikiState({ status: "success", article, message: "", title: course.wikimediaTitle }))
            .catch((error) => {
                if (error.name !== "AbortError") {
                    setWikiState({ status: "error", article: null, message: error.message, title: course.wikimediaTitle });
                }
            });

        return () => controller.abort();
    }, [course]);

    if (!course) {
        return (
            <main className="course-details course-details-empty">
                <p className="course-details-eyebrow">COURSE NOT FOUND</p>
                {statusText && <p className="course-details-description" style={{ color: "#fca5a5" }}>{statusText}</p>}
                <h1>That course is not available.</h1>
                <Link className="course-details-button" to="/CoursesPage">Browse all courses</Link>
            </main>
        );
    }

    return (
        <main className="course-details">
            <section className="course-details-hero">
                <div className="course-details-copy">
                    <Link className="course-back-link" to="/CoursesPage">Back to courses</Link>
                    {statusText && <p className="course-details-description" style={{ color: "#fca5a5", marginBottom: 12 }}>{statusText}</p>}
                    <p className="course-details-eyebrow">{course.topic}</p>
                    <h1>{course.title}</h1>
                    <p className="course-details-description">{course.overview}</p>
                    <div className="course-details-meta">
                        <span><strong>{course.durationLabel}</strong> total learning</span>
                        <span><strong>{course.level}</strong> level</span>
                        <span><strong>{course.instructor}</strong> instructor</span>
                    </div>
                    <button
                        className="course-details-button"
                        type="button"
                        onClick={() => navigate(`/StartLearning/${course.id}`)}
                    >
                        Start learning
                    </button>
                </div>
                <img className="course-details-image" src={course.image} alt={course.alt} />
            </section>

            <section className="course-details-grid">
                <div className="course-details-panel">
                    <p className="course-details-eyebrow">WHAT YOU WILL LEARN</p>
                    <h2>Build practical skills you can use.</h2>
                    <ul className="course-outcomes">
                        {course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
                    </ul>
                </div>
                <div className="course-details-panel course-syllabus">
                    <p className="course-details-eyebrow">COURSE CONTENT</p>
                    <h2>Your learning path</h2>
                    <ol>
                        {course.modules.map((module, index) => (
                            <li key={module}><span>{String(index + 1).padStart(2, "0")}</span>{module}</li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="course-reading" ref={readingRef} aria-labelledby="course-reading-title">
                <div className="course-reading-heading">
                    <div>
                        <p className="course-details-eyebrow">WIKIMEDIA READING</p>
                        <h2 id="course-reading-title">Build your foundation.</h2>
                    </div>
                    <p>Start with a trusted overview, then continue through the course modules above.</p>
                </div>
                {(wikiState.status === "loading" || wikiState.title !== course.wikimediaTitle) && <p className="course-reading-status">Loading the course reading...</p>}
                {wikiState.status === "error" && wikiState.title === course.wikimediaTitle && <p className="course-reading-status course-reading-error">{wikiState.message}</p>}
                {wikiState.status === "success" && wikiState.title === course.wikimediaTitle && (
                    <article className="wiki-card">
                        {wikiState.article.thumbnail?.source && (
                            <img src={wikiState.article.thumbnail.source} alt="" />
                        )}
                        <div>
                            <p className="wiki-card-label">WIKIMEDIA REST API</p>
                            <h3>{wikiState.article.title}</h3>
                            <p>{wikiState.article.extract}</p>
                            <a href={wikiState.article.content_urls.desktop.page} target="_blank" rel="noreferrer">
                                Read the full article <span aria-hidden="true">-&gt;</span>
                            </a>
                        </div>
                    </article>
                )}
            </section>
        </main>
    );
}
export default Coursecontent;