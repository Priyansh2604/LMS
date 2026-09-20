require("dotenv").config();

const pool = require("./db");
const defaultCourses = require("./courseData");

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query(`CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                email VARCHAR(120) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'student',
                course_interest VARCHAR(120),
                city VARCHAR(120),
                location VARCHAR(120),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                topic VARCHAR(120),
                description TEXT,
                overview TEXT,
                image VARCHAR(500),
                alt VARCHAR(255),
                duration_label VARCHAR(120),
                level VARCHAR(60),
                instructor VARCHAR(120),
                wikimedia_title VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS modules (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                module_order INTEGER NOT NULL DEFAULT 0
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS course_outcomes (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                outcome TEXT NOT NULL,
                outcome_order INTEGER NOT NULL DEFAULT 0
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                video_title VARCHAR(255),
                video_url TEXT,
                duration VARCHAR(60),
                lesson_order INTEGER NOT NULL DEFAULT 0
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                watched BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (user_id, course_id, lesson_id)
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS assessments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
                completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (user_id, course_id)
            )`);

        await client.query(`CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                issuer VARCHAR(255) NOT NULL,
                issue_date DATE,
                credential_url TEXT,
                image_data TEXT,
                credential_id VARCHAR(255),
                skills TEXT[] NOT NULL DEFAULT '{}',
                source VARCHAR(30) NOT NULL DEFAULT 'external',
                course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
                score INTEGER CHECK (score >= 0 AND score <= 100),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`);

        await client.query("BEGIN");

        console.log(`Seeding ${defaultCourses.length} courses...`);

        for (const course of defaultCourses) {

            // Check whether this course already exists
            const existingCourse = await client.query(
                `SELECT id FROM courses WHERE title = $1`,
                [course.title]
            );

            let courseId;

            if (existingCourse.rows.length > 0) {
                courseId = existingCourse.rows[0].id;

                console.log(`↻ Already exists: ${course.title}`);

                continue;
            }

            // Insert course
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
                    course.title,
                    course.topic,
                    course.durationLabel,
                    course.level,
                    course.instructor,
                    course.wikimediaTitle || null,
                    course.description,
                    course.overview,
                    course.image || null,
                    course.alt || null,
                ]
            );

            courseId = courseResult.rows[0].id;

            // Insert modules
            if (Array.isArray(course.modules)) {
                for (let i = 0; i < course.modules.length; i++) {
                    await client.query(
                        `INSERT INTO modules
                            (course_id, title, module_order)
                         VALUES ($1, $2, $3)`,
                        [courseId, course.modules[i], i + 1]
                    );
                }
            }

            // Insert outcomes
            if (Array.isArray(course.outcomes)) {
                for (let i = 0; i < course.outcomes.length; i++) {
                    await client.query(
                        `INSERT INTO course_outcomes
                            (course_id, outcome, outcome_order)
                         VALUES ($1, $2, $3)`,
                        [courseId, course.outcomes[i], i + 1]
                    );
                }
            }

            // Insert lessons
            if (Array.isArray(course.lessons)) {
                for (let i = 0; i < course.lessons.length; i++) {
                    const lesson = course.lessons[i];

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
                            lesson.videoTitle || null,
                            lesson.videoUrl || null,
                            lesson.duration || null,
                            i + 1,
                        ]
                    );
                }
            }

            console.log(`✓ ${course.title}`);
        }

        await client.query("COMMIT");

        console.log("\n✅ Courses successfully seeded!");

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("❌ Seeding failed:");
        console.error(error);

    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();