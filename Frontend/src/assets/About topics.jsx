import { Link, useParams } from "react-router-dom";
import { defaultCourses } from "./courseData";
import "./About topics.css";

const topicDetails = {
	"AI & Machine Learning": {
		description: "Understand how intelligent systems learn from data, make predictions, and support better decisions.",
		skills: ["Python foundations", "Feature engineering", "Classification and regression", "Responsible AI"],
	},
	"Cybersecurity": {
		description: "Build the security habits and technical foundations needed to protect people, systems, applications, and data.",
		skills: ["Threat awareness", "Identity and access", "Network defense", "Incident response"],
	},
	"Data Analytics": {
		description: "Turn raw information into clear insights using practical tools, visual storytelling, and repeatable analysis workflows.",
		skills: ["SQL and spreadsheets", "Python with pandas", "Dashboards", "Data storytelling"],
	},
	"Cloud & DevOps": {
		description: "Learn how modern teams automate delivery, operate reliable infrastructure, and ship software with confidence.",
		skills: ["Git and Linux", "Docker", "AWS", "Kubernetes and CI/CD"],
	},
	Development: {
		description: "Create complete software products by connecting robust backend services with useful frontend experiences.",
		skills: ["Java and Spring Boot", "REST APIs", "Databases", "Testing and deployment"],
	},
	"Computer Science": {
		description: "Strengthen the problem-solving patterns that help you write efficient software and approach technical interviews.",
		skills: ["Complexity analysis", "Data structures", "Algorithms", "Dynamic programming"],
	},
	IoT: {
		description: "Connect devices, sensors, and software to collect useful information and build smarter systems.",
		skills: ["Connected devices", "Sensors and data", "Edge and cloud", "IoT security"],
	},
};

function AboutTopics() {
	const { topicName } = useParams();
	const topics = [...new Set(defaultCourses.map((course) => course.topic))];
	const requestedTopic = topicName ? decodeURIComponent(topicName) : null;
	const topicAliases = { "Cyber security": "Cybersecurity", IOT: "IoT" };
	const selectedTopic = topicAliases[requestedTopic] || requestedTopic;
	const visibleTopics = selectedTopic && topics.includes(selectedTopic) ? [selectedTopic] : topics;

	return (
		<main className="topics-page">
			<section className="topics-hero">
				<p className="topics-eyebrow">EXPLORE YOUR NEXT SKILL</p>
				<h1>{selectedTopic ? `${selectedTopic}, made practical.` : "Find the topic that keeps you curious."}</h1>
				<p>Learnly brings focused technology paths and practical courses together, so you can choose a direction and keep making progress.</p>
				<div className="topics-summary">
					<span><strong>{topics.length}</strong> topic areas</span>
					<span><strong>{defaultCourses.length}</strong> practical courses</span>
					<span><strong>100%</strong> learn by doing</span>
				</div>
			</section>

			<section className="topic-list" aria-labelledby="topic-list-title">
				<div className="topics-section-heading">
					<div>
						<p className="topics-eyebrow">LEARNING PATHS</p>
						<h2 id="topic-list-title">Topics and courses</h2>
					</div>
					<p>Start with a topic, then choose the course that fits your next step.</p>
				</div>

				{visibleTopics.map((topic, index) => {
					const courses = defaultCourses.filter((course) => course.topic === topic);
					const details = topicDetails[topic];

					return (
						<article className="topic-row" key={topic}>
							<div className="topic-intro">
								<span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
								<p className="topics-eyebrow">{topic}</p>
								<h3>{details.description}</h3>
								<ul className="topic-skills">
									{details.skills.map((skill) => <li key={skill}>{skill}</li>)}
								</ul>
							</div>
							<div className="topic-courses">
								{courses.map((course) => (
									<Link className="topic-course" to={`/Coursecontent/${course.id}`} key={course.id}>
										<img src={course.image} alt={course.alt} />
										<div>
											<span>{course.durationLabel} · {course.level}</span>
											<h4>{course.title}</h4>
											<p>{course.description}</p>
											<strong>View course <span aria-hidden="true">→</span></strong>
										</div>
									</Link>
								))}
							</div>
						</article>
					);
				})}
			</section>
		</main>
	);
}

export default AboutTopics;
