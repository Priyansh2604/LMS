import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultCourses } from "./courseData";
import "./StartLearning.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

function StartLearning() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(() => defaultCourses.find((item) => String(item.id) === courseId) || null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [watchedLessons, setWatchedLessons] = useState(() => new Set());
    const storedUser = JSON.parse(localStorage.getItem("learnlyUser") || "null");
    const userId = storedUser?.id;

    async function toggleWatched(lessonId, watched) {
        if (!userId) return;

        const response = await fetch(`${API_URL}/api/account/${userId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, lessonId, watched }),
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Unable to save progress.");
        setWatchedLessons(new Set((data.progress || []).filter((item) => item.watched).map((item) => String(item.lessonId))));
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
                    setCourse(data.course || null);
                    const accountResponse = await fetch(`${API_URL}/api/account/${userId}`);
                    const accountData = await accountResponse.json();
                    if (accountResponse.ok) {
                        setWatchedLessons(new Set((accountData.user?.progress || []).filter((item) => item.watched && String(item.courseId) === String(courseId)).map((item) => String(item.lessonId))));
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

                    {!loading && lessons.map((lesson, index) => (
                        <div key={lesson.id || `${lesson.title}-${index}`} style={{ marginBottom: 32 }}>
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
                </article>
            </section>
        </main>
    );
}

export default StartLearning;