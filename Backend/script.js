const express = require("express");

const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5001;
const defaultCourses = require("./courseData");

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

app.use(express.json());

app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isLocalFrontend = requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);

    if (isLocalFrontend) {
        res.header("Access-Control-Allow-Origin", requestOrigin);
        res.header("Vary", "Origin");
    }

    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

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

app.get("/api/courses", async (req, res) => {
    try {
        const coursesResult = await pool.query(`
            SELECT
                id,
                title,
                topic,
                duration_label,
                level,
                instructor,
                wikimedia_title,
                description,
                overview,
                image,
                alt
            FROM courses
            ORDER BY id
        `);

        const courses = [];

        for (const course of coursesResult.rows) {
            const modulesResult = await pool.query(
                `SELECT title
                 FROM modules
                 WHERE course_id = $1
                 ORDER BY module_order`,
                [course.id]
            );

            const outcomesResult = await pool.query(
                `SELECT outcome
                 FROM course_outcomes
                 WHERE course_id = $1
                 ORDER BY outcome_order`,
                [course.id]
            );

            const lessonsResult = await pool.query(
                `SELECT
                    id,
                    title,
                    description,
                    video_title,
                    video_url,
                    duration
                 FROM lessons
                 WHERE course_id = $1
                 ORDER BY lesson_order`,
                [course.id]
            );

            courses.push({
                id: course.id,
                title: course.title,
                topic: course.topic,
                durationLabel: course.duration_label,
                level: course.level,
                instructor: course.instructor,
                wikimediaTitle: course.wikimedia_title,
                description: course.description,
                overview: course.overview,
                image: course.image,
                alt: course.alt,

                modules: modulesResult.rows.map((item) => item.title),

                outcomes: outcomesResult.rows.map((item) => item.outcome),

                lessons: lessonsResult.rows.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    videoTitle: lesson.video_title,
                    videoUrl: lesson.video_url,
                    duration: lesson.duration,
                })),
            });
        }

        return res.json({ courses });

    } catch (error) {
        console.error("Get courses error:", error);

        return res.status(500).json({
            message: "Unable to fetch courses",
        });
    }
});

app.get("/api/analytics", async (req, res) => {
    try {
        const coursesResult = await pool.query(
            `SELECT id, title, topic
             FROM courses
             ORDER BY id`
        );

        const courseAnalytics = [];

        for (const course of coursesResult.rows) {
            const learnersResult = await pool.query(
                `SELECT
                    u.id,
                    u.name,
                    u.email,
                    COUNT(DISTINCT l.id)::int AS total_lessons,
                    COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.watched = true)::int AS watched_lessons
                 FROM users u
                 LEFT JOIN lessons l ON l.course_id = $1
                 LEFT JOIN progress lp ON lp.lesson_id = l.id AND lp.course_id = $1 AND lp.user_id = u.id
                 WHERE u.role != 'instructor'
                   AND (
                        EXISTS (
                            SELECT 1
                            FROM progress p
                            WHERE p.user_id = u.id AND p.course_id = $1
                        )
                        OR UPPER(u.course_interest) = UPPER($2)
                   )
                 GROUP BY u.id, u.name, u.email
                 ORDER BY u.id`,
                [course.id, course.topic]
            );

            const students = [];

            for (let i = 0; i < learnersResult.rows.length; i++) {
                const learner = learnersResult.rows[i];
                const totalLessons = Math.max(learner.total_lessons, 1);
                const completion = Math.min(100, Math.round((learner.watched_lessons / totalLessons) * 100));

                const assessmentResult = await pool.query(
                    `SELECT score
                     FROM assessments
                     WHERE user_id = $1 AND course_id = $2`,
                    [learner.id, course.id]
                );

                const assessmentScore = assessmentResult.rows.length
                    ? assessmentResult.rows[0].score
                    : null;

                const recommendation = assessmentScore !== null && assessmentScore < 80
                    ? "Revisit the assessment topics, then retry the final check before moving on."
                    : completion >= 80
                    ? "Ready for an applied project or advanced challenge."
                    : completion >= 40
                        ? "Review the next lesson and practise with a short exercise."
                        : "Start with the first lesson and schedule two focused study sessions.";

                students[i] = {
                    id: learner.id,
                    name: learner.name,
                    email: learner.email,
                    completion,
                    assessmentScore,
                    watchedLessons: learner.watched_lessons,
                    totalLessons: learner.total_lessons,
                    recommendation,
                };
            }

            const averageCompletion = students.length
                ? Math.round(students.reduce((total, student) => total + student.completion, 0) / students.length)
                : 0;

            courseAnalytics.push({
                id: course.id,
                title: course.title,
                topic: course.topic,
                enrollment: students.length,
                averageCompletion,
                students,
            });
        }

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

    } catch (error) {
        console.error("Analytics error:", error);

        return res.status(500).json({
            message: "Unable to fetch analytics",
        });
    }
});

