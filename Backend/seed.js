require("dotenv").config();

const pool = require("./db");
const defaultCourses = require("./courseData");

async function seedDatabase() {
    const client = await pool.connect();

    try {
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