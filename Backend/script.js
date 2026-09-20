const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const usersFile = path.join(__dirname, "users.json");

function loadUsers() {
    try {
        const savedUsers = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        return Array.isArray(savedUsers) ? savedUsers : [];
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn("Unable to read users.json. Starting with an empty user list.");
        }

        return [];
    }
}

function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

const users = loadUsers();
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

const defaultCourses = [
    {
        id: 1,
        title: "DevOps A to Z Mastery",
        topic: "Cloud & DevOps",
        durationLabel: "18 hours",
        level: "Intermediate",
        instructor: "Aarav Mehta",
        wikimediaTitle: "DevOps",
        description: "Build reliable delivery pipelines with AWS, Docker, Kubernetes, and CI/CD.",
        overview: "Move from local development to confident production releases by learning how modern DevOps teams plan, automate, deploy, and monitor software.",
        outcomes: ["Create automated CI/CD pipelines", "Containerize applications with Docker", "Deploy and scale services with Kubernetes", "Monitor releases and troubleshoot failures"],
        modules: ["DevOps foundations and Git workflows", "Linux, networking, and scripting essentials", "Docker images and container orchestration", "AWS deployment fundamentals", "Kubernetes, CI/CD, and observability"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFlJeP0kRB8US7NhL2F6YBAlhJMjzPIdLNqWt-F5NOaQ&s=10",
        alt: "DevOps tools and workflow",
        lessons: [
            {
                id: 1,
                title: "Git and release workflows",
                description: "Understand source control, collaborative release patterns, and how teams ship stable software with confidence.",
                videoTitle: "Git basics for DevOps",
                videoUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
                duration: "12 min",
            },
        ],
    },
    {
        id: 2,
        title: "Java Full-Stack",
        topic: "Development",
        durationLabel: "24 hours",
        level: "Intermediate",
        instructor: "Priya Sharma",
        wikimediaTitle: "Java (programming language)",
        description: "Create production-ready applications with Java, Spring Boot, Hibernate, and Maven.",
        overview: "Build a complete web application from a clean Java backend to a responsive frontend, with persistence, authentication, testing, and deployment included.",
        outcomes: ["Build REST APIs with Spring Boot", "Persist data with Hibernate and SQL", "Connect frontend and backend applications", "Test and package production services"],
        modules: ["Java and object-oriented programming", "Spring Boot and REST API design", "Databases, JPA, and Hibernate", "Frontend integration and authentication", "Testing, Maven, and deployment"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCO3jvxn3ABmRI8o9QvKKjf0rpNL0ejFjOH_APyxCWbQ&s=10",
        alt: "Java programming code",
        lessons: [
            {
                id: 1,
                title: "Java foundations and OOP",
                description: "Review object-oriented programming and the fundamentals that make Java applications scalable and maintainable.",
                videoTitle: "Java OOP explained",
                videoUrl: "https://www.youtube.com/watch?v=8cm1x4bC610",
                duration: "15 min",
            },
        ],
    },
    {
        id: 3,
        title: "DSA Complete",
        topic: "Computer Science",
        durationLabel: "14 hours",
        level: "Beginner to intermediate",
        instructor: "Rohan Kapoor",
        wikimediaTitle: "Data structure",
        description: "Strengthen problem-solving skills through graphs, heaps, stacks, and dynamic programming.",
        overview: "Develop the structured thinking needed for technical interviews and real software by mastering core data structures and algorithmic patterns.",
        outcomes: ["Choose the right data structure for a problem", "Analyze time and space complexity", "Solve graph and tree problems", "Apply dynamic programming patterns"],
        modules: ["Complexity analysis and arrays", "Linked lists, stacks, and queues", "Trees, heaps, and hash tables", "Graphs and traversal algorithms", "Sorting, searching, and dynamic programming"],
        image: "https://miro.medium.com/0*TazBnJw1_YH1ibTx",
        alt: "Data structures and algorithms",
        lessons: [
            {
                id: 1,
                title: "Time complexity and arrays",
                description: "Learn how to analyze performance and choose efficient patterns when solving technical problems.",
                videoTitle: "Big O explained",
                videoUrl: "https://www.youtube.com/watch?v=V6mKVRU1evU",
                duration: "10 min",
            },
        ],
    },
    {
        id: 4,
        title: "Practical Data Analytics",
        topic: "Data Analytics",
        durationLabel: "16 hours",
        level: "Beginner to intermediate",
        instructor: "Neha Verma",
        wikimediaTitle: "Data analysis",
        description: "Turn raw information into useful decisions with SQL, spreadsheets, Python, and dashboards.",
        overview: "Learn a practical analysis workflow that takes you from messy data to clear insights, compelling visualizations, and confident business recommendations.",
        outcomes: ["Clean and prepare datasets for analysis", "Write SQL queries for useful insights", "Build clear charts and dashboards", "Explain findings with data-driven stories"],
        modules: ["Data analysis workflow and spreadsheets", "SQL queries and relational data", "Python with pandas for analysis", "Charts, dashboards, and reporting", "Projects and communicating insights"],
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
        alt: "Data analytics dashboard on a screen",
        lessons: [
            {
                id: 1,
                title: "Working with datasets",
                description: "Explore how to clean messy data and prepare it for reliable analysis and reporting.",
                videoTitle: "Data cleaning in practice",
                videoUrl: "https://www.youtube.com/watch?v=U4c2pYt3RZ8",
                duration: "11 min",
            },
        ],
    },
    {
        id: 5,
        title: "Cybersecurity Fundamentals",
        topic: "Cybersecurity",
        durationLabel: "20 hours",
        level: "Beginner",
        instructor: "Kabir Singh",
        wikimediaTitle: "Computer security",
        description: "Learn the essential practices used to protect accounts, networks, applications, and data.",
        overview: "Build a strong security mindset through hands-on foundations in threats, identity, encryption, network defense, and incident response.",
        outcomes: ["Recognize common security threats and attacks", "Apply secure identity and access practices", "Understand encryption and network defense", "Create a practical incident response plan"],
        modules: ["Security principles and threat awareness", "Identity, authentication, and access control", "Networks, firewalls, and secure protocols", "Encryption, privacy, and secure applications", "Monitoring and incident response"],
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
        alt: "Cybersecurity lock symbol on a laptop",
        lessons: [
            {
                id: 1,
                title: "Threats and secure habits",
                description: "Learn the everyday risks, attack patterns, and best practices used to keep digital systems safer.",
                videoTitle: "Cybersecurity foundations",
                videoUrl: "https://www.youtube.com/watch?v=5Q1dfB0YJm4",
                duration: "14 min",
            },
        ],
    },
    {
        id: 6,
        title: "AI & Machine Learning Essentials",
        topic: "AI & Machine Learning",
        durationLabel: "22 hours",
        level: "Beginner to intermediate",
        instructor: "Ishita Rao",
        wikimediaTitle: "Machine learning",
        description: "Understand how machine learning models learn from data and solve real-world problems.",
        overview: "Explore the complete machine learning lifecycle, from preparing data and choosing a model to evaluating results and explaining predictions.",
        outcomes: ["Prepare data for machine learning models", "Choose classification and regression approaches", "Evaluate model performance responsibly", "Build a small end-to-end ML project"],
        modules: ["AI concepts and Python foundations", "Data preparation and feature engineering", "Regression and classification", "Model evaluation and improvement", "Responsible AI and final project"],
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
        alt: "Abstract artificial intelligence illustration",
        lessons: [
            {
                id: 1,
                title: "AI workflow and model thinking",
                description: "Introduce the core lifecycle of training models and turning data into useful predictions.",
                videoTitle: "Machine learning basics",
                videoUrl: "https://www.youtube.com/watch?v=Gv9_4yMHFAM",
                duration: "13 min",
            },
        ],
    },
    {
        id: 7,
        title: "Internet of Things Foundations",
        topic: "IoT",
        durationLabel: "15 hours",
        level: "Beginner",
        instructor: "Maya Nair",
        wikimediaTitle: "Internet of things",
        description: "Learn how connected devices collect, share, and act on data in real-world systems.",
        overview: "Understand the building blocks of IoT, from sensors and connectivity to edge processing, cloud platforms, and secure device management.",
        outcomes: ["Explain the parts of an IoT system", "Connect sensors to collect useful data", "Compare edge and cloud processing", "Apply basic IoT security practices"],
        modules: ["IoT concepts and connected devices", "Sensors, gateways, and communication", "Edge computing and cloud platforms", "Data pipelines and device management", "Security and a smart home project"],
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
        alt: "Electronic circuit board representing connected devices",
        lessons: [
            {
                id: 1,
                title: "Connected devices overview",
                description: "Review how sensors, gateways, and cloud systems work together to create smart connected experiences.",
                videoTitle: "What is IoT?",
                videoUrl: "https://www.youtube.com/watch?v=LlhmzVL5bm8",
                duration: "12 min",
            },
        ],
    },
];

const sanitizeLesson = (lesson = {}) => ({
    id: lesson.id || Date.now(),
    title: String(lesson.title || "Untitled lesson").trim(),
    description: String(lesson.description || "").trim(),
    videoTitle: String(lesson.videoTitle || "Lesson video").trim(),
    videoUrl: String(lesson.videoUrl || "").trim(),
    duration: String(lesson.duration || "Lesson").trim(),
});

const sanitizeModules = (modules) => {
    if (Array.isArray(modules)) {
        return modules.map((module) => String(module).trim()).filter(Boolean);
    }

    return [];
};

const courses = defaultCourses.map((course) => ({
    ...course,
    lessons: Array.isArray(course.lessons) ? course.lessons.map(sanitizeLesson) : [],
    modules: sanitizeModules(course.modules),
    outcomes: Array.isArray(course.outcomes) ? course.outcomes : [],
}));

app.use(express.json());

app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isLocalFrontend = requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);

    if (isLocalFrontend) {
        res.header("Access-Control-Allow-Origin", requestOrigin);
        res.header("Vary", "Origin");
    }

    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.get("/", (req, res) => {
    res.json({ message: "Learnly API is running" });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "learnly-api" });
});