app.get("/api/courses/:courseId", async (req, res) => {
    try {
        const courseResult = await pool.query(
            `SELECT
                id,
                title,
                topic,
                duration_label,
                level,
                instructor,
                wikimedia_title,
                description,
                overview,
                image,
                alt
             FROM courses
             WHERE id = $1`,
            [req.params.courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const course = courseResult.rows[0];

        const modulesResult = await pool.query(
            `SELECT title
             FROM modules
             WHERE course_id = $1
             ORDER BY module_order`,
            [course.id]
        );

        const outcomesResult = await pool.query(
            `SELECT outcome
             FROM course_outcomes
             WHERE course_id = $1
             ORDER BY outcome_order`,
            [course.id]
        );

        const lessonsResult = await pool.query(
            `SELECT
                id,
                title,
                description,
                video_title,
                video_url,
                duration
             FROM lessons
             WHERE course_id = $1
             ORDER BY lesson_order`,
            [course.id]
        );

        return res.json({
            course: {
                id: course.id,
                title: course.title,
                topic: course.topic,
                durationLabel: course.duration_label,
                level: course.level,
                instructor: course.instructor,
                wikimediaTitle: course.wikimedia_title,
                description: course.description,
                overview: course.overview,
                image: course.image,
                alt: course.alt,

                modules: modulesResult.rows.map((item) => item.title),

                outcomes: outcomesResult.rows.map((item) => item.outcome),

                lessons: lessonsResult.rows.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    videoTitle: lesson.video_title,
                    videoUrl: lesson.video_url,
                    duration: lesson.duration,
                })),
            },
        });

    } catch (error) {
        console.error("Get course error:", error);

        return res.status(500).json({
            message: "Unable to fetch course",
        });
    }
});

