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
- Responsive React frontend

## Tech Stack

- Frontend: React 19, React Router, Vite, Chart.js
- Backend: Node.js, Express 5
- Data storage: In-memory arrays for the current prototype

## Project Structure

```text
LMS/
├── Backend/
│   ├── package.json
│   └── script.js             # Express API and in-memory course data
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

Start the backend in one terminal:

```bash
npm run start:backend
```

The API runs at `http://localhost:5000`.

Start the frontend in another terminal:

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
| `npm run dev` | Start the Vite development server |
| `npm run start:backend` | Start the Express API |
| `npm start` | Alias for starting the backend |
| `npm run build` | Create a production frontend build |
| `npm run lint` | Run the frontend ESLint checks |

## Environment Variables

The frontend uses the following optional variable for the API base URL:

```bash
VITE_API_URL=http://localhost:5000
```

If it is not set, the frontend defaults to `http://localhost:5000`.

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
- `GET /api/account/:userId` - Get account details and watched courses
- `POST /api/account/:userId/progress` - Save lesson progress

## Important Notes

- User accounts, progress, and course edits are stored only in memory. Restarting the backend resets them.
- Authentication is intended for local development and demonstration. Passwords are not persisted securely and there is no session or token system yet.
- Course images and lesson videos use remote URLs, so an internet connection may be needed for all media to load.

## Production Improvements

Before deploying, add a persistent database, password hashing, token-based authentication, request validation, role-based API authorization, and environment-specific CORS configuration.
