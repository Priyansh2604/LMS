import { useState } from "react";
import { Link } from "react-router-dom";
import "./Quiz.css";

const quizTopics = {
	"AI & Machine Learning": [
		["What is the main purpose of a training dataset?", ["To teach a model patterns from examples", "To store model predictions", "To replace testing", "To increase storage"], 0],
		["What does a classification model predict?", ["A category or label", "A screen size", "A file location", "A network cable"], 0],
		["What is overfitting?", ["A model memorizing training data too closely", "A model with no data", "A faster database", "A type of encryption"], 0],
		["Which technology helps computers understand human language?", ["Natural language processing", "Bluetooth", "Load balancing", "Version control"], 0],
		["What does a feature represent in machine learning?", ["A useful input signal for a model", "A user password", "A hardware warranty", "A backup drive"], 0],
	],
	"Cybersecurity": [
		["Which practice adds protection after a password?", ["Data compression", "Multi-factor authentication", "Caching", "Port forwarding"], 1],
		["What does phishing usually try to steal?", ["Credentials or sensitive information", "Screen resolution", "Battery power", "Source code formatting"], 0],
		["What is encryption used for?", ["Protecting data by transforming it", "Making files larger", "Removing all backups", "Speeding up a monitor"], 0],
		["Which password is strongest?", ["A long, unique passphrase", "password123", "A reused short word", "Your first name"], 0],
		["What is a firewall designed to control?", ["Network traffic", "Keyboard brightness", "Image quality", "CPU temperature only"], 0],
	],
	"Data Analytics": [
		["What does a data dashboard help a team do?", ["Write source code", "Replace raw data", "See important metrics quickly", "Encrypt every file"], 2],
		["What is the median?", ["The middle value in ordered data", "The largest value", "The number of columns", "A chart type only"], 0],
		["Which tool is commonly used to query relational databases?", ["SQL", "HTML", "CSS", "SMTP"], 0],
		["Why clean data before analysis?", ["To reduce errors and inconsistencies", "To hide every result", "To remove all columns", "To disable charts"], 0],
		["What does a trend line help reveal?", ["The direction of change over time", "A user login", "A file extension", "A computer password"], 0],
	],
	"IoT": [
		["What makes a device part of the Internet of Things?", ["A larger screen", "It connects and exchanges data over a network", "It works without electricity", "It only runs offline"], 1],
		["What does an IoT sensor do?", ["Collects information from its environment", "Writes website styles", "Deletes network traffic", "Compiles a mobile app"], 0],
		["Where can IoT data often be processed?", ["At the edge or in the cloud", "Only on paper", "Only in a printer", "Nowhere after collection"], 0],
		["Which is an IoT example?", ["A connected fitness tracker", "A blank notebook", "A wooden chair", "A disconnected cable"], 0],
		["Why secure connected devices?", ["To protect devices and the data they collect", "To increase their weight", "To remove their sensors", "To stop all updates"], 0],
	],
	"Development": [
		["What is the role of an API?", ["It connects software systems through defined rules", "It designs a logo", "It removes testing", "It increases brightness"], 0],
		["What does version control help developers do?", ["Track and manage code changes", "Replace a database", "Design hardware", "Remove documentation"], 0],
		["What is a front-end interface?", ["The part users interact with", "A server power supply", "A database backup", "A network cable"], 0],
		["Why write automated tests?", ["To check that code behaves as expected", "To make code invisible", "To remove all features", "To avoid source control"], 0],
		["What does debugging involve?", ["Finding and fixing problems in code", "Adding random features", "Deleting every comment", "Changing a laptop screen"], 0],
	],
};

const topicNames = [...Object.keys(quizTopics), "Mixed topics"];

function getRandomQuestions(topic) {
	const questions = topic === "Mixed topics"
		? Object.entries(quizTopics).flatMap(([questionTopic, topicQuestions]) => (
			topicQuestions.map(([question, options, answer]) => ({ topic: questionTopic, question, options, answer }))
		))
		: quizTopics[topic].map(([question, options, answer]) => ({ topic, question, options, answer }));

	return questions.sort(() => Math.random() - 0.5).slice(0, 5);
}