function normalizeTranslatedTextPayload(payload) {
    if (Array.isArray(payload)) {
        return payload.flatMap((item) => normalizeTranslatedTextPayload(item));
    }

    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.translatedText)) {
            return payload.translatedText.flatMap((item) => normalizeTranslatedTextPayload(item));
        }

        if (typeof payload.translatedText === "string") {
            return [payload.translatedText];
        }

        if (Array.isArray(payload.data)) {
            return payload.data.flatMap((item) => normalizeTranslatedTextPayload(item));
        }

        if (payload.text && typeof payload.text === "string") {
            return [payload.text];
        }
    }

    if (typeof payload === "string") {
        return [payload];
    }

    return [];
}

async function translateWithGemini(sourceTexts, targetLanguage) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }

    const preferredModels = [process.env.GEMINI_MODEL || "gemini-flash-latest"];
    let lastError = "Gemini translation request failed.";

    for (const modelName of preferredModels) {
        const prompt = `Translate each item in this JSON array to ${targetLanguage}. Return only valid JSON in the format ["translated1","translated2",...], keeping the same number of items and preserving meaning as closely as possible. Do not add explanations. Input: ${JSON.stringify(sourceTexts)}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }],
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.2,
                    },
                }),
                signal: AbortSignal.timeout(20000),
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = result?.error?.message || `Gemini model ${modelName} failed.`;
                lastError = message;
                if ([429].includes(response.status)) {
                    throw new Error(message);
                }
                if (![400, 404].includes(response.status)) {
                    throw new Error(message);
                }
                continue;
            }

            const rawText = result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
            let parsed = [];

            try {
                parsed = JSON.parse(rawText);
            } catch (error) {
                const match = rawText.match(/\[[\s\S]*\]/);
                if (match) {
                    try {
                        parsed = JSON.parse(match[0]);
                    } catch (innerError) {
                        throw new Error("Gemini returned an invalid JSON array for translations.");
                    }
                } else {
                    throw new Error("Gemini returned no valid translated array.");
                }
            }

            if (!Array.isArray(parsed)) {
                throw new Error("Gemini response was not a JSON array.");
            }

            const translatedTexts = parsed.map((item) => String(item));
            if (translatedTexts.length !== sourceTexts.length) {
                throw new Error("Gemini returned a different number of translations than the original texts.");
            }

            return translatedTexts;
        } catch (error) {
            lastError = error?.message || lastError;
        }
    }

    throw new Error(lastError);
}

async function translateWithLibreTranslate(sourceTexts, targetLanguage) {
    const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";
    const requestBody = {
        q: sourceTexts.length === 1 ? sourceTexts[0] : sourceTexts,
        source: "auto",
        target: targetLanguage,
        format: "text",
    };

    if (process.env.LIBRETRANSLATE_API_KEY) {
        requestBody.api_key = process.env.LIBRETRANSLATE_API_KEY;
    }

    const translationResponse = await fetch(`${libreTranslateUrl.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000),
    });

    const result = await translationResponse.json().catch(() => ({}));
    const translatedTexts = normalizeTranslatedTextPayload(result);

    if (!translationResponse.ok || translatedTexts.length !== sourceTexts.length) {
        throw new Error(result.error || "LibreTranslate could not translate this content.");
    }

    return translatedTexts;
}