app.post("/api/courses", async (req, res) => {
    const client = await pool.connect();

    try {
        const payload = req.body || {};

        const title = String(payload.title || "").trim();
        const topic = String(payload.topic || "").trim();
        const description = String(payload.description || "").trim();
        const overview = String(payload.overview || "").trim();
        const instructor = String(payload.instructor || "").trim();

        const durationLabel =
            String(payload.durationLabel || "").trim() || "New course";

        const level =
            String(payload.level || "Beginner").trim();

        const image =
            String(
                payload.image ||
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
            ).trim();

        const alt =
            String(payload.alt || `${title} course`).trim();

        if (!title || !topic || !description || !overview || !instructor) {
            return res.status(400).json({
                message:
                    "Course title, topic, description, overview, and instructor are required.",
            });
        }

        await client.query("BEGIN");

        const courseResult = await client.query(
            `INSERT INTO courses
                (
                    title,
                    topic,
                    duration_label,
                    level,
                    instructor,
                    wikimedia_title,
                    description,
                    overview,
                    image,
                    alt
                )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [
                title,
                topic,
                durationLabel,
                level,
                instructor,
                topic,
                description,
                overview,
                image,
                alt,
            ]
        );

        const courseId = courseResult.rows[0].id;

        const outcomes =
            Array.isArray(payload.outcomes) && payload.outcomes.length
                ? payload.outcomes
                      .map((item) => String(item).trim())
                      .filter(Boolean)
                : [
                      "Learn the core concepts of this course",
                      "Apply your learnings in a practical way",
                      "Track your progress through the course modules",
                  ];

        for (let i = 0; i < outcomes.length; i++) {
            await client.query(
                `INSERT INTO course_outcomes
                    (course_id, outcome, outcome_order)
                 VALUES ($1, $2, $3)`,
                [courseId, outcomes[i], i + 1]
            );
        }

        const modules =
            sanitizeModules(payload.modules) ||
            ["Module 1", "Module 2", "Module 3"];

        for (let i = 0; i < modules.length; i++) {
            await client.query(
                `INSERT INTO modules
                    (course_id, title, module_order)
                 VALUES ($1, $2, $3)`,
                [courseId, modules[i], i + 1]
            );
        }

        if (Array.isArray(payload.lessons)) {
            for (let i = 0; i < payload.lessons.length; i++) {
                const lesson = sanitizeLesson(payload.lessons[i]);

                await client.query(
                    `INSERT INTO lessons
                        (
                            course_id,
                            title,
                            description,
                            video_title,
                            video_url,
                            duration,
                            lesson_order
                        )
                     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [
                        courseId,
                        lesson.title,
                        lesson.description,
                        lesson.videoTitle,
                        lesson.videoUrl,
                        lesson.duration,
                        i + 1,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Course created successfully",
            courseId,
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create course error:", error);

        return res.status(500).json({
            message: "Unable to create course",
        });

    } finally {
        client.release();
    }
});

app.put("/api/courses/:courseId", async (req, res) => {
    const client = await pool.connect();

    try {
        const courseId = req.params.courseId;
        const payload = req.body || {};

        const title = String(payload.title || "").trim();
        const topic = String(payload.topic || "").trim();
        const description = String(payload.description || "").trim();
        const overview = String(payload.overview || "").trim();
        const instructor = String(payload.instructor || "").trim();

        if (!title || !topic || !description || !overview || !instructor) {
            return res.status(400).json({
                message:
                    "Course title, topic, description, overview, and instructor are required.",
            });
        }

        const durationLabel =
            String(payload.durationLabel || "New course").trim();

        const level =
            String(payload.level || "Beginner").trim();

        const image =
            String(payload.image || "").trim();

        const alt =
            String(payload.alt || `${title} course`).trim();

        await client.query("BEGIN");

        // Check course exists
        const existingCourse = await client.query(
            `SELECT id
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        if (existingCourse.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Update main course
        await client.query(
            `UPDATE courses
             SET
                title = $1,
                topic = $2,
                duration_label = $3,
                level = $4,
                instructor = $5,
                wikimedia_title = $6,
                description = $7,
                overview = $8,
                image = $9,
                alt = $10
             WHERE id = $11`,
            [
                title,
                topic,
                durationLabel,
                level,
                instructor,
                topic,
                description,
                overview,
                image,
                alt,
                courseId,
            ]
        );

        // Update modules
        if (Array.isArray(payload.modules)) {
            await client.query(
                `DELETE FROM modules
                 WHERE course_id = $1`,
                [courseId]
            );

            const modules = sanitizeModules(payload.modules) || [];

            for (let i = 0; i < modules.length; i++) {
                await client.query(
                    `INSERT INTO modules
                        (course_id, title, module_order)
                     VALUES ($1, $2, $3)`,
                    [courseId, modules[i], i + 1]
                );
            }
        }

        // Update outcomes
        if (Array.isArray(payload.outcomes)) {
            await client.query(
                `DELETE FROM course_outcomes
                 WHERE course_id = $1`,
                [courseId]
            );

            const outcomes = payload.outcomes
                .map((item) => String(item).trim())
                .filter(Boolean);

            for (let i = 0; i < outcomes.length; i++) {
                await client.query(
                    `INSERT INTO course_outcomes
                        (course_id, outcome, outcome_order)
                     VALUES ($1, $2, $3)`,
                    [courseId, outcomes[i], i + 1]
                );
            }
        }

        await client.query("COMMIT");

        // Return the updated course using the same API structure
        const updatedCourseResult = await pool.query(
            `SELECT
                id,
                title,
                topic,
                duration_label,
                level,
                instructor,
                wikimedia_title,
                description,
                overview,
                image,
                alt
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        const course = updatedCourseResult.rows[0];

        const modulesResult = await pool.query(
            `SELECT title
             FROM modules
             WHERE course_id = $1
             ORDER BY module_order`,
            [courseId]
        );

        const outcomesResult = await pool.query(
            `SELECT outcome
             FROM course_outcomes
             WHERE course_id = $1
             ORDER BY outcome_order`,
            [courseId]
        );

        const lessonsResult = await pool.query(
            `SELECT
                id,
                title,
                description,
                video_title,
                video_url,
                duration
             FROM lessons
             WHERE course_id = $1
             ORDER BY lesson_order`,
            [courseId]
        );

        return res.json({
            message: "Course updated successfully",
            course: {
                id: course.id,
                title: course.title,
                topic: course.topic,
                durationLabel: course.duration_label,
                level: course.level,
                instructor: course.instructor,
                wikimediaTitle: course.wikimedia_title,
                description: course.description,
                overview: course.overview,
                image: course.image,
                alt: course.alt,

                modules: modulesResult.rows.map(
                    (item) => item.title
                ),

                outcomes: outcomesResult.rows.map(
                    (item) => item.outcome
                ),

                lessons: lessonsResult.rows.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    description: lesson.description,
                    videoTitle: lesson.video_title,
                    videoUrl: lesson.video_url,
                    duration: lesson.duration,
                })),
            },
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Update course error:", error);

        return res.status(500).json({
            message: "Unable to update course",
        });

    } finally {
        client.release();
    }
});

app.post("/api/courses/:courseId/content", async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const {
            title,
            description,
            videoTitle,
            videoUrl,
            duration,
        } = req.body || {};

        if (!title || !description || !videoTitle || !videoUrl || !duration) {
            return res.status(400).json({
                message:
                    "Title, description, video title, video URL, and duration are required",
            });
        }

        // Check course exists
        const courseResult = await pool.query(
            `SELECT id, title
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Find next lesson order
        const orderResult = await pool.query(
            `SELECT COALESCE(MAX(lesson_order), 0) + 1 AS next_order
             FROM lessons
             WHERE course_id = $1`,
            [courseId]
        );

        const lessonOrder = orderResult.rows[0].next_order;

        // Insert lesson
        const lessonResult = await pool.query(
            `INSERT INTO lessons
                (
                    course_id,
                    title,
                    description,
                    video_title,
                    video_url,
                    duration,
                    lesson_order
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING
                id,
                title,
                description,
                video_title,
                video_url,
                duration,
                lesson_order`,
            [
                courseId,
                String(title).trim(),
                String(description).trim(),
                String(videoTitle).trim(),
                String(videoUrl).trim(),
                String(duration).trim(),
                lessonOrder,
            ]
        );

        const lesson = lessonResult.rows[0];

        return res.status(201).json({
            message: "Lesson added successfully",
            courseTitle: courseResult.rows[0].title,
            lesson: {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                videoTitle: lesson.video_title,
                videoUrl: lesson.video_url,
                duration: lesson.duration,
            },
        });

    } catch (error) {
        console.error("Add lesson error:", error);

        return res.status(500).json({
            message: "Unable to add lesson",
        });
    }
});

app.put("/api/courses/:courseId/content/:lessonId", async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;

        const {
            title,
            description,
            videoTitle,
            videoUrl,
            duration,
        } = req.body || {};

        if (!title || !description || !videoTitle || !videoUrl || !duration) {
            return res.status(400).json({
                message:
                    "Title, description, video title, video URL, and duration are required",
            });
        }

        // Check that the lesson exists AND belongs to this course
        const existingLesson = await pool.query(
            `SELECT
                l.id,
                l.course_id,
                c.title AS course_title
             FROM lessons l
             JOIN courses c ON c.id = l.course_id
             WHERE l.id = $1
               AND l.course_id = $2`,
            [lessonId, courseId]
        );

        if (existingLesson.rows.length === 0) {
            return res.status(404).json({
                message: "Lesson not found",
            });
        }

        // Update lesson in PostgreSQL
        const result = await pool.query(
            `UPDATE lessons
             SET
                title = $1,
                description = $2,
                video_title = $3,
                video_url = $4,
                duration = $5
             WHERE id = $6
               AND course_id = $7
             RETURNING
                id,
                title,
                description,
                video_title,
                video_url,
                duration`,
            [
                String(title).trim(),
                String(description).trim(),
                String(videoTitle).trim(),
                String(videoUrl).trim(),
                String(duration).trim(),
                lessonId,
                courseId,
            ]
        );

        const lesson = result.rows[0];

        return res.json({
            message: "Lesson updated successfully",
            courseTitle: existingLesson.rows[0].course_title,
            lesson: {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                videoTitle: lesson.video_title,
                videoUrl: lesson.video_url,
                duration: lesson.duration,
            },
        });

    } catch (error) {
        console.error("Update lesson error:", error);

        return res.status(500).json({
            message: "Unable to update lesson",
        });
    }
});

app.post("/api/auth/register", async (req, res) => {
    try {
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
                message:
                    "Name, email, password, course interest, city, and location are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if the email already exists in PostgreSQL
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        // Never store the actual password
        const passwordHash = await bcrypt.hash(password, 12);

        const userRole =
            role === "instructor" ? "instructor" : "learner";

        const result = await pool.query(
            `INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    course_interest,
                    city,
                    location,
                    role
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING
                id,
                name,
                email,
                course_interest,
                city,
                location,
                role,
                created_at`,
            [
                name.trim(),
                normalizedEmail,
                passwordHash,
                courseInterest,
                city.trim(),
                location.trim(),
                userRole,
            ]
        );

        const user = result.rows[0];

        return res.status(201).json({
            message: "Account created successfully",
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Unable to create account",
        });
    }
});


app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT
                id,
                name,
                email,
                password_hash,
                course_interest,
                city,
                location,
                role,
                created_at
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const requestedRole =
            role === "instructor" ? "instructor" : "learner";

        if (user.role !== requestedRole) {
            return res.status(403).json({
                message: `This account is registered as a ${user.role}. Please sign in as the correct role.`,
            });
        }

        return res.json({
            message: "Signed in successfully",
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Unable to sign in",
        });
    }
});


app.get("/api/account/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get user
        const userResult = await pool.query(
            `SELECT
                id,
                name,
                email,
                course_interest,
                city,
                location,
                role,
                created_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found",
            });
        }

        const user = userResult.rows[0];

        const progressResult = await pool.query(
            `SELECT
                p.course_id,
                p.lesson_id,
                p.watched,
                p.updated_at,
                c.title AS course_title,
                l.title AS lesson_title
             FROM progress p
             JOIN courses c ON c.id = p.course_id
             JOIN lessons l ON l.id = p.lesson_id
             WHERE p.user_id = $1
             ORDER BY p.updated_at DESC`,
            [userId]
        );

        const progress = progressResult.rows.map((row) => ({
            courseId: row.course_id,
            lessonId: row.lesson_id,
            watched: row.watched,
            updatedAt: row.updated_at,
        }));

        const watchedCourses = progressResult.rows
            .filter((row) => row.watched)
            .map((row) => ({
                courseId: row.course_id,
                courseTitle: row.course_title,
                lessonId: row.lesson_id,
                lessonTitle: row.lesson_title,
                updatedAt: row.updated_at,
            }));

        const certificates = await getCertificates(userId);

        const completedResult = await pool.query(
            `SELECT
                a.course_id,
                c.title,
                c.topic,
                a.score,
                a.completed_at
             FROM assessments a
             JOIN courses c ON c.id = a.course_id
             WHERE a.user_id = $1
               AND a.score >= 80
             ORDER BY a.completed_at DESC`,
            [userId]
        );

        const completedCourses = completedResult.rows.map((row) => ({
            courseId: row.course_id,
            title: row.title,
            topic: row.topic,
            score: row.score,
            completedAt: row.completed_at,
        }));

        const recommendations = await getRecommendations(user);

        return res.json({
            user: {
                ...publicUser(user),
                progress,
            },
            watchedCourses,
            certificates,
            completedCourses,
            recommendations,
        });

    } catch (error) {
        console.error("Account error:", error);

        return res.status(500).json({
            message: "Unable to fetch account",
        });
    }
});

