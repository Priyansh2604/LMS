# Learnly

Learnly is a full-stack learning management system built with React, Vite, and Express. Learners can explore courses, take quizzes, watch lessons, track progress, and view their skill passport. Instructors can create and manage courses and lesson content.

## Features

- Browse learning paths and courses by topic
- View course overviews, modules, outcomes, and lessons
- Learner and instructor account registration and sign-in
- Protected course content for signed-in users
- Lesson watch-progress tracking
- Quiz experience and skill passport
- Instructor dashboard for creating and updating courses and lessons
- Light and dark themes
- LibreTranslate language switching for Hindi and other supported languages
- Responsive React frontend

## Tech Stack

- Frontend: React 19, React Router, Vite, Chart.js
- Backend: Node.js, Express 5, PostgreSQL
- Data storage: PostgreSQL for user accounts, progress, assessments, and certificates, with seeded in-memory course data

## Project Structure

```text
LMS/
├── Backend/
│   ├── package.json
│   ├── db.js                # PostgreSQL connection pool
│   ├── seed.js              # Create tables and seed courses
│   ├── courseData.js        # Default course data
│   └── script.js            # Express API
├── Frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/assets/           # React pages, components, and styles
├── package.json              # Root convenience scripts
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm

## Installation

Install dependencies in both application folders:

```bash
npm --prefix Backend install
npm --prefix Frontend install
```

## Running the Application

Start both the backend and frontend together:

```bash
npm run dev
```

This starts the API at `http://localhost:5001` and Vite at `http://localhost:5173`.

To run them in separate terminals instead, start the backend in one:

```bash
npm run start:backend
```

The API runs at `http://localhost:5001`.

Then start the frontend in another terminal:

```bash
npm run dev
```

Vite prints the local frontend URL, usually `http://localhost:5173`.

You can also run the backend from the `Backend` directory:

```bash
cd Backend
npm start
```

## Available Scripts

Run these commands from the project root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express API and Vite development server together |
| `npm run start:backend` | Start the Express API |
| `npm start` | Alias for starting the backend |
| `npm run build` | Create a production frontend build |
| `npm run lint` | Run the frontend ESLint checks |

## Environment Variables

The frontend uses the following optional variable for the API base URL:

```bash
VITE_API_URL=http://localhost:5001
```

The backend proxies translation requests to LibreTranslate or Google Gemini. Configure the provider when starting the backend:

```bash
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-flash-latest

LIBRETRANSLATE_URL=https://libretranslate.com
LIBRETRANSLATE_API_KEY=your-api-key
```

For Windows, create `Backend/.env` from `Backend/.env.example`, add your real API key, and restart the backend:

```powershell
Copy-Item Backend/.env.example Backend/.env
npm run start:backend
```

For a self-hosted LibreTranslate instance, set `LIBRETRANSLATE_URL` to its base URL. The language selector is available in the main header.

If it is not set, the frontend defaults to `http://localhost:5001`.

## API Endpoints

### Health and courses

- `GET /` - API status message
- `GET /api/health` - Health check
- `GET /api/courses` - List all courses
- `GET /api/courses/:courseId` - Get one course
- `POST /api/courses` - Create a course
- `PUT /api/courses/:courseId` - Update a course
- `POST /api/courses/:courseId/content` - Add a lesson
- `PUT /api/courses/:courseId/content/:lessonId` - Update a lesson

### Authentication and learner progress

- `POST /api/auth/register` - Create a learner or instructor account
- `POST /api/auth/login` - Sign in as a learner or instructor
- `GET /api/account/:userId` - Get account details, watched courses, certificates, completions, and recommendations
- `POST /api/account/:userId/progress` - Save lesson progress
- `POST /api/account/:userId/assessment` - Save a course assessment and award a certificate at 80% or higher
- `POST /api/account/:userId/certificates` - Add an external certificate
- `PUT /api/account/:userId/certificates/:certificateId` - Update a certificate
- `DELETE /api/account/:userId/certificates/:certificateId` - Remove a certificate
- `GET /api/analytics` - Instructor dashboard analytics
- `POST /api/translate` - Translate text through LibreTranslate or Gemini

## Important Notes

- User accounts, progress, assessments, certificates, and course edits are stored in PostgreSQL. Run `node seed.js` in `Backend` first to create the tables and seed the courses.
- Authentication is intended for local development and demonstration. Passwords are hashed but there is no session or token system yet.
- Course images and lesson videos use remote URLs, so an internet connection may be needed for all media to load.

## Production Improvements

Before deploying, add a persistent database, password hashing, token-based authentication, request validation, role-based API authorization, and environment-specific CORS configuration.
