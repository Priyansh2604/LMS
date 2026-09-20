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

const practicalChallenges = {
	"AI & Machine Learning": {
		prompt: "Write one Python line that creates a feature matrix named X from a pandas DataFrame named data.",
		starterCode: "# Write your solution here\n",
		keywords: ["data", "X", "[[", "]", "iloc", "drop"],
	},
	Cybersecurity: {
		prompt: "Write a Python function called is_strong_password that returns True when a password has at least 12 characters.",
		starterCode: "def is_strong_password(password):\n    # Write your solution here\n    pass\n",
		keywords: ["def", "is_strong_password", "len", "12", "return"],
	},
	"Data Analytics": {
		prompt: "Write a SQL query that returns the average salary from a table named employees.",
		starterCode: "-- Write your SQL query here\n",
		keywords: ["select", "avg", "salary", "from", "employees"],
	},
	IoT: {
		prompt: "Write a JavaScript function called isSafeTemperature that returns true when a sensor value is between 0 and 40.",
		starterCode: "function isSafeTemperature(value) {\n  // Write your solution here\n}\n",
		keywords: ["function", "isSafeTemperature", "value", "return", "40"],
	},
	Development: {
		prompt: "Write a JavaScript function called add that returns the sum of two numbers.",
		starterCode: "function add(first, second) {\n  // Write your solution here\n}\n",
		keywords: ["function", "add", "first", "second", "return"],
	},
};

function getRandomQuestions(topic) {
	const questions = topic === "Mixed topics"
		? Object.entries(quizTopics).flatMap(([questionTopic, topicQuestions]) => (
			topicQuestions.map(([question, options, answer]) => ({ topic: questionTopic, question, options, answer }))
		))
		: quizTopics[topic].map(([question, options, answer]) => ({ topic, question, options, answer }));

	return questions.sort(() => Math.random() - 0.5).slice(0, 5).map((question, index) => {
		if (index === 1) return { ...question, mode: "fill", prompt: `Complete the statement: ${question.question}`, expectedAnswer: question.options[question.answer] };
		if (index === 2) return { ...question, mode: "scenario" };
		if (index === 3) {
			const challenge = practicalChallenges[question.topic] || practicalChallenges.Development;
			return { ...question, ...challenge, mode: "code" };
		}
		return { ...question, mode: "choice" };
	});
}