app.post("/api/account/:userId/certificates", async (req, res) => {
    try {
        const userId = req.params.userId;

        const userResult = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found",
            });
        }

        const certificate = sanitizeCertificate(req.body, "external");

        if (!certificate) {
            return res.status(400).json({
                message: "Certificate title and issuer are required, with a valid credential URL if provided.",
            });
        }

        await pool.query(
            `INSERT INTO certificates
                (
                    id,
                    user_id,
                    title,
                    issuer,
                    issue_date,
                    credential_url,
                    image_data,
                    credential_id,
                    skills,
                    source,
                    course_id,
                    score,
                    created_at
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                certificate.id,
                userId,
                certificate.title,
                certificate.issuer,
                certificate.issueDate || null,
                certificate.credentialUrl || null,
                certificate.imageData || null,
                certificate.credentialId || null,
                certificate.skills,
                certificate.source,
                certificate.courseId,
                certificate.score,
                certificate.createdAt,
            ]
        );

        return res.status(201).json({
            message: "Certificate added",
            certificate,
            certificates: await getCertificates(userId),
        });

    } catch (error) {
        console.error("Add certificate error:", error);

        return res.status(500).json({
            message: "Unable to add certificate",
        });
    }
});

app.put("/api/account/:userId/certificates/:certificateId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const certificateId = req.params.certificateId;

        const existing = await pool.query(
            `SELECT id
             FROM certificates
             WHERE user_id = $1 AND id = $2`,
            [userId, certificateId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "Certificate not found",
            });
        }

        const certificate = sanitizeCertificate(req.body, "external");

        if (!certificate) {
            return res.status(400).json({
                message: "Certificate title and issuer are required, with a valid credential URL if provided.",
            });
        }

        certificate.id = certificateId;

        await pool.query(
            `UPDATE certificates
             SET
                title = $1,
                issuer = $2,
                issue_date = $3,
                credential_url = $4,
                image_data = $5,
                credential_id = $6,
                skills = $7,
                source = $8,
                course_id = $9,
                score = $10
             WHERE user_id = $11 AND id = $12`,
            [
                certificate.title,
                certificate.issuer,
                certificate.issueDate || null,
                certificate.credentialUrl || null,
                certificate.imageData || null,
                certificate.credentialId || null,
                certificate.skills,
                certificate.source,
                certificate.courseId,
                certificate.score,
                userId,
                certificateId,
            ]
        );

        return res.json({
            message: "Certificate updated",
            certificate,
            certificates: await getCertificates(userId),
        });

    } catch (error) {
        console.error("Update certificate error:", error);

        return res.status(500).json({
            message: "Unable to update certificate",
        });
    }
});

app.delete("/api/account/:userId/certificates/:certificateId", async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await pool.query(
            `DELETE FROM certificates
             WHERE user_id = $1 AND id = $2
             RETURNING id`,
            [userId, req.params.certificateId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Certificate not found",
            });
        }

        return res.json({
            message: "Certificate removed",
            certificates: await getCertificates(userId),
        });

    } catch (error) {
        console.error("Delete certificate error:", error);

        return res.status(500).json({
            message: "Unable to remove certificate",
        });
    }
});

app.post("/api/account/:userId/assessment", async (req, res) => {
    try {
        const userId = req.params.userId;
        const courseId = req.body?.courseId;
        const score = Number(req.body?.score);

        const userResult = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found",
            });
        }

        const courseResult = await pool.query(
            `SELECT id, title, topic
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        if (!Number.isFinite(score) || score < 0 || score > 100) {
            return res.status(400).json({
                message: "A valid account, course, and score are required",
            });
        }

        const savedAssessment = {
            courseId: Number(courseId),
            score: Math.round(score),
            completedAt: new Date().toISOString(),
        };

        await pool.query(
            `INSERT INTO assessments
                (user_id, course_id, score, completed_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, course_id)
             DO UPDATE SET
                score = EXCLUDED.score,
                completed_at = EXCLUDED.completed_at`,
            [userId, courseId, savedAssessment.score, savedAssessment.completedAt]
        );

        if (savedAssessment.score >= 80) {
            const learnlyCertificate = sanitizeCertificate({
                id: `learnly-${courseId}`,
                title: courseResult.rows[0].title,
                issuer: "Learnly Academy",
                issueDate: savedAssessment.completedAt.slice(0, 10),
                credentialId: `LEARNLY-${userId}-${courseId}`,
                skills: [courseResult.rows[0].topic],
                courseId: Number(courseId),
                score: savedAssessment.score,
            }, "learnly");

            await pool.query(
                `INSERT INTO certificates
                    (
                        id,
                        user_id,
                        title,
                        issuer,
                        issue_date,
                        credential_url,
                        image_data,
                        credential_id,
                        skills,
                        source,
                        course_id,
                        score,
                        created_at
                    )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id)
                 DO UPDATE SET
                    title = EXCLUDED.title,
                    issuer = EXCLUDED.issuer,
                    issue_date = EXCLUDED.issue_date,
                    credential_id = EXCLUDED.credential_id,
                    skills = EXCLUDED.skills,
                    course_id = EXCLUDED.course_id,
                    score = EXCLUDED.score,
                    created_at = EXCLUDED.created_at`,
                [
                    learnlyCertificate.id,
                    userId,
                    learnlyCertificate.title,
                    learnlyCertificate.issuer,
                    learnlyCertificate.issueDate || null,
                    learnlyCertificate.credentialUrl || null,
                    learnlyCertificate.imageData || null,
                    learnlyCertificate.credentialId || null,
                    learnlyCertificate.skills,
                    learnlyCertificate.source,
                    learnlyCertificate.courseId,
                    learnlyCertificate.score,
                    learnlyCertificate.createdAt,
                ]
            );
        }

        return res.json({
            message: "Assessment saved",
            assessment: savedAssessment,
        });

    } catch (error) {
        console.error("Save assessment error:", error);

        return res.status(500).json({
            message: "Unable to save assessment",
        });
    }
});