app.post("/api/translate", async (req, res) => {
    const { text, texts, target } = req.body || {};
    const sourceTexts = Array.isArray(texts)
        ? texts.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : typeof text === "string" && text.trim()
            ? [text.trim()]
            : [];
    const targetLanguage = typeof target === "string" ? target.trim().toLowerCase() : "";

    if (!sourceTexts.length || !targetLanguage) {
        return res.status(400).json({ message: "Text and target language are required." });
    }

    try {
        let translatedTexts = [];
        const libreTranslateUrl = process.env.LIBRETRANSLATE_URL?.trim();
        const hasLibreTranslate = Boolean(
            process.env.LIBRETRANSLATE_API_KEY?.trim()
            || (libreTranslateUrl && libreTranslateUrl !== "https://libretranslate.com")
        );

        if (process.env.GEMINI_API_KEY?.trim()) {
            try {
                translatedTexts = await translateWithGemini(sourceTexts, targetLanguage);
            } catch (geminiError) {
                if (!hasLibreTranslate) {
                    throw geminiError;
                }
                translatedTexts = await translateWithLibreTranslate(sourceTexts, targetLanguage);
            }
        } else if (hasLibreTranslate) {
            translatedTexts = await translateWithLibreTranslate(sourceTexts, targetLanguage);
        } else {
            return res.status(503).json({
                message: "No translation provider is configured. Set GEMINI_API_KEY or LIBRETRANSLATE_URL.",
            });
        }

        return res.json({ translatedText: sourceTexts.length === 1 ? translatedTexts[0] : translatedTexts });
    } catch (error) {
        const message = error?.message || "Translation failed.";
        const status = /quota|rate limit|billing|exceeded/i.test(message) ? 503 : 502;
        return res.status(status).json({ message });
    }
});

