import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Account.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const emptyCertificate = { title: "", issuer: "", issueDate: "", credentialUrl: "", credentialId: "", skills: "", imageData: "" };

function getStoredUser() {
    try {
        const savedUser = localStorage.getItem("learnlyUser");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        return parsedUser && typeof parsedUser === "object" ? parsedUser : null;
    } catch {
        return null;
    }
}

function Account() {
    const sessionUser = getStoredUser();
    const [account, setAccount] = useState(null);
    const [watchedCourses, setWatchedCourses] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [certificateForm, setCertificateForm] = useState(emptyCertificate);
    const [certificateStatus, setCertificateStatus] = useState({ loading: false, message: "", error: false });
    const [status, setStatus] = useState({ loading: true, message: "" });

    useEffect(() => {
        if (!sessionUser?.id) return;
        let cancelled = false;

        async function loadAccount() {
            try {
                const response = await fetch(`${API_URL}/api/account/${sessionUser.id}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Unable to load your account.");
                if (cancelled) return;
                setAccount(data.user);
                setWatchedCourses(data.watchedCourses || []);
                setCertificates(data.certificates || []);
                setCompletedCourses(data.completedCourses || []);
                setRecommendations(data.recommendations || []);
                setStatus({ loading: false, message: "" });
            } catch (error) {
                if (!cancelled) setStatus({ loading: false, message: error.message });
            }
        }

        loadAccount();
        return () => { cancelled = true; };
    }, [sessionUser?.id]);

    function updateCertificateField(event) {
        const { name, value } = event.target;
        setCertificateForm((current) => ({ ...current, [name]: value }));
        setCertificateStatus({ loading: false, message: "", error: false });
    }

    function selectCertificateImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
            setCertificateStatus({ loading: false, message: "Choose a PNG, JPG, or WebP image under 3 MB.", error: true });
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setCertificateForm((current) => ({ ...current, imageData: String(reader.result || "") }));
        reader.readAsDataURL(file);
    }

    async function addCertificate(event) {
        event.preventDefault();
        setCertificateStatus({ loading: true, message: "", error: false });
        try {
            const response = await fetch(`${API_URL}/api/account/${sessionUser.id}/certificates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(certificateForm),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to add certificate.");
            setCertificates(data.certificates || []);
            setCertificateForm(emptyCertificate);
            setCertificateStatus({ loading: false, message: "Certificate added to your account.", error: false });
        } catch (error) {
            setCertificateStatus({ loading: false, message: error.message, error: true });
        }
    }

    async function removeCertificate(certificateId) {
        if (!window.confirm("Remove this certificate from your account?")) return;
        try {
            const response = await fetch(`${API_URL}/api/account/${sessionUser.id}/certificates/${certificateId}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to remove certificate.");
            setCertificates(data.certificates || []);
        } catch (error) {
            setCertificateStatus({ loading: false, message: error.message, error: true });
        }
    }

    if (!sessionUser?.id) return <main className="account-page"><p className="account-status account-error">Your account session is unavailable.</p></main>;
    if (status.loading) return <main className="account-page"><p className="account-status">Loading your account...</p></main>;
    if (status.message) return <main className="account-page"><p className="account-status account-error">{status.message}</p></main>;

    return (
        <main className="account-page">
            <section className="account-header">
                <div><p className="account-eyebrow">YOUR LEARNLY ACCOUNT</p><h1>{account.name}</h1><p className="account-subtitle">{account.role === "instructor" ? "Instructor" : "Learner"} account</p></div>
                <span className="account-avatar-large">{account.name.trim().charAt(0).toUpperCase()}</span>
            </section>
            <section className="account-grid">
                <div className="account-panel"><p className="account-eyebrow">ACCOUNT DETAILS</p><dl className="account-details"><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>Learning path</dt><dd>{account.courseInterest}</dd></div><div><dt>Location</dt><dd>{account.city}, {account.location}</dd></div></dl></div>
                <div className="account-panel"><p className="account-eyebrow">WATCH HISTORY</p>{watchedCourses.length === 0 ? <p className="account-muted">No lessons marked as watched yet. Start a course to build your history.</p> : <div className="account-history">{watchedCourses.map((item) => <Link className="account-history-item" to={`/StartLearning/${item.courseId}`} key={`${item.courseId}-${item.lessonId}`}><span>{item.courseTitle}</span><strong>{item.lessonTitle}</strong></Link>)}</div>}</div>
            </section>
            <section className="account-section">
                <div className="account-section-heading"><div><p className="account-eyebrow">YOUR CERTIFICATE LIBRARY</p><h2>Keep every achievement in one place.</h2></div><span className="account-count">{certificates.length} certificate{certificates.length === 1 ? "" : "s"}</span></div>
                <div className="certificate-layout">
                    <form className="account-panel certificate-form" onSubmit={addCertificate}>
                        <p className="account-eyebrow">ADD AN EXTERNAL CERTIFICATE</p>
                        <label><span>Certificate name</span><input name="title" value={certificateForm.title} onChange={updateCertificateField} placeholder="e.g. AWS Cloud Practitioner" required /></label>
                        <label><span>Issuing organization</span><input name="issuer" value={certificateForm.issuer} onChange={updateCertificateField} placeholder="e.g. Coursera" required /></label>
                        <div className="certificate-form-row"><label><span>Issue date</span><input type="date" name="issueDate" value={certificateForm.issueDate} onChange={updateCertificateField} /></label><label><span>Credential ID</span><input name="credentialId" value={certificateForm.credentialId} onChange={updateCertificateField} placeholder="Optional" /></label></div>
                        <label><span>Credential URL</span><input type="url" name="credentialUrl" value={certificateForm.credentialUrl} onChange={updateCertificateField} placeholder="https://..." /></label>
                        <label><span>Certificate image</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectCertificateImage} /></label>
                        <label><span>Skills</span><input name="skills" value={certificateForm.skills} onChange={updateCertificateField} placeholder="Cloud, AWS, Security" /></label>
                        <button className="account-action" type="submit" disabled={certificateStatus.loading}>{certificateStatus.loading ? "Adding..." : "Add certificate"}</button>
                        {certificateStatus.message && <p className={`account-form-message ${certificateStatus.error ? "account-error" : ""}`}>{certificateStatus.message}</p>}
                    </form>
                    <div className="certificate-list">{certificates.length === 0 ? <p className="account-muted">Add certificates from other learning platforms, universities, or employers.</p> : certificates.map((certificate) => <article className="certificate-card" key={certificate.id}>{certificate.imageData && <img className="certificate-image" src={certificate.imageData} alt={`${certificate.title} certificate`} />}<div className="certificate-card-heading"><span className="certificate-mark">+</span><div><h3>{certificate.title}</h3><p>{certificate.issuer}</p></div><button className="certificate-remove" type="button" onClick={() => removeCertificate(certificate.id)}>Remove</button></div><div className="certificate-meta"><span>{certificate.issueDate ? new Date(`${certificate.issueDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Date not provided"}</span>{certificate.credentialId && <span>{certificate.credentialId}</span>}{certificate.source === "learnly" && <span className="certificate-source">LEARNLY</span>}</div>{certificate.skills?.length > 0 && <p className="certificate-skills">{certificate.skills.join(" · ")}</p>}{certificate.credentialUrl && <a className="certificate-link" href={certificate.credentialUrl} target="_blank" rel="noreferrer">View credential <span aria-hidden="true">-&gt;</span></a>}</article>)}</div>
                </div>
            </section>
            <section className="account-section"><div className="account-section-heading"><div><p className="account-eyebrow">LEARNLY COMPLETIONS</p><h2>Courses you have finished.</h2></div></div>{completedCourses.length === 0 ? <p className="account-muted">Pass a final assessment to add your first completed Learnly course here.</p> : <div className="completed-course-list">{completedCourses.map((course) => <Link className="completed-course" to={`/Coursecontent/${course.courseId}`} key={course.courseId}><span>{course.topic}</span><strong>{course.title}</strong><small>Score {course.score}% | Completed {new Date(course.completedAt).toLocaleDateString()}</small></Link>)}</div>}</section>
            <section className="account-section"><div className="account-section-heading"><div><p className="account-eyebrow">NEXT STEPS</p><h2>Courses picked for your path.</h2></div><Link className="account-inline-link" to="/CoursesPage">Browse all courses <span aria-hidden="true">-&gt;</span></Link></div><div className="recommendation-list">{recommendations.map((course) => <article className="recommendation-card" key={course.id}><span>{course.topic}</span><h3>{course.title}</h3><p>{course.reason}</p><Link to={`/Coursecontent/${course.id}`}>View course <span aria-hidden="true">-&gt;</span></Link></article>)}</div></section>
            <Link className="account-passport-link" to="/SkillPassport">Open Skill Passport <span aria-hidden="true">-&gt;</span></Link>
        </main>
    );
}

export default Account;