app.post("/api/account/:userId/progress", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { courseId, lessonId, watched } = req.body || {};

        if (!courseId || !lessonId) {
            return res.status(400).json({
                message: "courseId and lessonId are required",
            });
        }

        // Check user
        const userResult = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found",
            });
        }

        // Check course
        const courseResult = await pool.query(
            `SELECT id, title
             FROM courses
             WHERE id = $1`,
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Check lesson belongs to this course
        const lessonResult = await pool.query(
            `SELECT id, title
             FROM lessons
             WHERE id = $1
               AND course_id = $2`,
            [lessonId, courseId]
        );

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({
                message: "Lesson not found for this course",
            });
        }

        // Insert or update progress
        const progressResult = await pool.query(
            `INSERT INTO progress
                (user_id, course_id, lesson_id, watched, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (user_id, course_id, lesson_id)
             DO UPDATE SET
                watched = EXCLUDED.watched,
                updated_at = NOW()
             RETURNING
                id,
                user_id,
                course_id,
                lesson_id,
                watched,
                updated_at`,
            [
                userId,
                courseId,
                lessonId,
                Boolean(watched),
            ]
        );

        const savedProgress = progressResult.rows[0];

        return res.json({
            message: "Progress saved",
            progress: [savedProgress],
        });

    } catch (error) {
        console.error("Save progress error:", error);

        return res.status(500).json({
            message: "Unable to save progress",
        });
    }
});