app.get("/api/courses", (req, res) => {
    res.json({
        courses: courses.map((course) => ({
            ...course,
            lessons: course.lessons || [],
        })),
    });
});

app.get("/api/analytics", (req, res) => {
    const learners = users.filter((user) => user.role !== "instructor");

    const courseAnalytics = courses.map((course) => {
        const enrolledLearners = learners.filter((learner) => {
            const hasProgress = (learner.progress || []).some(
                (progress) => String(progress.courseId) === String(course.id),
            );
            return learner.courseInterest === course.topic || hasProgress;
        });

        const students = enrolledLearners.map((learner) => {
            const watchedLessons = new Set(
                (learner.progress || [])
                    .filter((progress) => String(progress.courseId) === String(course.id) && progress.watched)
                    .map((progress) => String(progress.lessonId)),
            ).size;
            const totalLessons = Math.max(course.modules?.length || course.lessons?.length || 0, 1);
            const completion = Math.min(100, Math.round((watchedLessons / totalLessons) * 100));
            const assessment = (learner.assessments || []).find(
                (item) => String(item.courseId) === String(course.id),
            );
            const assessmentScore = assessment?.score ?? null;
            const recommendation = assessmentScore !== null && assessmentScore < 80
                ? "Revisit the assessment topics, then retry the final check before moving on."
                : completion >= 80
                ? "Ready for an applied project or advanced challenge."
                : completion >= 40
                    ? "Review the next lesson and practise with a short exercise."
                    : "Start with the first lesson and schedule two focused study sessions.";

            return {
                id: learner.id,
                name: learner.name,
                email: learner.email,
                completion,
                assessmentScore,
                watchedLessons,
                totalLessons,
                recommendation,
            };
        });

        const averageCompletion = students.length
            ? Math.round(students.reduce((total, student) => total + student.completion, 0) / students.length)
            : 0;

        return {
            id: course.id,
            title: course.title,
            topic: course.topic,
            enrollment: students.length,
            averageCompletion,
            students,
        };
    });

    return res.json({
        courses: courseAnalytics,
        totals: {
            learners: new Set(courseAnalytics.flatMap((course) => course.students.map((student) => student.id))).size,
            enrollments: courseAnalytics.reduce((total, course) => total + course.enrollment, 0),
            averageCompletion: courseAnalytics.length
                ? Math.round(courseAnalytics.reduce((total, course) => total + course.averageCompletion, 0) / courseAnalytics.length)
                : 0,
        },
    });
});

