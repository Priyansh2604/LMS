
import "./CoursesPage.css";
import Courses from "./Courses";
import { useEffect, useState } from "react";
import { defaultCourses } from "./courseData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const courseCatalog = [
	{
		id: 1,
		title: "DevOps A to Z Mastery",
		topic: "Cloud & DevOps",
		duration: 18,
		durationLabel: "18 hours",
		description: "Build reliable delivery pipelines with AWS, Docker, Kubernetes, and CI/CD.",
		image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFlJeP0kRB8US7NhL2F6YBAlhJMjzPIdLNqWt-F5NOaQ&s=10",
		alt: "DevOps tools and workflow",
	},
	{
		id: 2,
		title: "Java Full-Stack",
		topic: "Development",
		duration: 24,
		durationLabel: "24 hours",
		description: "Create production-ready applications with Java, Spring Boot, Hibernate, and Maven.",
		image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCO3jvxn3ABmRI8o9QvKKjf0rpNL0ejFjOH_APyxCWbQ&s=10",
		alt: "Java programming code",
	},
	{
		id: 3,
		title: "DSA Complete",
		topic: "Computer Science",
		duration: 14,
		durationLabel: "14 hours",
		description: "Strengthen problem-solving skills through graphs, heaps, stacks, and dynamic programming.",
		image: "https://miro.medium.com/0*TazBnJw1_YH1ibTx",
		alt: "Data structures and algorithms",
	},
	{
		id: 4,
		title: "Practical Data Analytics",
		topic: "Data & AI",
		duration: 16,
		durationLabel: "16 hours",
		description: "Turn raw data into useful insights with Python, SQL, dashboards, and clear storytelling.",
		image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
		alt: "Analytics dashboard on a laptop",
	},
	{
		id: 5,
		title: "Machine Learning Foundations",
		topic: "Data & AI",
		duration: 28,
		durationLabel: "28 hours",
		description: "Learn the core workflow behind useful models, from feature engineering to evaluation.",
		image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=80",
		alt: "Machine learning visualization",
	},
	{
		id: 6,
		title: "Cybersecurity Essentials",
		topic: "Security",
		duration: 12,
		durationLabel: "12 hours",
		description: "Understand modern threats and practice the fundamentals of secure systems and networks.",
		image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
		alt: "Cybersecurity lock illustration",
	},
];

function CoursesPage() {
	const [courses, setCourses] = useState(defaultCourses);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [selectedTopic, setSelectedTopic] = useState("All topics");
	const [durationSort, setDurationSort] = useState("featured");

	useEffect(() => {
		let isMounted = true;

		async function loadCourses() {
			setLoading(true);
			setErrorMessage("");

			try {
				const response = await fetch(`${API_URL}/api/courses`);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "Unable to load the course catalog from the backend.");
				}

				const nextCourses = Array.isArray(data.courses) && data.courses.length > 0 ? data.courses : defaultCourses;

				if (isMounted) {
					setCourses(nextCourses);
				}
			} catch (error) {
				if (isMounted) {
					setCourses(defaultCourses);
					setErrorMessage(error.message || "Unable to fetch course data from the API.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		loadCourses();

		return () => {
			isMounted = false;
		};
	}, []);

	const topics = ["All topics", ...new Set(courses.map((course) => course.topic))];
	const visibleCourses = courses
		.filter((course) => selectedTopic === "All topics" || course.topic === selectedTopic)
		.sort((firstCourse, secondCourse) => {
			if (durationSort === "shortest") return firstCourse.duration - secondCourse.duration;
			if (durationSort === "longest") return secondCourse.duration - firstCourse.duration;
			return firstCourse.id - secondCourse.id;
		});

	const resultLabel = `${visibleCourses.length} of ${courses.length} courses`;

	return (
		<main className="courses-page">
			<section className="courses-hero">
				<div className="courses-hero-copy">
					<p className="courses-eyebrow">LEARN WITH PURPOSE</p>
					<h1>Build skills that move you forward.</h1>
					<p className="courses-intro">
						Practical courses designed to help you learn in-demand tools,
						create real projects, and take your next step with confidence.
					</p>
				</div>
				<div className="courses-stats" aria-label="Course highlights">
					<div>
						<strong>12+</strong>
						<span>Expert-led paths</span>
					</div>
					<div>
						<strong>40 hrs</strong>
						<span>Hands-on learning</span>
					</div>
					<div>
						<strong>100%</strong>
						<span>Career focused</span>
					</div>
				</div>
			</section>

			<section className="course-catalog" aria-labelledby="course-catalog-title">
				{loading && <p className="course-result-count">Loading course catalog from the backend…</p>}
				{!loading && errorMessage && (
					<p className="course-result-count" style={{ color: "#fca5a5" }}>{errorMessage}</p>
				)}
				<div className="catalog-heading">
					<div>
						<p className="courses-eyebrow">START EXPLORING</p>
						<h2 id="course-catalog-title">Featured courses</h2>
					</div>
					<p>Choose a path, learn by doing, and keep growing.</p>
				</div>
				<div className="catalog-controls" aria-label="Course filters">
					<label>
						<span>Topic</span>
						<select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
							{topics.map((topic) => <option key={topic}>{topic}</option>)}
						</select>
					</label>
					<label>
						<span>Duration</span>
						<select value={durationSort} onChange={(event) => setDurationSort(event.target.value)}>
							<option value="featured">Featured</option>
							<option value="shortest">Shortest first</option>
							<option value="longest">Longest first</option>
						</select>
					</label>
				</div>
				<p className="course-result-count">Showing {resultLabel}</p>
				<Courses courses={visibleCourses} />
			</section>
		</main>
	);
}

export default CoursesPage;