app.get("/api/account/:userId/progress", async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await pool.query(
            `SELECT
                p.id,
                p.user_id,
                p.course_id,
                p.lesson_id,
                p.watched,
                p.updated_at,
                c.title AS course_title,
                l.title AS lesson_title
             FROM progress p
             JOIN courses c ON c.id = p.course_id
             JOIN lessons l ON l.id = p.lesson_id
             WHERE p.user_id = $1
             ORDER BY p.updated_at DESC`,
            [userId]
        );

        return res.json({
            progress: result.rows,
        });

    } catch (error) {
        console.error("Get progress error:", error);

        return res.status(500).json({
            message: "Unable to fetch progress",
        });
    }
});

app.get("/api/account/:userId/courses/:courseId/progress", async (req, res) => {
    try {
        const { userId, courseId } = req.params;

        const result = await pool.query(
            `SELECT
                COUNT(l.id)::int AS total_lessons,
                COUNT(p.lesson_id) FILTER (WHERE p.watched = true)::int AS completed_lessons
             FROM lessons l
             LEFT JOIN progress p
                ON p.lesson_id = l.id
                AND p.course_id = l.course_id
                AND p.user_id = $1
             WHERE l.course_id = $2`,
            [userId, courseId]
        );

        const totalLessons = result.rows[0].total_lessons;
        const completedLessons = result.rows[0].completed_lessons;

        const percentage =
            totalLessons === 0
                ? 0
                : Math.round((completedLessons / totalLessons) * 100);

        return res.json({
            courseId: Number(courseId),
            totalLessons,
            completedLessons,
            percentage,
        });

    } catch (error) {
        console.error("Get course progress error:", error);

        return res.status(500).json({
            message: "Unable to calculate course progress",
        });
    }
});