app.get("/api/courses/:courseId", (req, res) => {
    const course = courses.find((item) => String(item.id) === String(req.params.courseId));

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
        course: {
            ...course,
            lessons: course.lessons || [],
        },
    });
});

app.post("/api/courses", (req, res) => {
    const payload = req.body || {};
    const title = String(payload.title || "").trim();
    const topic = String(payload.topic || "").trim();
    const description = String(payload.description || "").trim();
    const overview = String(payload.overview || "").trim();
    const instructor = String(payload.instructor || "").trim();
    const durationLabel = String(payload.durationLabel || "").trim() || "New course";
    const level = String(payload.level || "Beginner").trim();
    const image = String(payload.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80").trim();
    const alt = String(payload.alt || `${title} course`).trim();

    if (!title || !topic || !description || !overview || !instructor) {
        return res.status(400).json({
            message: "Course title, topic, description, overview, and instructor are required.",
        });
    }

    const newCourse = {
        id: Date.now(),
        title,
        topic,
        durationLabel,
        level,
        instructor,
        wikimediaTitle: topic,
        description,
        overview,
        outcomes: Array.isArray(payload.outcomes) && payload.outcomes.length
            ? payload.outcomes.map((item) => String(item).trim()).filter(Boolean)
            : ["Learn the core concepts of this course", "Apply your learnings in a practical way", "Track your progress through the course modules"],
        modules: sanitizeModules(payload.modules) || ["Module 1", "Module 2", "Module 3"],
        image,
        alt,
        lessons: Array.isArray(payload.lessons)
            ? payload.lessons.map(sanitizeLesson)
            : [],
    };

    courses.push(newCourse);

    return res.status(201).json({
        message: "Course created successfully",
        course: newCourse,
    });
});

app.put("/api/courses/:courseId", (req, res) => {
    const course = courses.find((item) => String(item.id) === String(req.params.courseId));

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    const payload = req.body || {};
    const title = String(payload.title || "").trim();
    const topic = String(payload.topic || "").trim();
    const description = String(payload.description || "").trim();
    const overview = String(payload.overview || "").trim();
    const instructor = String(payload.instructor || "").trim();

    if (!title || !topic || !description || !overview || !instructor) {
        return res.status(400).json({
            message: "Course title, topic, description, overview, and instructor are required.",
        });
    }

    Object.assign(course, {
        title,
        topic,
        durationLabel: String(payload.durationLabel || "New course").trim(),
        level: String(payload.level || "Beginner").trim(),
        instructor,
        wikimediaTitle: topic,
        description,
        overview,
        image: String(payload.image || course.image).trim(),
        alt: String(payload.alt || `${title} course`).trim(),
        modules: sanitizeModules(payload.modules),
    });

    return res.json({
        message: "Course updated successfully",
        course,
    });
});

app.post("/api/courses/:courseId/content", (req, res) => {
    const course = courses.find((item) => String(item.id) === String(req.params.courseId));
    const { title, description, videoTitle, videoUrl, duration } = req.body || {};

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    if (!title || !description || !videoTitle || !videoUrl || !duration) {
        return res.status(400).json({
            message: "Title, description, video title, video URL, and duration are required",
        });
    }

    const lesson = sanitizeLesson({
        id: Date.now(),
        title,
        description,
        videoTitle,
        videoUrl,
        duration,
    });

    course.lessons = Array.isArray(course.lessons) ? [...course.lessons, lesson] : [lesson];

    return res.status(201).json({
        message: "Lesson added successfully",
        courseTitle: course.title,
        lesson,
        course,
    });
});

app.put("/api/courses/:courseId/content/:lessonId", (req, res) => {
    const course = courses.find((item) => String(item.id) === String(req.params.courseId));

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    const lessonIndex = course.lessons.findIndex(
        (lesson) => String(lesson.id) === String(req.params.lessonId),
    );

    if (lessonIndex === -1) {
        return res.status(404).json({ message: "Lesson not found" });
    }

    const { title, description, videoTitle, videoUrl, duration } = req.body || {};

    if (!title || !description || !videoTitle || !videoUrl || !duration) {
        return res.status(400).json({
            message: "Title, description, video title, video URL, and duration are required",
        });
    }

    course.lessons[lessonIndex] = sanitizeLesson({
        id: course.lessons[lessonIndex].id,
        title,
        description,
        videoTitle,
        videoUrl,
        duration,
    });

    return res.json({
        message: "Lesson updated successfully",
        courseTitle: course.title,
        lesson: course.lessons[lessonIndex],
        course,
    });
});

app.post("/api/auth/register", (req, res) => {
    const {
        name,
        email,
        password,
        courseInterest,
        city,
        location,
        role,
    } = req.body;

    if (!name || !email || !password || !courseInterest || !city || !location) {
        return res.status(400).json({
            message: "Name, email, password, course interest, city, and location are required",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = {
        id: users.length + 1,
        name: name.trim(),
        email: normalizedEmail,
        password,
        courseInterest,
        city: city.trim(),
        location: location.trim(),
        role: role === "instructor" ? "instructor" : "learner",
        progress: [],
    };

    users.push(user);
    saveUsers();

    return res.status(201).json({
        message: "Account created successfully",
        user: publicUser(user),
    });
});

app.post("/api/auth/login", (req, res) => {
    const { email, password, role } = req.body;
    const user = users.find(
        (candidate) => candidate.email === email?.trim().toLowerCase(),
    );

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const requestedRole = role === "instructor" ? "instructor" : "learner";
    if (user.role !== requestedRole) {
        return res.status(403).json({
            message: `This account is registered as a ${user.role}. Please sign in as the correct role.`,
        });
    }

    return res.json({
        message: "Signed in successfully",
        user: publicUser(user),
    });
});

function sanitizeCertificate(payload = {}, source = "external") {
    const title = String(payload.title || payload.courseTitle || "").trim();
    const issuer = String(payload.issuer || "").trim();
    const credentialUrl = String(payload.credentialUrl || "").trim();
    const issueDate = String(payload.issueDate || "").trim();
    const imageData = typeof payload.imageData === "string" && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(payload.imageData)
        ? payload.imageData.slice(0, 4_000_000)
        : "";

    if (!title || !issuer) return null;

    if (credentialUrl) {
        try {
            const url = new URL(credentialUrl);
            if (!['http:', 'https:'].includes(url.protocol)) return null;
        } catch {
            return null;
        }
    }

    return {
        id: payload.id || `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        issuer,
        issueDate,
        credentialUrl,
        imageData,
        credentialId: String(payload.credentialId || "").trim(),
        skills: Array.isArray(payload.skills)
            ? payload.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 12)
            : String(payload.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 12),
        source,
        courseId: payload.courseId || null,
        score: Number.isFinite(Number(payload.score)) ? Math.round(Number(payload.score)) : null,
        createdAt: payload.createdAt || new Date().toISOString(),
    };
}

function getCompletedCourses(user) {
    return (user.assessments || [])
        .filter((assessment) => Number(assessment.score) >= 80)
        .map((assessment) => {
            const course = courses.find((item) => String(item.id) === String(assessment.courseId));
            return course
                ? {
                    courseId: course.id,
                    title: course.title,
                    topic: course.topic,
                    score: assessment.score,
                    completedAt: assessment.completedAt,
                }
                : null;
        })
        .filter(Boolean);
}

function getRecommendations(user) {
    const completedIds = new Set(getCompletedCourses(user).map((course) => String(course.courseId)));
    const interest = String(user.courseInterest || "").toLowerCase();

    return courses
        .filter((course) => !completedIds.has(String(course.id)))
        .map((course) => {
            const matchesInterest = course.topic.toLowerCase() === interest;
            const reason = matchesInterest
                ? `Matches your ${course.topic} learning path.`
                : `Builds on your interest in ${user.courseInterest || course.topic}.`;
            return { ...course, reason, recommendationScore: matchesInterest ? 2 : 1 };
        })
        .sort((first, second) => second.recommendationScore - first.recommendationScore || first.id - second.id)
        .slice(0, 3)
        .map(({ recommendationScore, ...course }) => course);
}

app.get("/api/account/:userId", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));

    if (!user) {
        return res.status(404).json({ message: "Account not found" });
    }

    return res.json({
        user: publicUser(user),
        watchedCourses: getWatchedCourses(user),
        certificates: Array.isArray(user.certificates) ? user.certificates : [],
        completedCourses: getCompletedCourses(user),
        recommendations: getRecommendations(user),
    });
});

app.post("/api/account/:userId/certificates", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));
    const certificate = sanitizeCertificate(req.body, "external");

    if (!user || !certificate) {
        return res.status(400).json({ message: "Certificate title and issuer are required, with a valid credential URL if provided." });
    }

    user.certificates = Array.isArray(user.certificates) ? user.certificates : [];
    user.certificates.unshift(certificate);
    saveUsers();
    return res.status(201).json({ message: "Certificate added", certificate, certificates: user.certificates });
});

app.put("/api/account/:userId/certificates/:certificateId", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));
    const certificate = sanitizeCertificate(req.body, "external");

    if (!user || !certificate) {
        return res.status(400).json({ message: "Certificate title and issuer are required, with a valid credential URL if provided." });
    }

    user.certificates = Array.isArray(user.certificates) ? user.certificates : [];
    const certificateIndex = user.certificates.findIndex((item) => String(item.id) === String(req.params.certificateId));
    if (certificateIndex === -1) return res.status(404).json({ message: "Certificate not found" });

    certificate.id = user.certificates[certificateIndex].id;
    user.certificates[certificateIndex] = certificate;
    saveUsers();
    return res.json({ message: "Certificate updated", certificate, certificates: user.certificates });
});

app.delete("/api/account/:userId/certificates/:certificateId", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));

    if (!user) return res.status(404).json({ message: "Account not found" });

    user.certificates = Array.isArray(user.certificates) ? user.certificates : [];
    const originalCount = user.certificates.length;
    user.certificates = user.certificates.filter((certificate) => String(certificate.id) !== String(req.params.certificateId));

    if (user.certificates.length === originalCount) return res.status(404).json({ message: "Certificate not found" });

    saveUsers();
    return res.json({ message: "Certificate removed", certificates: user.certificates });
});

app.post("/api/account/:userId/progress", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));
    const course = courses.find((item) => String(item.id) === String(req.body?.courseId));
    const lesson = course?.lessons?.find((item) => String(item.id) === String(req.body?.lessonId));
    const moduleNumber = Number(req.body?.lessonId);

    if (!user || !course || (!lesson && (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > course.modules.length))) {
        return res.status(404).json({ message: "Course, lesson, or account not found" });
    }

    user.progress = Array.isArray(user.progress) ? user.progress : [];
    const existingProgress = user.progress.find(
        (item) => String(item.courseId) === String(course.id) && String(item.lessonId) === String(lesson.id),
    );

    if (existingProgress) {
        existingProgress.watched = Boolean(req.body.watched);
        existingProgress.updatedAt = new Date().toISOString();
    } else {
        user.progress.push({
            courseId: course.id,
            lessonId: lesson.id,
            watched: Boolean(req.body.watched),
            updatedAt: new Date().toISOString(),
        });
    }

    saveUsers();

    return res.json({
        message: "Progress saved",
        progress: user.progress,
        watchedCourses: getWatchedCourses(user),
    });
});

app.post("/api/account/:userId/assessment", (req, res) => {
    const user = users.find((candidate) => String(candidate.id) === String(req.params.userId));
    const course = courses.find((item) => String(item.id) === String(req.body?.courseId));
    const score = Number(req.body?.score);

    if (!user || !course || !Number.isFinite(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: "A valid account, course, and score are required" });
    }

    user.assessments = Array.isArray(user.assessments) ? user.assessments : [];
    const existingAssessment = user.assessments.find(
        (assessment) => String(assessment.courseId) === String(course.id),
    );
    const savedAssessment = {
        courseId: course.id,
        score: Math.round(score),
        completedAt: new Date().toISOString(),
    };

    if (existingAssessment) Object.assign(existingAssessment, savedAssessment);
    else user.assessments.push(savedAssessment);

    if (savedAssessment.score >= 80) {
        user.certificates = Array.isArray(user.certificates) ? user.certificates : [];
        const learnlyCertificate = sanitizeCertificate({
            id: `learnly-${course.id}`,
            title: course.title,
            issuer: "Learnly Academy",
            issueDate: savedAssessment.completedAt.slice(0, 10),
            credentialId: `LEARNLY-${user.id}-${course.id}`,
            skills: [course.topic],
            courseId: course.id,
            score: savedAssessment.score,
        }, "learnly");
        const existingCertificateIndex = user.certificates.findIndex((certificate) => certificate.id === learnlyCertificate.id);
        if (existingCertificateIndex >= 0) user.certificates[existingCertificateIndex] = learnlyCertificate;
        else user.certificates.unshift(learnlyCertificate);
    }

    saveUsers();
    return res.json({ message: "Assessment saved", assessment: savedAssessment });
});

function publicUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
}

function getWatchedCourses(user) {
    return (user.progress || [])
        .filter((progress) => progress.watched)
        .map((progress) => {
            const course = courses.find((item) => String(item.id) === String(progress.courseId));
            const lesson = course?.lessons?.find((item) => String(item.id) === String(progress.lessonId));
            return course && lesson
                ? { courseId: course.id, courseTitle: course.title, lessonId: lesson.id, lessonTitle: lesson.title, updatedAt: progress.updatedAt }
                : null;
        })
        .filter(Boolean);
}

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Learnly API running on http://localhost:${PORT}`);
});