function Quiz() {
	const [selectedTopic, setSelectedTopic] = useState(null);
	const [activeQuestions, setActiveQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [selectedOption, setSelectedOption] = useState(null);
	const [textResponse, setTextResponse] = useState("");
	const [codeCheck, setCodeCheck] = useState(null);
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
		setTextResponse("");
		setCodeCheck(null);
		setScore(0);
		setAnsweredQuestions([]);
		setIsComplete(false);
		localStorage.removeItem("learnlySkillPassportDraft");
	}

	function submitAnswer() {
		const isCodeQuestion = question?.mode === "code";
		const isTextQuestion = question?.mode === "fill";
		if ((selectedOption === null && !isTextQuestion && !isCodeQuestion) || ((isTextQuestion || isCodeQuestion) && !textResponse.trim())) return;

		const isCorrect = isCodeQuestion
			? question.keywords.every((keyword) => textResponse.toLowerCase().includes(keyword.toLowerCase()))
			: isTextQuestion
				? textResponse.trim().toLowerCase() === question.expectedAnswer.toLowerCase()
				: selectedOption === question.answer;
		const nextScore = score + (isCorrect ? 1 : 0);
		setScore(nextScore);
		const nextAnswers = [...answeredQuestions, {
			topic: question.topic,
			question: question.question,
			questionType: question.mode,
			selectedAnswer: isCodeQuestion || isTextQuestion ? textResponse : question.options[selectedOption],
			correctAnswer: isCodeQuestion ? "Solution meets the practical task requirements" : question.options[question.answer],
			correct: isCorrect,
		}];
		setAnsweredQuestions(nextAnswers);
		const nextPercentage = Math.round((nextScore / (currentQuestion + 1)) * 100);
		localStorage.setItem("learnlySkillPassportDraft", JSON.stringify({
			topic: selectedTopic,
			answered: currentQuestion + 1,
			total: quizQuestions.length,
			percentage: nextPercentage,
			answers: nextAnswers,
			updatedAt: new Date().toISOString(),
		}));

		if (currentQuestion === quizQuestions.length - 1) {
			const topicScores = nextAnswers.reduce((scores, answer) => {
				const current = scores[answer.topic] || { correct: 0, total: 0 };
				return { ...scores, [answer.topic]: { correct: current.correct + (answer.correct ? 1 : 0), total: current.total + 1 } };
			}, {});
			localStorage.setItem("learnlySkillPassport", JSON.stringify({
				topic: selectedTopic,
				percentage: Math.round((nextScore / quizQuestions.length) * 100),
				topicScores,
				answers: nextAnswers,
				answered: nextAnswers.length,
				total: quizQuestions.length,
				createdAt: new Date().toISOString(),
			}));
			localStorage.removeItem("learnlySkillPassportDraft");
			setIsComplete(true);
			return;
		}

		setCurrentQuestion((previousQuestion) => previousQuestion + 1);
		setSelectedOption(null);
		setTextResponse("");
		setCodeCheck(null);
	}

	function runCodeCheck() {
		const passed = question?.mode === "code" && question.keywords.every((keyword) => textResponse.toLowerCase().includes(keyword.toLowerCase()));
		setCodeCheck(passed ? "The solution contains the expected structure. Submit it when ready." : "The check found missing requirements. Review the task and try again.");
	}

	function restartQuiz() {
		setSelectedTopic(null);
		setActiveQuestions([]);
		setCurrentQuestion(0);
		setSelectedOption(null);
		setTextResponse("");
		setCodeCheck(null);
		setScore(0);
		setAnsweredQuestions([]);
		setIsComplete(false);
		localStorage.removeItem("learnlySkillPassportDraft");
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
					{question.mode === "code" && (
						<div className="practical-question">
							<p className="question-mode-label">PRACTICAL CODING TASK</p>
							<h3>{question.prompt}</h3>
							<textarea className="code-editor" value={textResponse || question.starterCode} onChange={(event) => setTextResponse(event.target.value)} spellCheck="false" aria-label="Code answer" />
							<button className="code-check-button" type="button" onClick={runCodeCheck}>Run check</button>
							{codeCheck && <p className={`code-check-result ${codeCheck.startsWith("The solution") ? "is-success" : "is-warning"}`}>{codeCheck}</p>}
						</div>
					)}
					{question.mode === "fill" && (
						<label className="fill-question"><span className="question-mode-label">FILL IN THE BLANK</span><strong>{question.prompt}</strong><input value={textResponse} onChange={(event) => setTextResponse(event.target.value)} placeholder="Type your answer" /></label>
					)}
					{(question.mode === "choice" || question.mode === "scenario") && <div className="quiz-options" role="radiogroup" aria-label={question.mode === "scenario" ? "Real world scenario answers" : "Answer choices"}>
						{question.mode === "scenario" && <p className="question-mode-label">REAL-WORLD SCENARIO</p>}
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
					</div>}
					<button className="quiz-action" type="button" disabled={selectedOption === null && !textResponse.trim()} onClick={submitAnswer}>
						{currentQuestion === quizQuestions.length - 1 ? "Finish quiz" : "Next question"}
					</button>
				</div>
				{answeredQuestions.length > 0 && (
					<div className="quiz-live-report" aria-live="polite">
						<div><span>LIVE REPORT</span><strong>{answeredQuestions.length} / {quizQuestions.length} answered</strong></div>
						<div><span>Current accuracy</span><strong>{Math.round((score / answeredQuestions.length) * 100)}%</strong></div>
						<div><span>Next report</span><strong>{currentQuestion === quizQuestions.length - 1 ? "Ready to generate" : "Updates after your answer"}</strong></div>
					</div>
				)}
			</section>
		</main>
	);
}

export default Quiz;