function sanitizeCertificate(certificate = {}, source = "external") {
    const title = String(certificate.title || "").trim();
    const issuer = String(certificate.issuer || "").trim();

    if (!title || !issuer) {
        return null;
    }

    const allowedSkills = [];
    const skills = Array.isArray(certificate.skills) ? certificate.skills : [];

    for (const skill of skills) {
        const trimmedSkill = String(skill).trim();
        if (trimmedSkill && allowedSkills.indexOf(trimmedSkill) === -1) {
            allowedSkills.push(trimmedSkill);
        }
    }

    let credentialUrl = String(certificate.credentialUrl || "").trim();
    if (credentialUrl && !/^https?:\/\//.test(credentialUrl)) {
        credentialUrl = "";
    }

    const canSave = title && issuer && (credentialUrl ? true : true);
    if (!canSave) {
        return null;
    }

    return {
        id: String(certificate.id || `cert-${Date.now()}`),
        title,
        issuer,
        issueDate: String(certificate.issueDate || "").trim() || null,
        credentialUrl: credentialUrl || null,
        imageData: String(certificate.imageData || "").trim() || null,
        credentialId: String(certificate.credentialId || "").trim() || null,
        skills: allowedSkills,
        source,
        courseId:
            Number.isFinite(Number(certificate.courseId)) && Number(certificate.courseId) > 0
                ? Number(certificate.courseId)
                : null,
        score:
            Number.isFinite(Number(certificate.score))
                ? Math.max(0, Math.min(100, Math.round(Number(certificate.score))))
                : null,
        createdAt: new Date().toISOString(),
    };
}