function Quiz() {
	const [selectedTopic, setSelectedTopic] = useState(null);
	const [activeQuestions, setActiveQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [selectedOption, setSelectedOption] = useState(null);
	const [score, setScore] = useState(0);
	const [answeredQuestions, setAnsweredQuestions] = useState([]);
	const [isComplete, setIsComplete] = useState(false);
	const quizQuestions = activeQuestions;
	const question = quizQuestions[currentQuestion];
	const progress = ((currentQuestion + (isComplete ? 1 : 0)) / 5) * 100;

	function chooseTopic(topic) {
		setSelectedTopic(topic);
		setActiveQuestions(getRandomQuestions(topic));
		setCurrentQuestion(0);
		setSelectedOption(null);
		setScore(0);
		setAnsweredQuestions([]);
		setIsComplete(false);
	}

	function submitAnswer() {
		if (selectedOption === null) return;

		const nextScore = score + (selectedOption === question.answer ? 1 : 0);
		setScore(nextScore);
		const nextAnswers = [...answeredQuestions, { topic: question.topic, correct: selectedOption === question.answer }];
		setAnsweredQuestions(nextAnswers);

		if (currentQuestion === quizQuestions.length - 1) {
			const topicScores = nextAnswers.reduce((scores, answer) => {
				const current = scores[answer.topic] || { correct: 0, total: 0 };
				return { ...scores, [answer.topic]: { correct: current.correct + (answer.correct ? 1 : 0), total: current.total + 1 } };
			}, {});
			localStorage.setItem("learnlySkillPassport", JSON.stringify({
				topic: selectedTopic,
				percentage: Math.round((nextScore / quizQuestions.length) * 100),
				topicScores,
				createdAt: new Date().toISOString(),
			}));
			setIsComplete(true);
			return;
		}

		setCurrentQuestion((previousQuestion) => previousQuestion + 1);
		setSelectedOption(null);
	}

	function restartQuiz() {
		setSelectedTopic(null);
		setActiveQuestions([]);
		setCurrentQuestion(0);
		setSelectedOption(null);
		setScore(0);
		setAnsweredQuestions([]);
		setIsComplete(false);
	}

	if (isComplete) {
		const percentage = Math.round((score / quizQuestions.length) * 100);
		return (
			<main className="quiz-page">
				<section className="quiz-result" aria-labelledby="quiz-result-title">
					<p className="quiz-eyebrow">QUIZ COMPLETE</p>
					<div className="score-ring" aria-label={`${percentage} percent score`}>
						<strong>{percentage}%</strong>
						<span>score</span>
					</div>
					<h1 id="quiz-result-title">You scored {score} out of 5</h1>
					<p className="quiz-topic">{selectedTopic}</p>
					<p className="quiz-result-message">
						{percentage >= 80
							? "Excellent work. You have a strong grasp of these topics."
							: "Good start. Review the topics and try again to improve your score."}
					</p>
					<div className="quiz-result-actions">
						<Link className="quiz-action quiz-passport-link" to="/SkillPassport">View my Skill Passport</Link>
						<button className="quiz-action quiz-action-secondary" type="button" onClick={restartQuiz}>Choose another topic</button>
					</div>
				</section>
			</main>
		);
	}

	if (!selectedTopic) {
		return (
			<main className="quiz-page">
				<section className="quiz-shell topic-picker" aria-labelledby="topic-picker-title">
					<p className="quiz-eyebrow">CHOOSE YOUR FOCUS</p>
					<h1 id="topic-picker-title">What do you want to test?</h1>
					<p className="topic-picker-intro">Pick a course topic for focused questions, or try a random mix from every skill.</p>
					<div className="topic-grid">
						{topicNames.map((topic) => (
							<button className="topic-choice" key={topic} type="button" onClick={() => chooseTopic(topic)}>
								<span>{topic}</span>
								<small>5 questions</small>
							</button>
						))}
					</div>
				</section>
			</main>
		);
	}

	return (
		<main className="quiz-page">
			<section className="quiz-shell" aria-labelledby="quiz-title">
				<div className="quiz-heading">
					<div>
						<p className="quiz-eyebrow">KNOWLEDGE CHECK</p>
						<h1 id="quiz-title">Test your learning.</h1>
						<p>Five focused questions to check your {selectedTopic} knowledge.</p>
					</div>
						<span className="question-count">{currentQuestion + 1} / 5</span>
				</div>

				<div className="quiz-progress" aria-label={`${currentQuestion + 1} of ${quizQuestions.length} questions completed`}>
					<span style={{ width: `${progress}%` }} />
				</div>

				<div className="quiz-question-card">
					<span className="quiz-topic">{question.topic}</span>
					<h2>{question.question}</h2>
					<div className="quiz-options" role="radiogroup" aria-label="Answer choices">
						{question.options.map((option, optionIndex) => (
							<button
								className={`quiz-option ${selectedOption === optionIndex ? "selected" : ""}`}
								key={option}
								type="button"
								role="radio"
								aria-checked={selectedOption === optionIndex}
								onClick={() => setSelectedOption(optionIndex)}
							>
								<span className="option-marker">{String.fromCharCode(65 + optionIndex)}</span>
								<span>{option}</span>
							</button>
						))}
					</div>
					<button className="quiz-action" type="button" disabled={selectedOption === null} onClick={submitAnswer}>
						{currentQuestion === quizQuestions.length - 1 ? "Finish quiz" : "Next question"}
					</button>
				</div>
			</section>
		</main>
	);
}

export default Quiz;
