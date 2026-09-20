import { useEffect, useState } from "react";
import { useRef } from "react";
import { Chart, registerables } from "chart.js";
import "./InstructorAdmin.css";

Chart.register(...registerables);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const topicOptions = [
  "AI & Machine Learning",
  "Cybersecurity",
  "Data Analytics",
  "Development",
  "Cloud & DevOps",
  "Computer Science",
  "IoT",
  "Business",
  "Design",
];

const emptyCourseForm = {
  title: "",
  topic: "AI & Machine Learning",
  level: "Beginner",
  durationLabel: "12 hours",
  instructor: "",
  description: "",
  overview: "",
  image: "",
  alt: "",
  modules: "",
};

const emptyLessonForm = {
  title: "",
  description: "",
  videoTitle: "",
  videoUrl: "",
  duration: "",
};

function AnalyticsChart({ type, data, options, ariaLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const chart = new Chart(canvasRef.current, { type, data, options });
    return () => chart.destroy();
  }, [data, options, type]);

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />;
}

function InstructorAdmin() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [analytics, setAnalytics] = useState({ courses: [], totals: {} });
  const [selectedAnalyticsCourseId, setSelectedAnalyticsCourseId] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch(`${API_URL}/api/courses`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load courses.");
        }

        const nextCourses = data.courses || [];
        setCourses(nextCourses);

        if (nextCourses.length > 0) {
          setSelectedCourseId(String(nextCourses[0].id));
        }
      } catch (error) {
        setStatus({
          type: "error",
          message: error.message || "Unable to load the course catalog right now.",
        });
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch(`${API_URL}/api/analytics`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Unable to load analytics.");

        setAnalytics(data);
        if (data.courses?.length > 0) setSelectedAnalyticsCourseId(String(data.courses[0].id));
      } catch (error) {
        setStatus({ type: "error", message: error.message || "Unable to load course analytics." });
      }
    }

    loadAnalytics();
  }, []);

  const selectedAnalyticsCourse = analytics.courses.find(
    (course) => String(course.id) === String(selectedAnalyticsCourseId),
  ) || analytics.courses[0];
  const chartTextColor = "#68706b";
  const chartGridColor = "rgba(104, 112, 107, 0.16)";
  const enrollmentChart = {
    labels: analytics.courses.map((course) => course.title),
    datasets: [{
      label: "Learners",
      data: analytics.courses.map((course) => course.enrollment),
      backgroundColor: "#d6f36b",
      borderColor: "#9cbd3d",
      borderWidth: 1,
      borderRadius: 4,
    }],
  };
  const performanceChart = {
    labels: selectedAnalyticsCourse?.students.map((student) => student.name) || [],
    datasets: [
      {
        label: "Course completion %",
        data: selectedAnalyticsCourse?.students.map((student) => student.completion) || [],
        backgroundColor: "#8dd3c7",
        borderWidth: 0,
        borderRadius: 4,
      },
      {
        label: "Assessment score %",
        data: selectedAnalyticsCourse?.students.map((student) => student.assessmentScore) || [],
        backgroundColor: "#fdb462",
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: chartTextColor, maxRotation: 35, minRotation: 0 }, grid: { display: false } },
      y: { beginAtZero: true, max: 100, ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    },
  };
  const performanceChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: true, labels: { color: chartTextColor } } },
  };

  function updateCourseForm(event) {
    const { name, value } = event.target;
    setCourseForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateLessonForm(event) {
    const { name, value } = event.target;
    setLessonForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function startCourseEdit(course) {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title || "",
      topic: course.topic || topicOptions[0],
      level: course.level || "Beginner",
      durationLabel: course.durationLabel || "",
      instructor: course.instructor || "",
      description: course.description || "",
      overview: course.overview || "",
      image: course.image || "",
      alt: course.alt || "",
      modules: Array.isArray(course.modules) ? course.modules.join(", ") : "",
    });
    setStatus({ type: "idle", message: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelCourseEdit() {
    setEditingCourseId(null);
    setCourseForm(emptyCourseForm);
  }

  function startLessonEdit(lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      videoTitle: lesson.videoTitle || "",
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || "",
    });
    setStatus({ type: "idle", message: "" });
  }

  function cancelLessonEdit() {
    setEditingLessonId(null);
    setLessonForm(emptyLessonForm);
  }

  async function handleCreateCourse(event) {
    event.preventDefault();

    const modules = courseForm.modules
      .split(",")
      .map((module) => module.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        editingCourseId ? `${API_URL}/api/courses/${editingCourseId}` : `${API_URL}/api/courses`,
        {
        method: editingCourseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseForm.title,
          topic: courseForm.topic,
          level: courseForm.level,
          durationLabel: courseForm.durationLabel,
          instructor: courseForm.instructor,
          description: courseForm.description,
          overview: courseForm.overview,
          image: courseForm.image,
          alt: courseForm.alt,
          modules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create the course.");
      }

      const nextCourses = editingCourseId
        ? courses.map((course) => course.id === data.course.id ? data.course : course)
        : [data.course, ...courses];
      setCourses(nextCourses);
      setSelectedCourseId(String(data.course.id));
      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      setStatus({ type: "success", message: editingCourseId ? `${data.course.title} was updated.` : `${data.course.title} was added to the course catalog.` });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to create the course right now." });
    }
  }

  async function handleAddLesson(event) {
    event.preventDefault();

    if (!selectedCourseId) {
      setStatus({ type: "error", message: "Please select a course before adding a lesson." });
      return;
    }

    try {
      const response = await fetch(
        editingLessonId
          ? `${API_URL}/api/courses/${selectedCourseId}/content/${editingLessonId}`
          : `${API_URL}/api/courses/${selectedCourseId}/content`,
        {
        method: editingLessonId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonForm.title,
          description: lessonForm.description,
          videoTitle: lessonForm.videoTitle,
          videoUrl: lessonForm.videoUrl,
          duration: lessonForm.duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save lesson content.");
      }

      setCourses((currentCourses) => currentCourses.map((course) => (
        course.id === data.course.id ? data.course : course
      )));
      setLessonForm(emptyLessonForm);
      setEditingLessonId(null);
      setStatus({ type: "success", message: editingLessonId ? `Lesson updated successfully in ${data.courseTitle}.` : `Lesson added successfully to ${data.courseTitle}.` });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to add the lesson right now." });
    }
  }

  return (
    <main className="instructor-page">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="instructor-heading" style={{ display: "grid", gap: 16, marginBottom: 28 }}>
          <span className="instructor-eyebrow" style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#7dd3fc", fontWeight: 700 }}>
            Instructor dashboard
          </span>
          <h1 className="instructor-title" style={{ margin: 0, fontSize: "clamp(2.2rem, 4vw, 4rem)", lineHeight: 1.1 }}>
            Build a learning path that learners can follow.
          </h1>
          <p className="instructor-intro" style={{ margin: 0, maxWidth: 760, color: "#cbd5e1", fontSize: 18 }}>
            Create a course, choose its topic, and add lesson content and videos so the learner view pulls the latest material from the backend.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
          <section className="instructor-panel" style={{
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius: 26,
            padding: 24,
            boxShadow: "0 25px 80px rgba(15, 23, 42, 0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p style={{ margin: 0, color: "#7dd3fc", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{editingCourseId ? "Edit course" : "Create course"}</p>
                <h2 style={{ margin: "8px 0 0" }}>{editingCourseId ? "Update course structure" : "Add to catalog"}</h2>
              </div>
              <span style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(59, 130, 246, 0.15)", color: "#bfdbfe", fontWeight: 700 }}>
                New
              </span>
            </div>

            <form onSubmit={handleCreateCourse} style={{ display: "grid", gap: 16 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Course title</span>
                <input
                  name="title"
                  value={courseForm.title}
                  onChange={updateCourseForm}
                  placeholder="e.g. Advanced React for Teams"
                  style={inputStyle}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Course topic</span>
                  <select name="topic" value={courseForm.topic} onChange={updateCourseForm} style={inputStyle}>
                    {topicOptions.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Level</span>
                  <select name="level" value={courseForm.level} onChange={updateCourseForm} style={inputStyle}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Duration</span>
                  <input
                    name="durationLabel"
                    value={courseForm.durationLabel}
                    onChange={updateCourseForm}
                    placeholder="12 hours"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Instructor</span>
                  <input
                    name="instructor"
                    value={courseForm.instructor}
                    onChange={updateCourseForm}
                    placeholder="Instructor name"
                    style={inputStyle}
                    required
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Short description</span>
                <textarea
                  name="description"
                  value={courseForm.description}
                  onChange={updateCourseForm}
                  rows={3}
                  placeholder="Short summary of what this course teaches."
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Overview</span>
                <textarea
                  name="overview"
                  value={courseForm.overview}
                  onChange={updateCourseForm}
                  rows={4}
                  placeholder="Explain the learning journey and what students will achieve."
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Modules</span>
                <input
                  name="modules"
                  value={courseForm.modules}
                  onChange={updateCourseForm}
                  placeholder="Module 1, Module 2, Module 3"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Course image URL</span>
                  <input
                    name="image"
                    value={courseForm.image}
                    onChange={updateCourseForm}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Image alt text</span>
                  <input
                    name="alt"
                    value={courseForm.alt}
                    onChange={updateCourseForm}
                    placeholder="Course cover art"
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="submit" style={primaryButtonStyle}>{editingCourseId ? "Save course changes" : "Add course to catalog"}</button>
                {editingCourseId && <button type="button" onClick={cancelCourseEdit} style={secondaryButtonStyle}>Cancel edit</button>}
              </div>
            </form>
          </section>

          <section className="instructor-panel" style={{
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius: 26,
            padding: 24,
            boxShadow: "0 25px 80px rgba(15, 23, 42, 0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p className="instructor-eyebrow" style={{ margin: 0, color: "#a78bfa", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{editingLessonId ? "Edit lesson" : "Manage content"}</p>
                <h2 style={{ margin: "8px 0 0" }}>{editingLessonId ? "Update lesson content" : "Add lesson"}</h2>
              </div>
              <span style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(168, 85, 247, 0.15)", color: "#ddd6fe", fontWeight: 700 }}>
                {courses.length} courses
              </span>
            </div>

            <form onSubmit={handleAddLesson} style={{ display: "grid", gap: 16 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Select course</span>
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  style={inputStyle}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Lesson title</span>
                <input
                  name="title"
                  value={lessonForm.title}
                  onChange={updateLessonForm}
                  placeholder="e.g. CI/CD pipelines and automation"
                  style={inputStyle}
                  required
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Lesson description</span>
                <textarea
                  name="description"
                  value={lessonForm.description}
                  onChange={updateLessonForm}
                  rows={4}
                  placeholder="Explain what the learner will discover in this lesson."
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Video title</span>
                  <input
                    name="videoTitle"
                    value={lessonForm.videoTitle}
                    onChange={updateLessonForm}
                    placeholder="Intro lesson"
                    style={inputStyle}
                    required
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Duration</span>
                  <input
                    name="duration"
                    value={lessonForm.duration}
                    onChange={updateLessonForm}
                    placeholder="12 min"
                    style={inputStyle}
                    required
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Video URL</span>
                <input
                  type="url"
                  name="videoUrl"
                  value={lessonForm.videoUrl}
                  onChange={updateLessonForm}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={inputStyle}
                  required
                />
              </label>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="submit" style={primaryButtonStyle}>{editingLessonId ? "Save lesson changes" : "Save lesson to course"}</button>
                {editingLessonId && <button type="button" onClick={cancelLessonEdit} style={secondaryButtonStyle}>Cancel edit</button>}
              </div>
            </form>

            <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Existing lessons</p>
              {(courses.find((course) => String(course.id) === String(selectedCourseId))?.lessons || []).map((lesson) => (
                <div key={lesson.id} style={itemRowStyle}>
                  <span>{lesson.title}</span>
                  <button type="button" onClick={() => startLessonEdit(lesson)} style={smallButtonStyle}>Edit</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="instructor-catalog" style={{ marginTop: 24, display: "grid", gap: 12 }}>
          <p className="instructor-eyebrow" style={{ margin: 0, color: "#7dd3fc", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Course catalog structure</p>
          {courses.map((course) => (
            <div key={course.id} style={itemRowStyle}>
              <div>
                <strong>{course.title}</strong>
                <span style={{ display: "block", color: "#94a3b8", marginTop: 4 }}>{course.topic} · {course.modules?.length || 0} modules · {course.lessons?.length || 0} lessons</span>
              </div>
              <button type="button" onClick={() => startCourseEdit(course)} style={smallButtonStyle}>Edit course</button>
            </div>
          ))}
        </section>

        <section className="instructor-analytics" aria-labelledby="analytics-title">
          <div className="analytics-heading">
            <div>
              <p className="instructor-eyebrow">Learning intelligence</p>
              <h2 id="analytics-title">See where learners need momentum.</h2>
              <p>Enrollment is based on learner interests and recorded course activity. Completion uses watched lessons.</p>
            </div>
            <label className="analytics-course-picker">
              <span>Course performance</span>
              <select value={selectedAnalyticsCourseId} onChange={(event) => setSelectedAnalyticsCourseId(event.target.value)}>
                {analytics.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>
          </div>

          <div className="analytics-kpis">
            <div><strong>{analytics.totals.learners || 0}</strong><span>Unique learners</span></div>
            <div><strong>{analytics.totals.enrollments || 0}</strong><span>Total enrollments</span></div>
            <div><strong>{analytics.totals.averageCompletion || 0}%</strong><span>Average completion</span></div>
          </div>

          <div className="analytics-chart-grid">
            <article className="analytics-chart-card">
              <div><p className="analytics-label">COURSE REACH</p><h3>Enrollment by course</h3></div>
              <div className="analytics-chart"><AnalyticsChart type="bar" data={enrollmentChart} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: undefined } } }} ariaLabel="Bar chart showing enrollment by course" /></div>
            </article>
            <article className="analytics-chart-card">
              <div><p className="analytics-label">LEARNER PERFORMANCE</p><h3>{selectedAnalyticsCourse?.title || "Select a course"}</h3></div>
              <div className="analytics-chart"><AnalyticsChart type="bar" data={performanceChart} options={performanceChartOptions} ariaLabel="Bar chart showing student completion and assessment percentages" /></div>
            </article>
          </div>

          <div className="analytics-students">
            <div><p className="analytics-label">NEXT BEST ACTION</p><h3>Recommendations for every learner</h3></div>
            {selectedAnalyticsCourse?.students.length ? selectedAnalyticsCourse.students.map((student) => (
              <div className="analytics-student-row" key={student.id}>
                <div><strong>{student.name}</strong><span>{student.email}</span></div>
                <span className="analytics-completion">{student.completion}% complete · {student.assessmentScore === null ? "Assessment pending" : `${student.assessmentScore}% assessment`}</span>
                <p>{student.recommendation}</p>
              </div>
            )) : <p className="analytics-empty">No learner activity is recorded for this course yet.</p>}
          </div>
        </section>

        {status.message && (
          <div className="instructor-status"
            style={{
              marginTop: 24,
              padding: "14px 18px",
              borderRadius: 16,
              background: status.type === "success" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
              border: `1px solid ${status.type === "success" ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
              color: status.type === "success" ? "#bbf7d0" : "#fecaca",
              fontWeight: 600,
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  outline: "none",
  fontSize: 15,
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  minHeight: 48,
  padding: "12px 18px",
  border: "none",
  borderRadius: 5,
  background: "#d6f36b",
  color: "#172019",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "none",
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: "1px solid #9cbd3d",
  background: "transparent",
  color: "#d6f36b",
};

const smallButtonStyle = {
  minHeight: 40,
  border: "1px solid #9cbd3d",
  borderRadius: 5,
  background: "#d6f36b",
  color: "#172019",
  padding: "9px 15px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: "14px 16px",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.62)",
};

export default InstructorAdmin;
