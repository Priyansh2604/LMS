import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Account.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("learnlyUser")) || null;
    } catch {
        return null;
    }
}

function Account() {
    const sessionUser = getStoredUser();
    const [account, setAccount] = useState(null);
    const [watchedCourses, setWatchedCourses] = useState([]);
    const [status, setStatus] = useState({ loading: true, message: "" });

    useEffect(() => {
        if (!sessionUser?.id) return;

        fetch(`${API_URL}/api/account/${sessionUser.id}`)
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Unable to load your account.");
                return data;
            })
            .then((data) => {
                setAccount(data.user);
                setWatchedCourses(data.watchedCourses || []);
                setStatus({ loading: false, message: "" });
            })
            .catch((error) => setStatus({ loading: false, message: error.message }));
    }, [sessionUser?.id]);

    if (!sessionUser?.id) {
        return <main className="account-page"><p className="account-status account-error">Your account session is unavailable.</p></main>;
    }

    if (status.loading) {
        return <main className="account-page"><p className="account-status">Loading your account...</p></main>;
    }

    if (status.message) {
        return <main className="account-page"><p className="account-status account-error">{status.message}</p></main>;
    }

    return (
        <main className="account-page">
            <section className="account-header">
                <div>
                    <p className="account-eyebrow">YOUR LEARNLY ACCOUNT</p>
                    <h1>{account.name}</h1>
                    <p className="account-subtitle">{account.role === "instructor" ? "Instructor" : "Learner"} account</p>
                </div>
                <span className="account-avatar-large">{account.name.trim().charAt(0).toUpperCase()}</span>
            </section>

            <section className="account-grid">
                <div className="account-panel">
                    <p className="account-eyebrow">ACCOUNT DETAILS</p>
                    <dl className="account-details">
                        <div><dt>Email</dt><dd>{account.email}</dd></div>
                        <div><dt>Learning path</dt><dd>{account.courseInterest}</dd></div>
                        <div><dt>Location</dt><dd>{account.city}, {account.location}</dd></div>
                    </dl>
                </div>
                <div className="account-panel">
                    <p className="account-eyebrow">WATCH HISTORY</p>
                    {watchedCourses.length === 0 ? (
                        <p className="account-muted">No lessons marked as watched yet. Start a course to build your history.</p>
                    ) : (
                        <div className="account-history">
                            {watchedCourses.map((item) => (
                                <Link className="account-history-item" to={`/StartLearning/${item.courseId}`} key={`${item.courseId}-${item.lessonId}`}>
                                    <span>{item.courseTitle}</span>
                                    <strong>{item.lessonTitle}</strong>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <Link className="account-passport-link" to="/SkillPassport">Open Skill Passport <span aria-hidden="true">-&gt;</span></Link>
        </main>
    );
}

export default Account;
