
import "./Courses.css";
import { Link } from "react-router-dom";
import { Courses as courseCatalog } from "./courseData";
import { useEffect, useState } from "react";

function getCompletedCourses() {
  try {
    const certificates = JSON.parse(localStorage.getItem("learnlyCertificates") || "[]");
    return new Map((Array.isArray(certificates) ? certificates : []).map((certificate) => [
      String(certificate.courseId),
      certificate,
    ]));
  } catch {
    return new Map();
  }
}

function CoursesList({ courses = courseCatalog }) {
  const [completedCourses, setCompletedCourses] = useState(() => getCompletedCourses());

  useEffect(() => {
    function refreshCompletion() {
      setCompletedCourses(getCompletedCourses());
    }

    window.addEventListener("learnly-course-completed", refreshCompletion);
    window.addEventListener("storage", refreshCompletion);
    return () => {
      window.removeEventListener("learnly-course-completed", refreshCompletion);
      window.removeEventListener("storage", refreshCompletion);
    };
  }, []);

  return (
    <section id="courses">
      <div className="courses">
        {courses.map((course) => (
          <article className="course" key={course.id}>
            <img alt={course.alt} src={course.image} />
            <div className="course-content">
              <div className="course-card-meta">
                <span className="course-topic">{course.topic}</span>
                <span className="course-duration">{course.durationLabel}</span>
              </div>
              {completedCourses.has(String(course.id)) && <span className="course-completed-label">COMPLETED</span>}
              <h1>{course.title}</h1>
              <h2>{course.description}</h2>
              <div className="course-card-actions">
                <Link className="course-enroll-button" to={`/Coursecontent/${course.id}`}>
                  {completedCourses.has(String(course.id)) ? "Review course" : "Enroll now"}
                </Link>
                {completedCourses.has(String(course.id)) && (
                  <Link className="course-report-link" to={`/SkillPassport?courseId=${course.id}`}>View report</Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CoursesList;
