
import "./Courses.css";
import { Link } from "react-router-dom";
import { Courses as courseCatalog } from "./courseData";

function CoursesList({ courses = courseCatalog }) {
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
              <h1>{course.title}</h1>
              <h2>{course.description}</h2>
              <Link className="course-enroll-button" to={`/Coursecontent/${course.id}`}>
                Enroll now
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CoursesList;
