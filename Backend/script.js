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
            [req.params.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Account not found",
            });
        }

        const user = userResult.rows[0];

        // Get course progress
        const progressResult = await pool.query(
            `SELECT
            c.id AS course_id,
            c.title AS course_title,

            (
                SELECT COUNT(*)
                FROM lessons l
                WHERE l.course_id = c.id
            )::int AS total_lessons,

            (
                SELECT COUNT(*)
                FROM progress p2
                WHERE p2.user_id = $1
                AND p2.course_id = c.id
                AND p2.watched = true
            )::int AS completed_lessons,

            MAX(p.updated_at) AS updated_at

            FROM progress p
            JOIN courses c
                ON c.id = p.course_id

            WHERE p.user_id = $1

            GROUP BY c.id, c.title

            ORDER BY MAX(p.updated_at) DESC`,
            [req.params.userId]
        );

        const watchedCourses = progressResult.rows.map((course) => {
            const totalLessons = course.total_lessons;
            const completedLessons = course.completed_lessons;

            const percentage =
                totalLessons === 0
                    ? 0
                    : Math.round(
                        (completedLessons / totalLessons) * 100
                    );

            return {
                courseId: course.course_id,
                courseTitle: course.course_title,
                totalLessons,
                completedLessons,
                percentage,
                updatedAt: course.updated_at,
            };
        });

        return res.json({
            user: publicUser(user),
            watchedCourses,
        });

    } catch (error) {
        console.error("Account error:", error);

        return res.status(500).json({
            message: "Unable to fetch account",
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

        return res.json({
            message: "Progress saved",
            progress: progressResult.rows[0],
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