async function getCertificates(userId) {
    const result = await pool.query(
        `SELECT
            id,
            title,
            issuer,
            issue_date,
            credential_url,
            image_data,
            credential_id,
            skills,
            source,
            course_id,
            score,
            created_at
         FROM certificates
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows.map((certificate) => ({
        id: certificate.id,
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.issue_date,
        credentialUrl: certificate.credential_url,
        imageData: certificate.image_data,
        credentialId: certificate.credential_id,
        skills: certificate.skills || [],
        source: certificate.source,
        courseId: certificate.course_id,
        score: certificate.score,
        createdAt: certificate.created_at,
    }));
}

async function getRecommendations(user) {
    const userInterest = user?.course_interest
        ? String(user.course_interest).trim().toLowerCase()
        : "";

    const coursesResult = await pool.query(
        `SELECT c.id, c.title, c.topic
         FROM courses c
         WHERE NOT EXISTS (
             SELECT 1
             FROM assessments a
             WHERE a.user_id = $1 AND a.course_id = c.id AND a.score >= 80
         )
         ORDER BY c.id
         LIMIT 50`,
        [user.id]
    );

    return coursesResult.rows
        .map((course) => {
            const interestMatch =
                userInterest &&
                String(course.topic || "").trim().toLowerCase() === userInterest;

            return {
                id: course.id,
                title: course.title,
                topic: course.topic,
                recommendationScore: interestMatch ? 1 : 0,
            };
        })
        .sort((a, b) => {
            if (b.recommendationScore !== a.recommendationScore) {
                return b.recommendationScore - a.recommendationScore;
            }
            return a.id - b.id;
        })
        .slice(0, 3)
        .map(({ recommendationScore, ...course }) => course);
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        courseInterest: user.course_interest,
        city: user.city,
        location: user.location,
        role: user.role,
        createdAt: user.created_at,
    };
}

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Learnly API running on http://localhost:${PORT}`);
});